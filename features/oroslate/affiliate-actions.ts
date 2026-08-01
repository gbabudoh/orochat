'use server';

import { db } from '@/lib/db';

/**
 * A "Compass leader" who can generate an Oroslate referral link is the
 * community's creator or a MODERATOR/ADMIN member — matching who can
 * already moderate the Compass itself.
 */
async function assertCompassLeader(compassId: string, userId: string) {
  const compass = await db.compass.findUnique({ where: { id: compassId } });
  if (!compass) throw new Error('Compass community not found');
  if (compass.creatorId === userId) return compass;

  const membership = await db.compassMembership.findUnique({
    where: { userId_compassId: { userId, compassId } },
  });
  if (!membership || membership.role === 'MEMBER') {
    throw new Error('Only a Compass creator or moderator can generate a referral link');
  }
  return compass;
}

/**
 * Returns a referral link that encodes both the Compass community and the
 * specific leader who should receive the revenue share — so multiple
 * moderators of the same community can each track their own referrals.
 */
export async function getReferralLink(compassId: string, actingUserId: string) {
  try {
    await assertCompassLeader(compassId, actingUserId);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return { success: true, url: `${baseUrl}/oroslate?ref=${compassId}_${actingUserId}` };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to generate referral link' };
  }
}

export async function getLeaderCompasses(userId: string) {
  const created = await db.compass.findMany({ where: { creatorId: userId }, select: { id: true, name: true, slug: true } });
  const moderated = await db.compassMembership.findMany({
    where: { userId, role: { in: ['MODERATOR', 'ADMIN'] } },
    select: { compass: { select: { id: true, name: true, slug: true } } },
  });

  const byId = new Map(created.map((c) => [c.id, c]));
  moderated.forEach((m) => byId.set(m.compass.id, m.compass));
  return Array.from(byId.values());
}

/**
 * Attaches a Compass-leader referral to a newly created Organization. `ref`
 * is the `compassId_affiliateUserId` token from getReferralLink() — the
 * affiliate is re-verified as a genuine leader of that Compass before the
 * referral is recorded, so a tampered token can't credit an arbitrary user.
 */
export async function attachReferral(organizationId: string, ref: string) {
  const [compassId, affiliateId] = ref.split('_');
  if (!compassId || !affiliateId) return { error: 'Invalid referral link' };

  try {
    await assertCompassLeader(compassId, affiliateId);

    const existing = await db.affiliateReferral.findUnique({ where: { organizationId } });
    if (existing) return { success: true, alreadyAttached: true };

    await db.affiliateReferral.create({
      data: { affiliateId, organizationId, compassId },
    });
    return { success: true, alreadyAttached: false };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to attach referral' };
  }
}

function centsForStatus(entries: { amountCents: number; status: string; releaseDate: Date }[], status: 'PENDING_MATURING' | 'PENDING_READY' | 'RELEASED') {
  const now = new Date();
  return entries.reduce((sum, e) => {
    if (status === 'RELEASED') return e.status === 'RELEASED' ? sum + e.amountCents : sum;
    if (e.status !== 'PENDING') return sum;
    const isReady = e.releaseDate <= now;
    if (status === 'PENDING_READY' && isReady) return sum + e.amountCents;
    if (status === 'PENDING_MATURING' && !isReady) return sum + e.amountCents;
    return sum;
  }, 0);
}

export async function getAffiliateSummary(userId: string) {
  const referrals = await db.affiliateReferral.findMany({
    where: { affiliateId: userId },
    include: {
      organization: { include: { subscription: true } },
      ledgerEntries: { orderBy: { createdAt: 'desc' } },
    },
  });

  const allEntries = referrals.flatMap((r) =>
    r.ledgerEntries.map((entry) => ({ ...entry, organizationName: r.organization.name }))
  );

  return {
    pendingMaturationCents: centsForStatus(allEntries, 'PENDING_MATURING'),
    readyForPayoutCents: centsForStatus(allEntries, 'PENDING_READY'),
    totalPaidCents: centsForStatus(allEntries, 'RELEASED'),
    referredOrganizations: referrals.map((r) => ({
      organizationId: r.organizationId,
      organizationName: r.organization.name,
      tier: r.organization.subscription?.tier ?? 'STARTER',
      status: r.organization.subscription?.status ?? 'TRIALING',
      seatCount: r.organization.subscription?.seatCount ?? 1,
    })),
    ledgerEntries: allEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 25),
  };
}
