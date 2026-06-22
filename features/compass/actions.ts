'use server';

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { regenerateCompassEmbedding } from '@/lib/ai/compassEmbedding';
import { z } from 'zod';

const createCommunitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

/**
 * Every Compass community has a backing group Conversation for its chat
 * tab. Communities created before this existed don't have one yet, so this
 * also backfills: finds the existing conversation, or creates one and adds
 * every current member as a participant.
 */
async function ensureCompassConversation(compassId: string, compassName: string): Promise<string> {
  const existing = await db.conversation.findUnique({ where: { compassId } });
  if (existing) return existing.id;

  const memberIds = (
    await db.compassMembership.findMany({ where: { compassId }, select: { userId: true } })
  ).map((m) => m.userId);

  const conversation = await db.conversation.create({
    data: {
      isGroup: true,
      name: compassName,
      compassId,
      participants: { create: memberIds.map((userId) => ({ userId })) },
    },
  });

  return conversation.id;
}

export async function joinCommunity(compassId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  try {
    const existing = await db.compassMembership.findUnique({
      where: {
        userId_compassId: {
          userId: session.user.id,
          compassId,
        },
      },
    });

    if (existing) return { error: 'Already a member' };

    const community = await db.compass.findUnique({ where: { id: compassId }, select: { name: true } });
    if (!community) return { error: 'Community not found' };

    await db.compassMembership.create({
      data: {
        userId: session.user.id,
        compassId,
        role: 'MEMBER',
      },
    });

    // Update user's membership count
    await db.user.update({
      where: { id: session.user.id },
      data: {
        compassMembershipsCount: { increment: 1 }
      }
    });

    const conversationId = await ensureCompassConversation(compassId, community.name);
    await db.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
      update: {},
      create: { conversationId, userId: session.user.id },
    });

    revalidatePath(`/compass`);
    revalidatePath(`/compass/[slug]`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Join community error:', error);
    return { error: 'Failed to join community' };
  }
}

const DISCUSSION_SENDER_SELECT = { id: true, name: true, avatar: true } as const;

async function assertCompassMember(compassId: string, userId: string) {
  const membership = await db.compassMembership.findUnique({
    where: { userId_compassId: { userId, compassId } },
  });
  if (!membership) throw new Error('Not a member of this community');
  return membership;
}

/**
 * Community Discussion — a plain text thread scoped to the community
 * itself, deliberately independent of the Collab feature (no calls, no
 * Collab URLs/branding). Internally it's backed by the same
 * Conversation/Message tables Collab uses, but that's just data reuse —
 * nothing here is presented as "Collab."
 */
