'use server';

import { db } from '@/lib/db';
import { getPusherServer, getConversationChannel } from '@/services/realtime.service';
import { TESService } from '@/services/tes.service';
import { triggerNotification } from '@/lib/novu';
import { deleteRoom } from '@/lib/livekit/roomAdmin';
import { z } from 'zod';

const ALLOWED_CALL_DURATIONS_SECONDS = [900, 1800, 2700, 3600]; // 15/30/45/60 min

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});

const MEMBER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  title: true,
} as const;

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new Error('Not a participant of this conversation');
  return participant;
}

/**
 * Find the existing 1:1 conversation between two users, or create one.
 * Requires an ACCEPTED connection between them, same rule as before.
 */
export async function getOrCreateDirectConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) return { error: 'Cannot message yourself' };

  const connection = await db.connection.findFirst({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId, status: 'ACCEPTED' },
        { senderId: otherUserId, receiverId: userId, status: 'ACCEPTED' },
      ],
    },
  });

  if (!connection) return { error: 'You must be connected to message this person' };

  const existing = await db.conversationParticipant.findFirst({
    where: {
      userId,
      conversation: { isGroup: false, participants: { some: { userId: otherUserId } } },
    },
    select: { conversationId: true },
  });

  if (existing) return { success: true, conversationId: existing.conversationId };

  const conversation = await db.conversation.create({
    data: {
      isGroup: false,
      participants: { create: [{ userId }, { userId: otherUserId }] },
    },
  });

  return { success: true, conversationId: conversation.id };
}

/**
 * Create a new group conversation from the creator + a set of connected Oros.
 */
export async function createGroupConversation(creatorId: string, name: string, participantIds: string[]) {
  if (!name.trim()) return { error: 'Group name is required' };

  const uniqueIds = Array.from(new Set([creatorId, ...participantIds]));
  if (uniqueIds.length < 3) return { error: 'Pick at least 2 other Oros for a group' };

  // Verify every invitee is an accepted connection of the creator
  const connections = await db.connection.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: creatorId, receiverId: { in: participantIds } },
        { receiverId: creatorId, senderId: { in: participantIds } },
      ],
    },
  });
  const connectedIds = new Set(
    connections.map((c) => (c.senderId === creatorId ? c.receiverId : c.senderId))
  );
  const invalid = participantIds.filter((id) => !connectedIds.has(id));
  if (invalid.length > 0) return { error: 'You can only add Oros you are connected with' };

  const conversation = await db.conversation.create({
    data: {
      isGroup: true,
      name: name.trim(),
      participants: { create: uniqueIds.map((userId) => ({ userId })) },
    },
  });

  return { success: true, conversationId: conversation.id };
}

/**
 * Add one or more connected Oros to an existing conversation.
 */
export async function addParticipants(conversationId: string, actingUserId: string, userIds: string[]) {
  try {
    await assertParticipant(conversationId, actingUserId);

    const connections = await db.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: actingUserId, receiverId: { in: userIds } },
          { receiverId: actingUserId, senderId: { in: userIds } },
        ],
      },
    });
    const connectedIds = new Set(
      connections.map((c) => (c.senderId === actingUserId ? c.receiverId : c.senderId))
    );
    const invalid = userIds.filter((id) => !connectedIds.has(id));
    if (invalid.length > 0) return { error: 'You can only add Oros you are connected with' };

    await db.conversation.update({
      where: { id: conversationId },
      data: { isGroup: true },
    });

    await Promise.all(
      userIds.map((userId) =>
        db.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId, userId } },
          update: {},
          create: { conversationId, userId },
        })
      )
    );

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to add participants' };
  }
}

/**
 * Deletes a plain chat message (e.g. a legacy pre-CallSession "Join Meeting"
 * message with no CallSession record to delete it through). Sender-only.
 */
