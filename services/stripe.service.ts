import { db } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';

/**
 * Stripe Service
 * Moves real money to Oros for their share of an ad revenue pool, via
 * Stripe Connect Express transfers.
 */
export class StripeService {
  /**
   * Attempts a real Stripe Transfer for every eligible (not yet paid)
   * distribution in a pool. Called right after AdminService.distributeRevenue
   * creates the distribution rows. Eligible = PENDING or previously FAILED
   * (so retries are swept up automatically too).
   */
  static async payoutEligibleDistributions(poolId: string): Promise<{ succeeded: number; failed: number }> {
    const distributions = await db.revenueDistribution.findMany({
      where: { poolId, payoutStatus: { in: ['PENDING', 'FAILED'] } },
      select: { id: true },
    });

    let succeeded = 0;
    let failed = 0;
    for (const dist of distributions) {
      const result = await StripeService.payoutSingleDistribution(dist.id);
      if (result.success) succeeded++;
      else failed++;
    }
    return { succeeded, failed };
  }

  /**
   * Attempts (or retries) a single Stripe Transfer for one distribution row.
   * Used both by the batch sweep above and the admin "Retry payout" action.
   */
  static async payoutSingleDistribution(distributionId: string): Promise<{ success: boolean; reason?: string }> {
    const dist = await db.revenueDistribution.findUnique({
      where: { id: distributionId },
      include: { user: { select: { stripeConnectAccountId: true, stripeConnectOnboarded: true } } },
    });
    if (!dist) return { success: false, reason: 'Distribution not found' };

    if (!dist.user.stripeConnectAccountId || !dist.user.stripeConnectOnboarded) {
      await db.revenueDistribution.update({
        where: { id: distributionId },
        data: {
          payoutStatus: 'NOT_CONNECTED',
          payoutFailureReason: 'User has not completed payout account setup',
          payoutAttemptedAt: new Date(),
        },
      });
      return { success: false, reason: 'NOT_CONNECTED' };
    }

    try {
      const transfer = await getStripeClient().transfers.create(
        {
          amount: Math.round(dist.amount * 100),
          currency: 'usd',
          destination: dist.user.stripeConnectAccountId,
          transfer_group: dist.poolId,
        },
        { idempotencyKey: dist.id }
      );

      await db.revenueDistribution.update({
        where: { id: distributionId },
        data: {
          paid: true,
          paidAt: new Date(),
          payoutStatus: 'PAID',
          stripeTransferId: transfer.id,
          payoutFailureReason: null,
          payoutAttemptedAt: new Date(),
        },
      });
      return { success: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown Stripe error';
      await db.revenueDistribution.update({
        where: { id: distributionId },
        data: {
          payoutStatus: 'FAILED',
          payoutFailureReason: reason,
          payoutAttemptedAt: new Date(),
        },
      });
      return { success: false, reason };
    }
  }

  /**
   * Creates a Stripe destination charge (PaymentIntent) for a Flash-Consult
   * booking: the customer is charged the full price, and Stripe splits it in
   * that same transaction — the Oro's connected account automatically
   * receives (amount - application_fee_amount), Orochat keeps the rest.
   */
  static async chargeSingleBooking(bookingId: string): Promise<{ success: boolean; clientSecret?: string; reason?: string }> {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { oro: { select: { stripeConnectAccountId: true, stripeConnectOnboarded: true } } },
    });
    if (!booking) return { success: false, reason: 'Booking not found' };

    if (!booking.oro.stripeConnectAccountId || !booking.oro.stripeConnectOnboarded) {
      return { success: false, reason: 'NOT_CONNECTED' };
    }

    try {
      const intent = await getStripeClient().paymentIntents.create(
        {
          amount: booking.priceCents,
          currency: 'usd',
          application_fee_amount: booking.applicationFeeAmountCents,
          transfer_data: { destination: booking.oro.stripeConnectAccountId },
          metadata: { bookingId: booking.id },
        },
        { idempotencyKey: booking.id }
      );

      await db.booking.update({
        where: { id: bookingId },
        data: { stripePaymentIntentId: intent.id },
      });

      return { success: true, clientSecret: intent.client_secret ?? undefined };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown Stripe error';
      return { success: false, reason };
    }
  }

  /**
   * Fully refunds a Flash-Consult booking's charge, reversing both the Oro's
   * transfer and Orochat's application fee — used for no-show/reschedule
   * declines where no service was delivered.
   */
  static async refundBooking(bookingId: string): Promise<{ success: boolean; reason?: string }> {
    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking?.stripePaymentIntentId) return { success: false, reason: 'No payment to refund' };

    try {
      await getStripeClient().refunds.create(
        {
          payment_intent: booking.stripePaymentIntentId,
          reverse_transfer: true,
          refund_application_fee: true,
        },
        { idempotencyKey: `refund-${booking.id}` }
      );
      return { success: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown Stripe error';
      return { success: false, reason };
    }
  }
}
