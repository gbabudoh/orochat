'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createNest, getNest } from '@/features/nest/actions';
import { TIER_LIMITS, TRIAL_DURATION_DAYS } from '@/lib/oroslate/tiers';
import type { SlateTier } from '@prisma/client';

const MEMBER_SELECT = {
  id: true,
  name: true,
  avatar: true,
  title: true,
} as const;

async function assertOrgMember(organizationId: string, userId: string) {
  const member = await db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  if (!member) throw new Error('Not a member of this organization');
  return member;
}

async function assertOrgAdmin(organizationId: string, userId: string) {
  const member = await assertOrgMember(organizationId, userId);
  if (member.role !== 'ADMIN') throw new Error('Only an organization admin can do this');
  return member;
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || 'org';
}

async function generateUniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.organization.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

/**
 * Creates an Organization (the paying entity behind one or more Slates) and
 * immediately seeds it with a 14-day Pro-tier trial Subscription — there is
 * no separate "start trial" step, per the product's product-led-growth flow.
 */
export async function createOrganization(ownerId: string, name: string) {
  if (!name.trim()) return { error: 'Organization name is required' };

  try {
    const slug = await generateUniqueOrgSlug(name);
    const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const organization = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: name.trim(),
          slug,
          ownerId,
          members: { create: { userId: ownerId, role: 'ADMIN' } },
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          tier: 'PRO', // trial runs on Pro-tier features per the onboarding design
          status: 'TRIALING',
          trialEndsAt,
        },
      });

      return org;
    });

    revalidatePath('/oroslate');
    return { success: true, organizationId: organization.id, slug: organization.slug };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to create organization' };
  }
}

export async function getOrganizationsForUser(userId: string) {
  const memberships = await db.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          subscription: true,
          _count: { select: { members: true, slates: true } },
        },
      },
    },
    orderBy: { organization: { updatedAt: 'desc' } },
  });

  return memberships.map((m) => ({ ...m.organization, myRole: m.role }));
}

export async function getOrganization(organizationId: string, userId: string) {
  try {
    await assertOrgMember(organizationId, userId);

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true,
        members: { include: { user: { select: MEMBER_SELECT } } },
      },
    });

    if (!organization) return { error: 'Organization not found' };
    return { success: true, organization };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to load organization' };
  }
}

export async function getSlatesForOrganization(organizationId: string, userId: string) {
  await assertOrgMember(organizationId, userId);

  return db.nest.findMany({
    where: { organizationId, archived: false },
    include: {
      members: { include: { user: { select: MEMBER_SELECT } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Loads a Slate workspace along with its Organization + Subscription, so the
 * workspace page can render the tier badge and trial/upgrade banner.
 */
export async function getSlate(slateId: string, userId: string) {
  const nestResult = await getNest(slateId, userId);
  if (!nestResult.success || !nestResult.nest) {
    return { error: nestResult.error ?? 'Failed to load Slate' };
  }
  if (!nestResult.nest.organizationId) return { error: 'This workspace is not an Oroslate Slate' };

  const organization = await db.organization.findUnique({
    where: { id: nestResult.nest.organizationId },
    include: { subscription: true },
  });
  if (!organization) return { error: 'Organization not found' };

  return { success: true, nest: nestResult.nest, organization };
}

async function assertSlateCapacity(organizationId: string) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true, slates: { where: { archived: false } } },
  });
  if (!org) throw new Error('Organization not found');

  const tier: SlateTier = org.subscription?.tier ?? 'STARTER';
  const limits = TIER_LIMITS[tier];
  if (org.slates.length >= limits.maxBoards) {
    throw new Error(`Your ${limits.label} plan allows up to ${limits.maxBoards} active Slates. Upgrade to add more.`);
  }
}

/**
 * Creates a brand-new Slate for an Organization. Thin wrapper around the
 * existing OroNest creation flow — reuses createNest() for the
 * connection-gated invite logic and the Conversation/board/notes setup,
 * then attaches the resulting Nest to the Organization.
 */
export async function createSlate(
  organizationId: string,
  actingUserId: string,
  name: string,
  participantIds: string[] = [],
  durationDays?: number
) {
  try {
    await assertOrgMember(organizationId, actingUserId);
    await assertSlateCapacity(organizationId);

    const nestResult = await createNest(actingUserId, name, participantIds, durationDays);
    if (!nestResult.success || !nestResult.nestId) {
      return { error: nestResult.error ?? 'Failed to create Slate' };
    }

    await db.nest.update({ where: { id: nestResult.nestId }, data: { organizationId } });

    revalidatePath('/oroslate');
    return { success: true, slateId: nestResult.nestId };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to create Slate' };
  }
}

/**
 * The "Convert this chat into an Oroslate Project" entry point — turns an
 * existing Collab conversation directly into a Slate, reusing its
 * conversation/participants instead of creating a duplicate chat thread.
 */
export async function convertConversationToSlate(
  conversationId: string,
  organizationId: string,
  actingUserId: string,
  name: string
) {
  try {
    await assertOrgMember(organizationId, actingUserId);

    const participant = await db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: actingUserId } },
    });
    if (!participant) return { error: 'Not a participant of this chat' };

    const existingNest = await db.nest.findUnique({ where: { conversationId } });
    if (existingNest) return { error: 'This chat is already an Oroslate Slate' };

    await assertSlateCapacity(organizationId);

    const participants = await db.conversationParticipant.findMany({ where: { conversationId } });

    const nest = await db.nest.create({
      data: {
        name: name.trim() || 'Untitled Slate',
        ownerId: actingUserId,
        conversationId,
        organizationId,
        members: { create: participants.map((p) => ({ userId: p.userId })) },
      },
    });

    revalidatePath('/oroslate');
    return { success: true, slateId: nest.id };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to convert chat into a Slate' };
  }
}

/**
 * Adds a member to an Organization's roster. Paid seats add to the
 * subscription's billed seat count (reconciled by the seat sync in the
 * Stripe subscription webhook); external Oros are gated by the tier's free
 * external-collaborator allowance instead of billed as seats.
 */
export async function inviteToOrganization(
  organizationId: string,
  actingUserId: string,
  userId: string,
  isExternalOro = false
) {
  try {
    await assertOrgAdmin(organizationId, actingUserId);

    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true, members: true },
    });
    if (!org) return { error: 'Organization not found' };

    if (isExternalOro) {
      const tier: SlateTier = org.subscription?.tier ?? 'STARTER';
      const limits = TIER_LIMITS[tier];
      const paidSeats = org.members.filter((m) => !m.isExternalOro).length;
      const externalCount = org.members.filter((m) => m.isExternalOro).length;
      const freeAllowance =
        limits.freeExternalOrosPerSeat === Infinity ? Infinity : limits.freeExternalOrosPerSeat * paidSeats;
      if (externalCount >= freeAllowance) {
        return {
          error: `Your ${limits.label} plan includes ${freeAllowance} free external Oro seat(s). Upgrade to invite more.`,
        };
      }
    }

    const member = await db.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      update: { isExternalOro },
      create: { organizationId, userId, isExternalOro },
    });

    revalidatePath('/oroslate');
    return { success: true, member };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to invite member' };
  }
}
