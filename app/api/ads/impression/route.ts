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
  const campaignId = body?.campaignId as string | undefined;
  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
  }
  const compassId = (body?.compassId as string | undefined) || null;

  await db.adImpression.create({
    data: { campaignId, userId: session.user.id, compassId },
  });

  return NextResponse.json({ success: true });
}
