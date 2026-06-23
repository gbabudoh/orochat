'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';

export async function createOrRefreshConnectOnboardingLink(): Promise<{ url: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeConnectAccountId: true },
  });
  if (!user) return { error: 'User not found' };

  try {
    let accountId = user.stripeConnectAccountId;

    if (!accountId) {
      const account = await getStripeClient().accounts.create({
        type: 'express',
        email: user.email,
        business_type: 'individual',
        capabilities: {
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await db.user.update({
        where: { id: user.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const accountLink = await getStripeClient().accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/stripe/connect/refresh`,
      return_url: `${baseUrl}/api/stripe/connect/return`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to start payout onboarding' };
  }
}
