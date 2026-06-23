import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { db } from '@/lib/db';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse('Webhook not configured', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      await db.user.updateMany({
        where: { stripeConnectAccountId: account.id },
        data: {
          stripeConnectOnboarded: !!account.charges_enabled && !!account.payouts_enabled,
          stripeConnectDetailsSubmitted: !!account.details_submitted,
        },
      });
      break;
    }
    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer;
      await db.revenueDistribution.updateMany({
        where: { stripeTransferId: transfer.id },
        data: { payoutStatus: 'PAID', paid: true, paidAt: new Date() },
      });
      break;
    }
    case 'transfer.reversed': {
      const transfer = event.data.object as Stripe.Transfer;
      await db.revenueDistribution.updateMany({
        where: { stripeTransferId: transfer.id },
        data: { payoutStatus: 'FAILED', paid: false, payoutFailureReason: 'Transfer reversed' },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
