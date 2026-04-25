import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TESService } from '@/services/tes.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only partners can trigger TES updates (or admin)
    if (!session.user.isPartner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, reason } = await request.json();
    await TESService.updateTES(userId || session.user.id, reason || 'Manual update');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update TES' },
      { status: 500 }
    );
  }
}
