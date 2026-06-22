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
  await db.compass.update({ where: { id: compassId }, data });
  logAdminAction(adminId, 'compass.sponsorship_update', {
    targetType: 'Compass',
    targetId: compassId,
    metadata: { ...data, sponsorExpiresAt: data.sponsorExpiresAt?.toISOString() ?? null },
  });
  revalidatePath('/admin/compass');
  return { success: true };
}