export async function deleteMessage(messageId: string, userId: string) {
  try {
    const message = await db.message.findUnique({ where: { id: messageId } });
    if (!message) return { error: 'Message not found' };
    if (message.senderId !== userId) return { error: 'You can only delete your own messages' };
    await db.message.delete({ where: { id: messageId } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to delete message' };
  }
}

export async function sendMessage(senderId: string, formData: FormData) {
  const conversationId = formData.get('conversationId') as string;
  const rawContent = formData.get('content') as string;

  try {
    const validated = messageSchema.parse({ content: rawContent });
    await assertParticipant(conversationId, senderId);

    const message = await db.message.create({
      data: { conversationId, senderId, content: validated.content },
      include: { sender: { select: MEMBER_SELECT } },
    });

    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: senderId } },
      data: { lastReadAt: new Date() },
    });

    // Broadcast (Pusher is inert without real credentials, but harmless to keep — the
    // chat page also polls, so delivery doesn't depend on this succeeding).
    try {
      const pusher = getPusherServer();
      pusher.trigger(getConversationChannel(conversationId), 'new-message', message);
    } catch {
      // ignore — polling is the source of truth for delivery
    }

    const others = await db.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true },
    });
    for (const { userId } of others) {
      await TESService.updateTES(userId, 'Collab usage');
      await triggerNotification('new-message', userId, {
        message: 'You have a new message',
        type: 'new_message',
        conversationId,
      }, senderId);
    }

    return { success: true, message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    const err = error as Error;
    return { error: err.message || 'Failed to send message' };
  }
}

export async function getConversation(conversationId: string, userId: string) {
  try {
    await assertParticipant(conversationId, userId);

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: { select: MEMBER_SELECT } } },
      },
    });

    if (!conversation) return { error: 'Conversation not found' };
    return { success: true, conversation };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to load conversation' };
  }
}

export async function getMessages(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);

  const messages = await db.message.findMany({
    where: { conversationId },
    include: { sender: { select: MEMBER_SELECT } },
    orderBy: { createdAt: 'asc' },
  });

  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });

  // Archived calls disappear from the chat for everyone, not just from Call History.
  const archivedCallSessions = await db.callSession.findMany({
    where: { conversationId, archived: true, messageId: { not: null } },
    select: { messageId: true },
  });
  const archivedMessageIds = new Set(archivedCallSessions.map((c) => c.messageId));

  return messages.filter((m) => !archivedMessageIds.has(m.id));
}

export async function getConversations(userId: string) {
  const participations = await db.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: MEMBER_SELECT } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: MEMBER_SELECT } } },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  });

  return Promise.all(
    participations.map(async ({ conversation, lastReadAt }) => {
      const otherParticipants = conversation.participants
        .filter((p) => p.userId !== userId)
        .map((p) => p.user);

      const latestMessage = conversation.messages[0] ?? null;

      const unreadCount = await db.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
        },
      });

      return {
        conversationId: conversation.id,
        isGroup: conversation.isGroup,
        name: conversation.name,
        createdAt: conversation.createdAt,
        otherParticipants,
        latestMessage,
        unreadCount,
      };
    })
  );
}

/**
 * Starts a video call: creates the CallSession record (optionally with a
 * duration limit) and posts the "Join Meeting" chat message other
 * participants click to join the same LiveKit room.
 */
export async function startCall(conversationId: string, userId: string, durationSeconds?: number) {
  try {
    await assertParticipant(conversationId, userId);

    if (durationSeconds !== undefined && !ALLOWED_CALL_DURATIONS_SECONDS.includes(durationSeconds)) {
      return { error: 'Invalid call duration' };
    }

    const roomName = `orochat-collab-${conversationId}-${Math.random().toString(36).substring(2, 10)}`;
    const endsAt = durationSeconds ? new Date(Date.now() + durationSeconds * 1000) : null;

    const callSession = await db.callSession.create({
      data: { conversationId, roomName, initiatorId: userId, durationSeconds: durationSeconds ?? null },
    });

    const metadata = {
      roomName,
      callSessionId: callSession.id,
      initiatorId: userId,
      durationSeconds: durationSeconds ?? null,
      endsAt: endsAt ? endsAt.toISOString() : null,
    };

    const formData = new FormData();
    formData.append('content', `📞 LIVEKIT_CALL:${JSON.stringify(metadata)}`);
    formData.append('conversationId', conversationId);
    const sent = await sendMessage(userId, formData);

    if (sent.success && sent.message) {
      await db.callSession.update({ where: { id: callSession.id }, data: { messageId: sent.message.id } });
    }

    return { success: true, messageId: sent.success ? sent.message?.id : undefined, ...metadata };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to start call' };
  }
}

