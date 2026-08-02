'use server';

import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth.admin';
import { logAdminAction } from '@/lib/adminAudit';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error('Not authenticated as admin');
  return session.user.id;
}

export async function setCompassSponsorship(
  compassId: string,
  data: { isSponsored: boolean; sponsorName?: string; sponsorLogo?: string; sponsorLink?: string; sponsorExpiresAt?: Date | null }
) {
  const adminId = await requireAdmin();
  await db.compass.update({ where: { id: compassId }, data: data as any });
  logAdminAction(adminId, 'compass.sponsorship_update', {
    targetType: 'Compass',
    targetId: compassId,
    metadata: { ...data, sponsorExpiresAt: data.sponsorExpiresAt?.toISOString() ?? null },
  });
  revalidatePath('/admin/compass');
  return { success: true };
}

export async function setCompassSuspended(compassId: string, isSuspended: boolean) {
  const adminId = await requireAdmin();
  await db.compass.update({
    where: { id: compassId },
    data: { isSuspended } as any,
  });
  logAdminAction(adminId, isSuspended ? 'compass.suspend' : 'compass.reactivate', {
    targetType: 'Compass',
    targetId: compassId,
    metadata: { isSuspended },
  });
  revalidatePath('/admin/compass');
  return { success: true };
}

export async function flagCompass(compassId: string, isFlagged: boolean, reason?: string) {
  const adminId = await requireAdmin();
  await db.compass.update({
    where: { id: compassId },
    data: {
      isFlagged,
      flagReason: isFlagged ? reason || 'Flagged for moderation review' : null,
    } as any,
  });
  logAdminAction(adminId, isFlagged ? 'compass.flag' : 'compass.unflag', {
    targetType: 'Compass',
    targetId: compassId,
    metadata: { isFlagged, reason },
  });
  revalidatePath('/admin/compass');
  return { success: true };
}

export async function deleteCompass(compassId: string) {
  const adminId = await requireAdmin();

  // Clean up associated memberships, posts, and conversation before deleting
  await db.$transaction([
    db.compassMembership.deleteMany({ where: { compassId } }),
    db.feedPost.updateMany({ where: { compassId }, data: { compassId: null } }),
    db.compass.delete({ where: { id: compassId } }),
  ]);

  logAdminAction(adminId, 'compass.delete', {
    targetType: 'Compass',
    targetId: compassId,
  });

  revalidatePath('/admin/compass');
  return { success: true };
}
