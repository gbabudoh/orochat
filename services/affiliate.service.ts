import type Stripe from 'stripe';
import { db } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';

const STRIPE_PERCENT_FEE = 0.029;
const STRIPE_FIXED_FEE_CENTS = 30;
const LEDGER_MATURATION_DAYS = 30;
const ENTERPRISE_SEAT_THRESHOLD = 21;
const GROWTH_SEAT_THRESHOLD = 6;
const BASE_SHARE_PERCENT = 0.15;
const GROWTH_SEAT_SHARE_PERCENT = 0.05;
const ENTERPRISE_FLAT_BONUS_CENTS = 15000; // flat £150 one-off bonus per closed enterprise contract
const MINIMUM_PAYOUT_CENTS = 2000; // £20 minimum balance to trigger a bank payout

/**
 * Affiliate Service
 * Computes and records the Compass-leader revenue share owed on a paid
 * Oroslate invoice, riding the same Stripe Connect payout rails already
 * built for TES revenue share (see services/stripe.service.ts) rather than
 * a separate payout integration.
 */

/**
 * Invoked from the Stripe webhook on every `invoice.payment_succeeded` for
 * an Oroslate subscription. Writes a single PENDING AffiliateLedgerEntry
 * (idempotent per Stripe invoice) that matures 30 days later before the
 * monthly payout cron sweeps it into a real transfer.
 */
export async function recordAffiliateLedgerEntry(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;
  if (!subscriptionId) return;

  const subscription = await db.subscription.findUnique({ where: { stripeSubscriptionId: subscriptionId } });
  if (!subscription) return;

  const referral = await db.affiliateReferral.findUnique({ where: { organizationId: subscription.organizationId } });
  if (!referral || referral.status !== 'ACTIVE') return;

  const existingEntry = await db.affiliateLedgerEntry.findUnique({ where: { sourceInvoiceId: invoice.id } });
  if (existingEntry) return;

  const organization = await db.organization.findUnique({
    where: { id: subscription.organizationId },
    include: { members: true },
  });
  if (!organization) return;

  const paidSeatCount = organization.members.filter((m) => !m.isExternalOro).length;

  const grossCents = invoice.amount_paid;
  const taxCents = (invoice.total_taxes ?? []).reduce((sum, t) => sum + t.amount, 0);
  const stripeFeeCents = Math.round(grossCents * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE_CENTS;
  const netRevenueCents = grossCents - taxCents - stripeFeeCents;
  if (netRevenueCents <= 0) return;

  let payoutCents: number;

  if (paidSeatCount >= ENTERPRISE_SEAT_THRESHOLD) {
    // Enterprise tier: a flat one-off bonus per closed contract, not a
    // recurring share — only pay it on the referral's very first invoice.
    const priorEntryCount = await db.affiliateLedgerEntry.count({ where: { referralId: referral.id } });
    if (priorEntryCount > 0) return;
    payoutCents = ENTERPRISE_FLAT_BONUS_CENTS;
  } else {
    // Split net revenue between the base-fee and seat-fee line items using
    // the exact Stripe Price IDs the Checkout Session was created with, so
    // the growth-tier seat share only applies to seat revenue.
    const linePriceId = (line: Stripe.InvoiceLineItem): string | undefined => {
      const price = line.pricing?.price_details?.price;
      return typeof price === 'string' ? price : price?.id;
    };
    const baseLineCents = invoice.lines.data
      .filter((line) => linePriceId(line) === subscription.stripePriceIdBase)
      .reduce((sum, line) => sum + line.amount, 0);
    const seatLineCents = invoice.lines.data
      .filter((line) => linePriceId(line) === subscription.stripePriceIdSeat)
      .reduce((sum, line) => sum + line.amount, 0);
    const lineTotalCents = baseLineCents + seatLineCents;

    const netBaseCents = lineTotalCents > 0 ? netRevenueCents * (baseLineCents / lineTotalCents) : netRevenueCents;
    const netSeatCents = lineTotalCents > 0 ? netRevenueCents * (seatLineCents / lineTotalCents) : 0;
    const seatSharePercent = paidSeatCount >= GROWTH_SEAT_THRESHOLD ? GROWTH_SEAT_SHARE_PERCENT : 0;

    payoutCents = Math.round(netBaseCents * BASE_SHARE_PERCENT + netSeatCents * seatSharePercent);
  }

  if (payoutCents <= 0) return;

  await db.affiliateLedgerEntry.create({
    data: {
      referralId: referral.id,
      amountCents: payoutCents,
      sourceInvoiceId: invoice.id,
      releaseDate: new Date(Date.now() + LEDGER_MATURATION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

/**
 * Monthly payout sweep (see app/api/cron/affiliate-payout/route.ts). Groups
 * every matured (PENDING, past its releaseDate) ledger entry by affiliate,
 * skips balances under the £20 minimum (they roll over to next month), and
 * pays the rest via the same Stripe Connect transfer rail already used for
 * TES revenue-share payouts in StripeService.
 */
export async function runAffiliatePayoutSweep(): Promise<{ paidOut: number; belowMinimum: number; failed: number }> {
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7); // YYYY-MM, for idempotent transfer grouping

  const maturedEntries = await db.affiliateLedgerEntry.findMany({
    where: { status: 'PENDING', releaseDate: { lte: now } },
    include: {
      referral: {
        select: {
          affiliateId: true,
          affiliate: { select: { stripeConnectAccountId: true, stripeConnectOnboarded: true } },
        },
      },
    },
  });

  const byAffiliate = new Map<
    string,
    { totalCents: number; entryIds: string[]; stripeConnectAccountId: string | null; onboarded: boolean }
  >();

  for (const entry of maturedEntries) {
    const affiliateId = entry.referral.affiliateId;
    const group = byAffiliate.get(affiliateId) ?? {
      totalCents: 0,
      entryIds: [],
      stripeConnectAccountId: entry.referral.affiliate.stripeConnectAccountId,
      onboarded: entry.referral.affiliate.stripeConnectOnboarded,
    };
    group.totalCents += entry.amountCents;
    group.entryIds.push(entry.id);
    byAffiliate.set(affiliateId, group);
  }

  let paidOut = 0;
  let belowMinimum = 0;
  let failed = 0;

  for (const [affiliateId, group] of byAffiliate) {
    if (group.totalCents < MINIMUM_PAYOUT_CENTS) {
      belowMinimum++;
      continue; // stays PENDING — rolls over to next month's sweep
    }

    if (!group.stripeConnectAccountId || !group.onboarded) {
      failed++;
      continue; // stays PENDING until the affiliate finishes Connect onboarding
    }

    try {
      await getStripeClient().transfers.create(
        {
          amount: group.totalCents,
          currency: 'gbp',
          destination: group.stripeConnectAccountId,
          transfer_group: `affiliate-${affiliateId}-${monthKey}`,
        },
        { idempotencyKey: `affiliate-payout-${affiliateId}-${monthKey}` }
      );

      await db.affiliateLedgerEntry.updateMany({
        where: { id: { in: group.entryIds } },
        data: { status: 'RELEASED' },
      });
      paidOut++;
    } catch {
      failed++;
    }
  }

  return { paidOut, belowMinimum, failed };
}
