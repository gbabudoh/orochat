/**
 * One-off setup script: creates the Stripe Products/Prices behind Oroslate's
 * Starter/Pro tiers (base fee + per-seat fee, monthly and annual-discounted)
 * and prints the resulting price IDs to paste into .env as
 * STRIPE_PRICE_{STARTER,PRO}_{BASE,SEAT}[_ANNUAL]. Run once per Stripe mode
 * (test/live) — re-running creates duplicate Products, so check the Stripe
 * Dashboard first if prices already exist.
 *
 * Usage: npm run seed:stripe-prices
 */
import { getStripeClient } from '@/lib/stripe';
import { TIER_LIMITS } from '@/lib/oroslate/tiers';

const ANNUAL_DISCOUNT_PERCENT = 20;

async function createTierPrices(tier: 'STARTER' | 'PRO') {
  const stripe = getStripeClient();
  const limits = TIER_LIMITS[tier];
  if (limits.baseFeeCents === null || limits.seatFeeCents === null) {
    throw new Error(`${tier} has no self-serve pricing (Enterprise is Custom Quote)`);
  }

  const product = await stripe.products.create({ name: `Oroslate ${limits.label}` });

  const monthlyBase = await stripe.prices.create({
    product: product.id,
    currency: 'gbp',
    unit_amount: limits.baseFeeCents,
    recurring: { interval: 'month' },
    nickname: `${tier} base (monthly)`,
  });
  const monthlySeat = await stripe.prices.create({
    product: product.id,
    currency: 'gbp',
    unit_amount: limits.seatFeeCents,
    recurring: { interval: 'month' },
    nickname: `${tier} seat (monthly)`,
  });

  const annualBaseCents = Math.round(limits.baseFeeCents * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
  const annualSeatCents = Math.round(limits.seatFeeCents * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
  const annualBase = await stripe.prices.create({
    product: product.id,
    currency: 'gbp',
    unit_amount: annualBaseCents,
    recurring: { interval: 'year' },
    nickname: `${tier} base (annual, -${ANNUAL_DISCOUNT_PERCENT}%)`,
  });
  const annualSeat = await stripe.prices.create({
    product: product.id,
    currency: 'gbp',
    unit_amount: annualSeatCents,
    recurring: { interval: 'year' },
    nickname: `${tier} seat (annual, -${ANNUAL_DISCOUNT_PERCENT}%)`,
  });

  return {
    [`STRIPE_PRICE_${tier}_BASE`]: monthlyBase.id,
    [`STRIPE_PRICE_${tier}_SEAT`]: monthlySeat.id,
    [`STRIPE_PRICE_${tier}_BASE_ANNUAL`]: annualBase.id,
    [`STRIPE_PRICE_${tier}_SEAT_ANNUAL`]: annualSeat.id,
  };
}

async function main() {
  const starter = await createTierPrices('STARTER');
  const pro = await createTierPrices('PRO');

  console.log('\nAdd these to your .env:\n');
  for (const [key, value] of Object.entries({ ...starter, ...pro })) {
    console.log(`${key}=${value}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
