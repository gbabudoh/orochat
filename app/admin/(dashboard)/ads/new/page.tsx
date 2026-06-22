import { db } from '@/lib/db';
import CampaignForm from '@/components/admin/CampaignForm';

export default async function NewAdCampaignPage() {
  const compassOptions = await db.compass.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">New Campaign</h1>
      <CampaignForm compassOptions={compassOptions} />
    </div>
  );
}