export async function getDiscussionMessages(compassId: string, userId: string) {
  try {
    await assertCompassMember(compassId, userId);
    const community = await db.compass.findUnique({ where: { id: compassId }, select: { name: true } });
    if (!community) return { error: 'Community not found' };

    const conversationId = await ensureCompassConversation(compassId, community.name);
    const messages = await db.message.findMany({
      where: { conversationId },
      include: { sender: { select: DISCUSSION_SENDER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, messages };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to load discussion' };
  }
}

export async function postDiscussionMessage(compassId: string, userId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return { error: 'Message cannot be empty' };
  if (trimmed.length > 2000) return { error: 'Message must be under 2,000 characters' };

  try {
    await assertCompassMember(compassId, userId);
    const community = await db.compass.findUnique({ where: { id: compassId }, select: { name: true } });
    if (!community) return { error: 'Community not found' };

    const conversationId = await ensureCompassConversation(compassId, community.name);
    const message = await db.message.create({
      data: { conversationId, senderId: userId, content: trimmed },
      include: { sender: { select: DISCUSSION_SENDER_SELECT } },
    });

    return { success: true, message };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to send message' };
  }
}

const MEMBER_SELECT = { id: true, name: true, avatar: true, title: true } as const;

export async function getCompassMembers(compassId: string, userId: string) {
  try {
    const callerMembership = await db.compassMembership.findUnique({
      where: { userId_compassId: { userId, compassId } },
    });
    if (!callerMembership) return { error: 'Not a member of this community' };

    const memberships = await db.compassMembership.findMany({
      where: { compassId },
      include: { user: { select: MEMBER_SELECT } },
      orderBy: [{ role: 'desc' }, { joinedAt: 'asc' }],
    });

    return {
      success: true,
      members: memberships.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      callerRole: callerMembership.role,
    };
  } catch (error) {
    console.error('Get compass members error:', error);
    return { error: 'Failed to load members' };
  }
}

/**
 * Leaving is blocked for the last remaining ADMIN — promote someone else
 * first, otherwise the community would be left without anyone able to
 * moderate it.
 */
export async function leaveCommunity(compassId: string, userId: string) {
  try {
    const membership = await db.compassMembership.findUnique({
      where: { userId_compassId: { userId, compassId } },
    });
    if (!membership) return { error: 'Not a member of this community' };

    if (membership.role === 'ADMIN') {
      const otherAdmins = await db.compassMembership.count({
        where: { compassId, role: 'ADMIN', userId: { not: userId } },
      });
      if (otherAdmins === 0) {
        return { error: 'You are the only Admin — promote another member to Admin before leaving' };
      }
    }

    const conversation = await db.conversation.findUnique({ where: { compassId } });

    await db.$transaction(async (tx) => {
      await tx.compassMembership.delete({ where: { userId_compassId: { userId, compassId } } });
      await tx.user.update({
        where: { id: userId },
        data: { compassMembershipsCount: { decrement: 1 } },
      });
      if (conversation) {
        await tx.conversationParticipant.deleteMany({ where: { conversationId: conversation.id, userId } });
      }
    });

    revalidatePath('/compass');
    revalidatePath('/compass/[slug]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Leave community error:', error);
    return { error: 'Failed to leave community' };
  }
}

async function assertCanModerate(compassId: string, actingUserId: string) {
  const membership = await db.compassMembership.findUnique({
    where: { userId_compassId: { userId: actingUserId, compassId } },
  });
  if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'MODERATOR')) {
    throw new Error('Only Admins and Moderators can do this');
  }
  return membership;
}

/**
 * Admin/Moderator-only: removes another member. Moderators can't remove
 * Admins; only an Admin can remove another Admin.
 */
export async function removeMember(compassId: string, actingUserId: string, targetUserId: string) {
  try {
    if (actingUserId === targetUserId) return { error: 'Use "Leave Community" to remove yourself' };
    const actingMembership = await assertCanModerate(compassId, actingUserId);

    const targetMembership = await db.compassMembership.findUnique({
      where: { userId_compassId: { userId: targetUserId, compassId } },
    });
    if (!targetMembership) return { error: 'Member not found' };
    if (targetMembership.role === 'ADMIN' && actingMembership.role !== 'ADMIN') {
      return { error: 'Only an Admin can remove another Admin' };
    }

    const conversation = await db.conversation.findUnique({ where: { compassId } });

    await db.$transaction(async (tx) => {
      await tx.compassMembership.delete({ where: { userId_compassId: { userId: targetUserId, compassId } } });
      await tx.user.update({
        where: { id: targetUserId },
        data: { compassMembershipsCount: { decrement: 1 } },
      });
      if (conversation) {
        await tx.conversationParticipant.deleteMany({ where: { conversationId: conversation.id, userId: targetUserId } });
      }
    });

    revalidatePath('/compass/[slug]', 'page');
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to remove member' };
  }
}

/**
 * Admin-only: promotes/demotes a member. Can't demote the last Admin.
 */
export async function updateMemberRole(compassId: string, actingUserId: string, targetUserId: string, newRole: 'MEMBER' | 'MODERATOR' | 'ADMIN') {
  try {
    const actingMembership = await db.compassMembership.findUnique({
      where: { userId_compassId: { userId: actingUserId, compassId } },
    });
    if (!actingMembership || actingMembership.role !== 'ADMIN') {
      return { error: 'Only Admins can change member roles' };
    }

    const targetMembership = await db.compassMembership.findUnique({
      where: { userId_compassId: { userId: targetUserId, compassId } },
    });
    if (!targetMembership) return { error: 'Member not found' };

    if (targetMembership.role === 'ADMIN' && newRole !== 'ADMIN') {
      const otherAdmins = await db.compassMembership.count({
        where: { compassId, role: 'ADMIN', userId: { not: targetUserId } },
      });
      if (otherAdmins === 0) return { error: 'There must be at least one Admin' };
    }

    await db.compassMembership.update({
      where: { userId_compassId: { userId: targetUserId, compassId } },
      data: { role: newRole },
    });

    revalidatePath('/compass/[slug]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Update member role error:', error);
    return { error: 'Failed to update role' };
  }
}

export async function createCommunity(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user?.isPartner) {
    return { error: 'Only Orochat Partners can create communities' };
  }

  const rawData = {
    name: formData.get('name') as string,
    slug: (formData.get('slug') as string)?.toLowerCase(),
    description: formData.get('description') as string,
  };

  try {
    const validatedData = createCommunitySchema.parse(rawData);

    // Check if slug is taken
    const existing = await db.compass.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existing) return { error: 'This slug is already taken' };

    const community = await db.compass.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        creatorId: session.user.id,
      },
    });

    // Creator automatically becomes an ADMIN member
    await db.compassMembership.create({
      data: {
        userId: session.user.id,
        compassId: community.id,
        role: 'ADMIN',
      },
    });

    await ensureCompassConversation(community.id, community.name);

    regenerateCompassEmbedding(community.id).catch((err) =>
      console.error('Failed to embed new community:', err)
    );

    revalidatePath('/compass');

    return { success: true, slug: community.slug };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    console.error('Create community error:', error);
    return { error: 'Failed to create community' };
  }
}
