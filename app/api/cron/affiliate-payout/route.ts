import { NextResponse } from 'next/server';
import { runAffiliatePayoutSweep } from '@/services/affiliate.service';

/**
 * Monthly Vercel Cron (see vercel.json, fires on the 15th) that sweeps every
 * matured Compass-leader affiliate ledger entry into a real Stripe Connect
 * transfer.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const result = await runAffiliatePayoutSweep();
  return NextResponse.json(result);
}
