'use server';

import { db } from '@/lib/db';
import { triggerNotification } from '@/lib/novu';
import { checkRateLimit } from '@/lib/rateLimit';
import { SafetyService } from '@/services/safety.service';
import { z } from 'zod';

// Direct Note (DN) — a permanently separate, narrow messaging channel that
// lets a user reach a stranger (no ACCEPTED Connection) once, from their
// profile. DN threads never graduate into Collab Conversations; this module
// never touches the Conversation/Message tables.

const MAX_DN_LENGTH = 500;

const dnMessageSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty').max(MAX_DN_LENGTH, `Note must be ${MAX_DN_LENGTH} characters or fewer`),
});

const NEW_THREAD_LIMIT = { windowMs: 24 * 60 * 60 * 1000, max: 10 }; // 10 new DN threads / sender / 24h
const MESSAGE_LIMIT = { windowMs: 24 * 60 * 60 * 1000, max: 60 }; // 60 DN messages (new + replies) / sender / 24h

const MEMBER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  title: true,
  company: true,
} as const;

export async function assertDirectNoteParticipant(threadId: string, userId: string) {
  const thread = await db.directNote.findUnique({ where: { id: threadId } });
  if (!thread || (thread.senderId !== userId && thread.recipientId !== userId)) {
    throw new Error('Not a participant of this Direct Note');
  }
  return thread;
}

/** Finds the existing DN thread between two users, in either direction. */
export async function getDirectNoteThreadId(userId: string, otherUserId: string) {
  const thread = await db.directNote.findFirst({
    where: {
      OR: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    },
    select: { id: true },
  });
  return thread?.id ?? null;
}

/**
 * Sends a Direct Note. Finds-or-creates the thread (only the very first
 * message actually creates it — every reply reuses the same thread and
 * counts against the looser per-message limit, not the new-thread limit).
 */
export async function sendDirectNote(senderId: string, recipientId: string, rawContent: string) {
  if (senderId === recipientId) return { error: 'Cannot send a Direct Note to yourself' };

  try {
    const validated = dnMessageSchema.parse({ content: rawContent });

    if (await SafetyService.isBlocked(senderId, recipientId)) {
      return { error: 'Unable to send a Direct Note to this user' };
    }

    let thread = await db.directNote.findFirst({
      where: {
        OR: [
          { senderId, recipientId },
          { senderId: recipientId, recipientId: senderId },
        ],
      },
    });

    const isNewThread = !thread;

    if (isNewThread) {
      const threadLimit = await checkRateLimit(`dn-new-thread:${senderId}`, NEW_THREAD_LIMIT.windowMs, NEW_THREAD_LIMIT.max);
      if (!threadLimit.allowed) {
        return { error: 'You have reached the daily limit for new Direct Notes. Please try again tomorrow.' };
      }
    }

    const messageLimit = await checkRateLimit(`dn-message:${senderId}`, MESSAGE_LIMIT.windowMs, MESSAGE_LIMIT.max);
    if (!messageLimit.allowed) {
      return { error: 'You are sending Direct Notes too quickly. Please try again later.' };
    }

    if (!thread) {
      thread = await db.directNote.create({ data: { senderId, recipientId } });
    }

    const readField: 'senderReadAt' | 'recipientReadAt' = thread.senderId === senderId ? 'senderReadAt' : 'recipientReadAt';

    const [message] = await db.$transaction([
      db.directNoteMessage.create({
        data: { directNoteId: thread.id, senderId, content: validated.content },
      }),
      db.directNote.update({
        where: { id: thread.id },
        data: { updatedAt: new Date(), [readField]: new Date() },
      }),
    ]);

    const recipientOfThisMessage = thread.senderId === senderId ? thread.recipientId : thread.senderId;
    const sender = await db.user.findUnique({ where: { id: senderId }, select: { name: true } });

    await triggerNotification(
      isNewThread ? 'dn-received' : 'dn-reply',
      recipientOfThisMessage,
      {
        message: isNewThread
          ? `${sender?.name || 'Someone'} sent you a Direct Note`
          : `${sender?.name || 'Someone'} replied to your Direct Note`,
        senderName: sender?.name || 'Someone',
        type: isNewThread ? 'dn_received' : 'dn_reply',
        threadId: thread.id,
      },
      senderId
    );

    return { success: true, threadId: thread.id, message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    const err = error as Error;
    return { error: err.message || 'Failed to send Direct Note' };
  }
}

export async function getDirectNoteMessages(threadId: string, userId: string) {
  const thread = await assertDirectNoteParticipant(threadId, userId);

  const messages = await db.directNoteMessage.findMany({
    where: { directNoteId: threadId },
    include: { sender: { select: MEMBER_SELECT } },
    orderBy: { createdAt: 'asc' },
  });

  const readField: 'senderReadAt' | 'recipientReadAt' = thread.senderId === userId ? 'senderReadAt' : 'recipientReadAt';
  await db.directNote.update({ where: { id: threadId }, data: { [readField]: new Date() } });

  return messages;
}

export async function getDirectNoteThreads(userId: string) {
  const threads = await db.directNote.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    include: {
      sender: { select: MEMBER_SELECT },
      recipient: { select: MEMBER_SELECT },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: MEMBER_SELECT } } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return Promise.all(
    threads.map(async (thread) => {
      const isSender = thread.senderId === userId;
      const otherUser = isSender ? thread.recipient : thread.sender;
      const readAt = isSender ? thread.senderReadAt : thread.recipientReadAt;
      const latestMessage = thread.messages[0] ?? null;

      const unreadCount = await db.directNoteMessage.count({
        where: {
          directNoteId: thread.id,
          senderId: { not: userId },
          createdAt: readAt ? { gt: readAt } : undefined,
        },
      });

      return {
        threadId: thread.id,
        otherUser,
        latestMessage,
        unreadCount,
        updatedAt: thread.updatedAt,
      };
    })
  );
}

export async function getDNUnreadCount(userId: string) {
  const threads = await getDirectNoteThreads(userId);
  return threads.reduce((total, t) => total + t.unreadCount, 0);
}
