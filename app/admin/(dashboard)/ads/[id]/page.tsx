import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { AdCampaignService } from '@/services/ad-campaign.service';
import CampaignForm from '@/components/admin/CampaignForm';

export default async function EditAdCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign, compassOptions] = await Promise.all([
    AdCampaignService.getCampaign(id),
    db.compass.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!campaign) notFound();

  return <CampaignForm compassOptions={compassOptions} campaign={campaign} />;
}
