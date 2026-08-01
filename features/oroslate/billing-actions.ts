'use server';

import { db } from '@/lib/db';
import { SubscriptionService } from '@/services/subscription.service';
import type { SlateTier } from '@prisma/client';

async function assertOrgAdmin(organizationId: string, userId: string) {
  const member = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  if (!member) throw new Error('Not a member of this organization');
  if (member.role !== 'ADMIN') throw new Error('Only an organization admin can manage billing');
  return member;
}

export async function startOroslateCheckout(
  organizationId: string,
  actingUserId: string,
  tier: Exclude<SlateTier, 'ENTERPRISE'>,
  seatCount: number,
  annual: boolean
) {
  try {
    await assertOrgAdmin(organizationId, actingUserId);
    return await SubscriptionService.createCheckoutSession(organizationId, tier, seatCount, annual);
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to start checkout' };
  }
}

export async function openOroslateBillingPortal(organizationId: string, actingUserId: string) {
  try {
    await assertOrgAdmin(organizationId, actingUserId);
    return await SubscriptionService.createBillingPortalSession(organizationId);
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to open billing portal' };
  }
}
