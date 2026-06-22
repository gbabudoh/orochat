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

export async function setUserPaused(userId: string, isPaused: boolean) {
  const adminId = await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { isPaused } });
  logAdminAction(adminId, isPaused ? 'user.pause' : 'user.reactivate', { targetType: 'User', targetId: userId });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function bulkSetUserPaused(userIds: string[], isPaused: boolean) {
  const adminId = await requireAdmin();
  if (userIds.length === 0) return { success: true };

  await db.user.updateMany({ where: { id: { in: userIds } }, data: { isPaused } });
  logAdminAction(adminId, isPaused ? 'user.bulk_pause' : 'user.bulk_reactivate', {
    targetType: 'User',
    metadata: { userIds },
  });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function resolveFraudFlag(flagId: string) {
  const adminId = await requireAdmin();
  await db.fraudFlag.update({ where: { id: flagId }, data: { resolved: true } });
  logAdminAction(adminId, 'fraud_flag.resolve', { targetType: 'FraudFlag', targetId: flagId });
  revalidatePath('/admin/users');
  return { success: true };
}
