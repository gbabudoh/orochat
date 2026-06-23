import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeConnectAccountId: true },
  });

  if (user?.stripeConnectAccountId) {
    try {
      const account = await getStripeClient().accounts.retrieve(user.stripeConnectAccountId);
      await db.user.update({
        where: { id: session.user.id },
        data: {
          stripeConnectOnboarded: !!account.charges_enabled && !!account.payouts_enabled,
          stripeConnectDetailsSubmitted: !!account.details_submitted,
        },
      });
    } catch (error) {
      console.error('Failed to refresh Stripe Connect account status:', error);
    }
  }

  return NextResponse.redirect(new URL('/settings/payouts', req.url));
}
