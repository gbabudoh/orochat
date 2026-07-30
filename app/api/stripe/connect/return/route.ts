import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';

export async function GET(req: Request) {
  // Behind a reverse proxy, req.url can reflect the app's internal host/port
  // rather than the public domain — always redirect against NEXTAUTH_URL
  // instead, same as the accountLinks.create() call that sent the user here.
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', baseUrl));
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

  return NextResponse.redirect(new URL('/settings/payouts', baseUrl));
}
