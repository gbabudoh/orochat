import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const room = searchParams.get('room');

    if (!room) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const callSession = await db.callSession.findUnique({ where: { roomName: room } });
    if (!callSession) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }
    if (callSession.endedAt) {
      return NextResponse.json({ error: 'This call has ended' }, { status: 410 });
    }

    const participant = await db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: callSession.conversationId, userId: session.user.id } },
    });
    if (!participant) {
      return NextResponse.json({ error: 'You are not a participant of this conversation' }, { status: 403 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: 'LiveKit server credentials are not configured' }, { status: 500 });
    }

    // Identity is derived from the authenticated session, never from client input,
    // so a participant can't impersonate another user inside the room.
    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: session.user.name || 'User',
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({ token, wsUrl });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
