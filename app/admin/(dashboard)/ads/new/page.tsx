import { db } from '@/lib/db';
import CampaignForm from '@/components/admin/CampaignForm';

export default async function NewAdCampaignPage() {
  const compassOptions = await db.compass.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return <CampaignForm compassOptions={compassOptions} />;
}
