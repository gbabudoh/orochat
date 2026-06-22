import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status === 'offline' ? 'offline' : 'online';

  await db.user.update({
    where: { id: session.user.id },
    data: { presenceStatus: status, lastSeenAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
