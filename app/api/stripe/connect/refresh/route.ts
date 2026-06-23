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

  if (!user?.stripeConnectAccountId) {
    return NextResponse.redirect(new URL('/settings/payouts', req.url));
  }

  const accountLink = await getStripeClient().accountLinks.create({
    account: user.stripeConnectAccountId,
    refresh_url: new URL('/api/stripe/connect/refresh', req.url).toString(),
    return_url: new URL('/api/stripe/connect/return', req.url).toString(),
    type: 'account_onboarding',
  });

  return NextResponse.redirect(accountLink.url);
}
