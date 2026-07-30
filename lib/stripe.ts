import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');

  client = new Stripe(secretKey);
  return client;
}

const STRIPE_PERCENT_FEE = 0.029;
const STRIPE_FIXED_FEE_CENTS = 30;
const ORO_SHARE = 0.7; // Flash-Consult bookings: 70% Oro / 30% Orochat, of the amount after Stripe's own fee

/**
 * Splits a Flash-Consult booking price into the Oro's transfer amount and
 * Orochat's application fee, so the 70/30 split lands on the amount *after*
 * Stripe's processing fee rather than the gross charge (Stripe does not do
 * this automatically — its own fee is deducted from the platform balance,
 * separate from whatever split the platform configures).
 */
export function computeBookingSplit(priceCents: number) {
  const stripeFeeCents = Math.round(priceCents * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE_CENTS;
  const netAfterStripeFeeCents = priceCents - stripeFeeCents;
  const oroAmountCents = Math.round(netAfterStripeFeeCents * ORO_SHARE);
  const applicationFeeAmountCents = priceCents - oroAmountCents;

  return { stripeFeeCents, oroAmountCents, applicationFeeAmountCents };
}
