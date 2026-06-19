import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/services/realtime.service';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;

    // Channel format: private-conversation-{conversationId} — only actual
    // participants of that conversation may subscribe.
    if (channelName.startsWith('private-conversation-')) {
      const conversationId = channelName.replace('private-conversation-', '');
      const participant = await db.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: session.user.id } },
      });

      if (!participant) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const pusher = getPusherServer();
    const authResponse = pusher.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher Auth Error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
