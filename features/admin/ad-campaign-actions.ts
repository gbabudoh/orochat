'use server';

import { getAdminSession } from '@/lib/auth.admin';
import { AdCampaignService } from '@/services/ad-campaign.service';
import { AdCampaignStatus } from '@prisma/client';
import { logAdminAction } from '@/lib/adminAudit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error('Not authenticated as admin');
  return session.user.id;
}

const campaignSchema = z.object({
  advertiserName: z.string().min(1, 'Advertiser name is required'),
  headline: z.string().min(1, 'Headline is required'),
  body: z.string().min(1, 'Body is required'),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().min(1, 'CTA label is required'),
  ctaUrl: z.string().url('CTA URL must be a valid URL'),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  targetGlobal: z.boolean(),
  targetCompassIds: z.array(z.string()),
  targetKeywords: z.string().optional(),
});

function parseCampaignForm(formData: FormData) {
  return campaignSchema.parse({
    advertiserName: formData.get('advertiserName'),
    headline: formData.get('headline'),
    body: formData.get('body'),
    imageUrl: formData.get('imageUrl') || undefined,
    ctaLabel: formData.get('ctaLabel'),
    ctaUrl: formData.get('ctaUrl'),
    startAt: formData.get('startAt'),
    endAt: formData.get('endAt'),
    targetGlobal: formData.get('targetGlobal') === 'on',
    targetCompassIds: formData.getAll('targetCompassIds'),
    targetKeywords: formData.get('targetKeywords') || undefined,
  });
}

export async function createCampaign(formData: FormData) {
  const adminId = await requireAdmin();
  try {
    const data = parseCampaignForm(formData);
    const campaign = await AdCampaignService.createCampaign(data);
    logAdminAction(adminId, 'campaign.create', { targetType: 'AdCampaign', targetId: campaign.id });
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    const err = error as Error;
    return { error: err.message || 'Failed to create campaign' };
  }
  revalidatePath('/admin/ads');
  return { success: true };
}

export async function updateCampaign(id: string, formData: FormData) {
  const adminId = await requireAdmin();
  try {
    const data = parseCampaignForm(formData);
    await AdCampaignService.updateCampaign(id, data);
    logAdminAction(adminId, 'campaign.update', { targetType: 'AdCampaign', targetId: id });
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    const err = error as Error;
    return { error: err.message || 'Failed to update campaign' };
  }
  revalidatePath('/admin/ads');
  return { success: true };
}

export async function setCampaignStatus(id: string, status: AdCampaignStatus) {
  const adminId = await requireAdmin();
  await AdCampaignService.setCampaignStatus(id, status);
  logAdminAction(adminId, 'campaign.status_change', { targetType: 'AdCampaign', targetId: id, metadata: { status } });
  revalidatePath('/admin/ads');
  return { success: true };
}

export async function bulkSetCampaignStatus(ids: string[], status: AdCampaignStatus) {
  const adminId = await requireAdmin();
  if (ids.length === 0) return { success: true };
  await AdCampaignService.bulkSetCampaignStatus(ids, status);
  logAdminAction(adminId, 'campaign.bulk_status_change', { targetType: 'AdCampaign', metadata: { ids, status } });
  revalidatePath('/admin/ads');
  return { success: true };
}
