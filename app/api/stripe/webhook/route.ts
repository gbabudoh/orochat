import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { db } from '@/lib/db';
import { activateBookingAfterPayment } from '@/features/booking/actions';
import { recordAffiliateLedgerEntry } from '@/services/affiliate.service';
import { getPriceIds } from '@/services/subscription.service';
import type Stripe from 'stripe';

function slateTierFromStripe(value: unknown): 'STARTER' | 'PRO' | undefined {
  return value === 'STARTER' || value === 'PRO' ? value : undefined;
}

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
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const booking = await db.booking.findUnique({ where: { stripePaymentIntentId: intent.id } });
      if (booking && booking.status === 'PENDING_PAYMENT') {
        const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id ?? null;
        await activateBookingAfterPayment(booking.id, chargeId);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const booking = await db.booking.findUnique({ where: { stripePaymentIntentId: intent.id } });
      if (booking && booking.status === 'PENDING_PAYMENT') {
        await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
        await db.availabilitySlot.update({ where: { id: booking.availabilitySlotId }, data: { bookedCount: { decrement: 1 } } });
      }
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      await db.booking.updateMany({
        where: { stripeChargeId: charge.id, status: { not: 'REFUNDED' } },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });
      break;
    }
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const organizationId = checkoutSession.metadata?.organizationId;
      const tier = slateTierFromStripe(checkoutSession.metadata?.tier);
      if (organizationId && checkoutSession.subscription) {
        const subscriptionId =
          typeof checkoutSession.subscription === 'string'
            ? checkoutSession.subscription
            : checkoutSession.subscription.id;
        const priceIds = tier ? getPriceIds(tier) : null;
        await db.subscription.update({
          where: { organizationId },
          data: {
            stripeSubscriptionId: subscriptionId,
            ...(tier ? { tier } : {}),
            ...(priceIds
              ? { stripePriceIdBase: priceIds.basePriceId, stripePriceIdSeat: priceIds.seatPriceId }
              : {}),
          },
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const organizationId = stripeSubscription.metadata?.organizationId;
      if (!organizationId) break;

      const seatItem = stripeSubscription.items.data.find((item) => item.price.recurring?.usage_type !== 'metered');
      const statusMap: Record<Stripe.Subscription.Status, 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'> = {
        trialing: 'TRIALING',
        active: 'ACTIVE',
        past_due: 'PAST_DUE',
        canceled: 'CANCELED',
        incomplete: 'PAST_DUE',
        incomplete_expired: 'CANCELED',
        unpaid: 'PAST_DUE',
        paused: 'PAST_DUE',
      };

      await db.subscription.updateMany({
        where: { organizationId },
        data: {
          status: statusMap[stripeSubscription.status] ?? 'ACTIVE',
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodEnd: stripeSubscription.items.data[0]?.current_period_end
            ? new Date(stripeSubscription.items.data[0].current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          ...(seatItem ? { seatCount: seatItem.quantity ?? 1 } : {}),
        },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const organizationId = stripeSubscription.metadata?.organizationId;
      if (!organizationId) break;
      await db.subscription.updateMany({
        where: { organizationId },
        data: { status: 'CANCELED' },
      });
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await recordAffiliateLedgerEntry(invoice);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
