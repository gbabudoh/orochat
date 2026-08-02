import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status === 'offline' ? 'offline' : 'online';

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { presenceStatus: status, lastSeenAt: new Date() },
    });
  } catch (error) {
    // The session's JWT outlives the DB row — a deleted/terminated account
    // still holds a valid signed cookie until it's explicitly signed out.
    // Tell the client so it can clear the stale session instead of retrying
    // this heartbeat forever.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Account no longer exists', accountDeleted: true }, { status: 401 });
    }
    throw error;
  }

  return NextResponse.json({ success: true });
}
