'use server';

import { getAdminSession, requireSuperAdmin } from '@/lib/auth.admin';
import { getPlatformConfig, updateOroSharePercent } from '@/lib/platformConfig';
import { AdminService } from '@/services/admin.service';
import { StripeService } from '@/services/stripe.service';
import { logAdminAction } from '@/lib/adminAudit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error('Not authenticated as admin');
  return session.user.id;
}

export async function updatePlatformSplit(formData: FormData) {
  const adminId = await requireSuperAdmin();
  try {
    const oroSharePercent = z.coerce.number().min(0).max(1).parse(formData.get('oroSharePercent'));
    await updateOroSharePercent(oroSharePercent);
    logAdminAction(adminId, 'platform_config.update_split', { metadata: { oroSharePercent } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    const err = error as Error;
    return { error: err.message || 'Failed to update split' };
  }
}

export async function getPlatformSplit() {
  await requireAdmin();
  return getPlatformConfig();
}

const createPoolSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
  grossAmount: z.coerce.number().positive(),
});

export async function createRevenuePool(formData: FormData) {
  const adminId = await requireAdmin();
  try {
    const { month, year, grossAmount } = createPoolSchema.parse({
      month: formData.get('month'),
      year: formData.get('year'),
      grossAmount: formData.get('grossAmount'),
    });
    const pool = await AdminService.createRevenuePool(month, year, grossAmount);
    logAdminAction(adminId, 'revenue_pool.create', { targetType: 'AdRevenuePool', targetId: pool.id, metadata: { month, year, grossAmount } });
    revalidatePath('/admin/revenue');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    const err = error as Error;
    return { error: err.message || 'Failed to create pool' };
  }
}

export async function distributePoolRevenue(poolId: string) {
  const adminId = await requireAdmin();
  try {
    await AdminService.distributeRevenue(poolId);
    logAdminAction(adminId, 'revenue_pool.distribute', { targetType: 'AdRevenuePool', targetId: poolId, metadata: { triggeredPayouts: true } });
    revalidatePath('/admin/revenue');
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'Failed to distribute revenue' };
  }
}

export async function retryDistributionPayout(distributionId: string) {
  const adminId = await requireAdmin();
  const result = await StripeService.payoutSingleDistribution(distributionId);
  logAdminAction(adminId, 'revenue_distribution.retry_payout', {
    targetType: 'RevenueDistribution',
    targetId: distributionId,
    metadata: { success: result.success, reason: result.reason },
  });
  revalidatePath('/admin/revenue');
  return result.success ? { success: true } : { error: result.reason || 'Payout failed' };
}
