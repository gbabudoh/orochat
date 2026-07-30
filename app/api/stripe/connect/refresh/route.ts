import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';

export async function GET(req: Request) {
  // Behind a reverse proxy, req.url can reflect the app's internal host/port
  // rather than the public domain — always build redirect/link URLs against
  // NEXTAUTH_URL instead, same as createOrRefreshConnectOnboardingLink.
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', baseUrl));
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeConnectAccountId: true },
  });

  if (!user?.stripeConnectAccountId) {
    return NextResponse.redirect(new URL('/settings/payouts', baseUrl));
  }

  const accountLink = await getStripeClient().accountLinks.create({
    account: user.stripeConnectAccountId,
    refresh_url: new URL('/api/stripe/connect/refresh', baseUrl).toString(),
    return_url: new URL('/api/stripe/connect/return', baseUrl).toString(),
    type: 'account_onboarding',
  });

  return NextResponse.redirect(accountLink.url);
}
