import { db } from '@/lib/db';
import { getStripeClient } from '@/lib/stripe';
import { TIER_LIMITS } from '@/lib/oroslate/tiers';
import type { SlateTier } from '@prisma/client';

const TIER_PRICE_ENV: Record<Exclude<SlateTier, 'ENTERPRISE'>, { base: string; seat: string }> = {
  STARTER: { base: 'STRIPE_PRICE_STARTER_BASE', seat: 'STRIPE_PRICE_STARTER_SEAT' },
  PRO: { base: 'STRIPE_PRICE_PRO_BASE', seat: 'STRIPE_PRICE_PRO_SEAT' },
};

export function getPriceIds(tier: Exclude<SlateTier, 'ENTERPRISE'>): { basePriceId: string; seatPriceId: string } {
  const envKeys = TIER_PRICE_ENV[tier];
  const basePriceId = process.env[envKeys.base];
  const seatPriceId = process.env[envKeys.seat];
  if (!basePriceId || !seatPriceId) {
    throw new Error(`Stripe price IDs are not configured for the ${TIER_LIMITS[tier].label} tier`);
  }
  return { basePriceId, seatPriceId };
}

/**
 * Subscription Service
 * Stripe Checkout / Billing Portal for Oroslate's org-level subscriptions —
 * separate from StripeService, which handles one-off Flash-Consult charges
 * and Connect revenue-share transfers.
 */
export class SubscriptionService {
  /**
   * Ensures the Organization has a Stripe Customer, creating one (from the
   * owner's email) on first use.
   */
  static async ensureStripeCustomer(organizationId: string): Promise<string> {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: { owner: { select: { email: true } } },
    });
    if (!organization) throw new Error('Organization not found');
    if (organization.stripeCustomerId) return organization.stripeCustomerId;

    const customer = await getStripeClient().customers.create({
      email: organization.owner.email,
      name: organization.name,
      metadata: { organizationId: organization.id },
    });

    await db.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Creates a Stripe Checkout Session (subscription mode) for an org
   * upgrading to a paid Starter/Pro tier. Enterprise is sales-assisted —
   * no self-serve Checkout path.
   */
  static async createCheckoutSession(
    organizationId: string,
    tier: Exclude<SlateTier, 'ENTERPRISE'>,
    seatCount: number,
    annual: boolean
  ): Promise<{ url: string } | { error: string }> {
    try {
      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        include: { subscription: true },
      });
      if (!organization) return { error: 'Organization not found' };

      const customerId = await SubscriptionService.ensureStripeCustomer(organizationId);
      const { basePriceId, seatPriceId } = getPriceIds(tier);

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const subscription = organization.subscription;

      // Preserve any remaining free-trial time already granted at org
      // creation, rather than restarting a fresh 14-day trial in Stripe.
      const trialEndsAtMs = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).getTime() : null;
      const trialStillActive =
        subscription?.status === 'TRIALING' && trialEndsAtMs !== null && trialEndsAtMs > Date.now();

      const session = await getStripeClient().checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [
          { price: basePriceId, quantity: 1 },
          { price: seatPriceId, quantity: Math.max(1, seatCount) },
        ],
        subscription_data: {
          metadata: { organizationId, tier },
          ...(trialStillActive ? { trial_end: Math.floor(trialEndsAtMs! / 1000) } : {}),
        },
        allow_promotion_codes: true,
        success_url: `${baseUrl}/oroslate/org/${organizationId}?checkout=success`,
        cancel_url: `${baseUrl}/oroslate/org/${organizationId}/upgrade?checkout=cancelled`,
        metadata: { organizationId, tier, annual: annual ? 'true' : 'false' },
      });

      if (!session.url) return { error: 'Failed to create checkout session' };
      return { url: session.url };
    } catch (error) {
      const err = error as Error;
      return { error: err.message || 'Failed to start checkout' };
    }
  }

  /**
   * Creates a Stripe Billing Portal session for self-serve plan/seat
   * management, cancellation, and the annual-plan upsell.
   */
  static async createBillingPortalSession(organizationId: string): Promise<{ url: string } | { error: string }> {
    try {
      const organization = await db.organization.findUnique({ where: { id: organizationId } });
      if (!organization?.stripeCustomerId) return { error: 'This organization has no billing account yet' };

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const portalSession = await getStripeClient().billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: `${baseUrl}/oroslate/org/${organizationId}`,
      });

      return { url: portalSession.url };
    } catch (error) {
      const err = error as Error;
      return { error: err.message || 'Failed to open billing portal' };
    }
  }
}