/**
 * Moderator-only: force-ends the call for every connected participant
 * (used both for the explicit "End Call for Everyone" action and for the
 * automatic duration cutoff).
 */
export async function endCallForEveryone(callSessionId: string, userId: string) {
  try {
    const callSession = await db.callSession.findUnique({ where: { id: callSessionId } });
    if (!callSession) return { error: 'Call not found' };
    if (callSession.initiatorId !== userId) {
      return { error: 'Only the call moderator can end this call for everyone' };
    }
    if (callSession.endedAt) return { success: true };

    await deleteRoom(callSession.roomName);
    await db.callSession.update({ where: { id: callSessionId }, data: { endedAt: new Date() } });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to end call' };
  }
}

/**
 * Enforces a call's duration limit. Any participant's client can call this
 * (whichever browser's countdown reaches zero first) — it only actually ends
 * the call once the server-recorded deadline has genuinely passed, so it
 * can't be used to end a call early.
 */
export async function enforceCallDurationCutoff(callSessionId: string, userId: string) {
  try {
    await assertParticipant(
      (await db.callSession.findUniqueOrThrow({ where: { id: callSessionId } })).conversationId,
      userId
    );

    const callSession = await db.callSession.findUnique({ where: { id: callSessionId } });
    if (!callSession) return { error: 'Call not found' };
    if (callSession.endedAt) return { success: true };
    if (!callSession.durationSeconds) return { error: 'This call has no duration limit' };

    const deadline = callSession.startedAt.getTime() + callSession.durationSeconds * 1000;
    if (Date.now() < deadline) return { error: 'Call duration has not elapsed yet' };

    await deleteRoom(callSession.roomName);
    await db.callSession.update({ where: { id: callSessionId }, data: { endedAt: new Date() } });

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to end call' };
  }
}

/**
 * "Call History" list for a conversation — split into active/archived by the caller.
 */
export async function getCallHistory(conversationId: string, userId: string) {
  try {
    await assertParticipant(conversationId, userId);

    const calls = await db.callSession.findMany({
      where: { conversationId },
      include: { initiator: { select: MEMBER_SELECT } },
      orderBy: { startedAt: 'desc' },
    });

    return { success: true, calls };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to load call history' };
  }
}

async function assertCallInitiator(callSessionId: string, userId: string) {
  const callSession = await db.callSession.findUnique({ where: { id: callSessionId } });
  if (!callSession) throw new Error('Call not found');
  if (callSession.initiatorId !== userId) throw new Error('Only the call moderator can manage this call history');
  return callSession;
}

export async function archiveCallSession(callSessionId: string, userId: string) {
  try {
    await assertCallInitiator(callSessionId, userId);
    await db.callSession.update({ where: { id: callSessionId }, data: { archived: true } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to archive call' };
  }
}

export async function unarchiveCallSession(callSessionId: string, userId: string) {
  try {
    await assertCallInitiator(callSessionId, userId);
    await db.callSession.update({ where: { id: callSessionId }, data: { archived: false } });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to unarchive call' };
  }
}

export async function deleteCallSession(callSessionId: string, userId: string) {
  try {
    const callSession = await assertCallInitiator(callSessionId, userId);
    await db.$transaction(async (tx) => {
      if (callSession.messageId) {
        await tx.message.delete({ where: { id: callSession.messageId } }).catch(() => {});
      }
      await tx.callSession.delete({ where: { id: callSessionId } });
    });
    return { success: true, messageId: callSession.messageId };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to delete call' };
  }
}
