import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/services/realtime.service';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;

    // Validate that the user belongs to the channel they are trying to join
    // Channel format: private-chat-user1Id-user2Id
    if (channelName.startsWith('private-chat-')) {
      const parts = channelName.replace('private-chat-', '').split('-');
      const isAllowed = parts.includes(session.user.id);

      if (!isAllowed) {
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
