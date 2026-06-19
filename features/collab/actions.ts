'use server';

import { db } from '@/lib/db';
import { getPusherServer, getConversationChannel } from '@/services/realtime.service';
import { TESService } from '@/services/tes.service';
import { triggerNotification } from '@/lib/novu';
import { z } from 'zod';

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

  return messages;
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
        otherParticipants,
        latestMessage,
        unreadCount,
      };
    })
  );
}
