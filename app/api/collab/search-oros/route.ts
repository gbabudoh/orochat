import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { resolvePresence } from '@/lib/presence';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({ success: true, oros: [] });
    }

    // Search users matching query (excluding current user)
    const matchedUsers = await db.user.findMany({
      where: {
        id: { not: userId },
        isPaused: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        title: true,
        company: true,
        lastSeenAt: true,
        presenceStatus: true,
      },
      take: 15,
    });

    // Check connections for current user
    const matchedUserIds = matchedUsers.map((u) => u.id);
    const connections = await db.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId, receiverId: { in: matchedUserIds } },
          { receiverId: userId, senderId: { in: matchedUserIds } },
        ],
      },
    });

    const connectedUserIds = new Set(
      connections.map((c) => (c.senderId === userId ? c.receiverId : c.senderId))
    );

    // Find existing direct conversations
    const existingConversations = await db.conversationParticipant.findMany({
      where: {
        userId,
        conversation: {
          isGroup: false,
          participants: { some: { userId: { in: matchedUserIds } } },
        },
      },
      select: {
        conversationId: true,
        conversation: {
          select: {
            participants: {
              where: { userId: { not: userId } },
              select: { userId: true },
            },
          },
        },
      },
    });

    const conversationByOtherUserId = new Map<string, string>();
    for (const ec of existingConversations) {
      const otherId = ec.conversation.participants[0]?.userId;
      if (otherId) {
        conversationByOtherUserId.set(otherId, ec.conversationId);
      }
    }

    const oros = matchedUsers.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      title: u.title,
      company: u.company,
      presence: resolvePresence(u.lastSeenAt, u.presenceStatus),
      isConnected: connectedUserIds.has(u.id),
      existingConversationId: conversationByOtherUserId.get(u.id) || null,
    }));

    return NextResponse.json({ success: true, oros });
  } catch (error) {
    console.error('Error searching Oros for Collab:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
