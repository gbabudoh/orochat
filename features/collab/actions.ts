'use server';

import { db } from '@/lib/db';
import { getPusherServer, getChatChannel } from '@/services/realtime.service';
import { TESService } from '@/services/tes.service';
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  receiverId: z.string(),
});

export async function sendMessage(senderId: string, formData: FormData) {
  const rawData = {
    content: formData.get('content') as string,
    receiverId: formData.get('receiverId') as string,
  };

  try {
    const validatedData = messageSchema.parse(rawData);

    // Verify connection exists
    const connection = await db.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId: validatedData.receiverId, status: 'ACCEPTED' },
          { senderId: validatedData.receiverId, receiverId: senderId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!connection) {
      return { error: 'You must be connected to send messages' };
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId,
        receiverId: validatedData.receiverId,
        content: validatedData.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Broadcast via Pusher
    const pusher = getPusherServer();
    const channel = getChatChannel(senderId, validatedData.receiverId);
    pusher.trigger(channel, 'new-message', message);

    // Update TES for receiver (their Oros are active)
    await TESService.updateTES(validatedData.receiverId, 'Collab usage');

    return { success: true, message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: 'Failed to send message' };
  }
}

export async function getMessages(userId: string, otherUserId: string) {
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Mark messages as read
  await db.message.updateMany({
    where: {
      receiverId: userId,
      senderId: otherUserId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return messages;
}

export async function getConversations(userId: string) {
  // Get all unique conversations
  const sentMessages = await db.message.findMany({
    where: { senderId: userId },
    select: { receiverId: true },
    distinct: ['receiverId'],
  });

  const receivedMessages = await db.message.findMany({
    where: { receiverId: userId },
    select: { senderId: true },
    distinct: ['senderId'],
  });

  const allUserIds = [
    ...new Set([
      ...sentMessages.map((m) => m.receiverId),
      ...receivedMessages.map((m) => m.senderId),
    ]),
  ];

  // Get latest message for each conversation
  const conversations = (await Promise.all(
    allUserIds.map(async (otherUserId) => {
      const latestMessage = await db.message.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true,
            },
          },
        },
      });

      const unreadCount = await db.message.count({
        where: {
          receiverId: userId,
          senderId: otherUserId,
          isRead: false,
        },
      });

      const otherUser = latestMessage?.senderId === userId 
        ? latestMessage.receiver 
        : latestMessage?.sender;

      if (!otherUser) return null;

      return {
        userId: otherUserId,
        user: otherUser,
        latestMessage,
        unreadCount,
      };
    })
  )).filter((c): c is NonNullable<typeof c> => c !== null);

  return conversations.sort((a, b) => {
    if (!a.latestMessage || !b.latestMessage) return 0;
    return new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime();
  });
}

