'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setCampaignStatus } from '@/features/admin/ad-campaign-actions';
import { AdCampaignStatus } from '@prisma/client';

const NEXT_STATUS: Record<AdCampaignStatus, { label: string; status: AdCampaignStatus } | null> = {
  DRAFT: { label: 'Activate', status: 'ACTIVE' },
  ACTIVE: { label: 'Pause', status: 'PAUSED' },
  PAUSED: { label: 'Resume', status: 'ACTIVE' },
  ENDED: null,
};

export default function CampaignStatusControl({ campaignId, status }: { campaignId: string; status: AdCampaignStatus }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const action = NEXT_STATUS[status];

  const runChange = async (newStatus: AdCampaignStatus) => {
    setIsLoading(true);
    await setCampaignStatus(campaignId, newStatus);
    setIsLoading(false);
    toast.success(`Campaign ${newStatus.toLowerCase()}`);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {action && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => runChange(action.status)}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#458B9E] text-white hover:bg-[#3a7585] disabled:opacity-60 transition-colors"
        >
          {action.label}
        </button>
      )}
      {status !== 'ENDED' && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => runChange('ENDED')}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60 transition-colors"
        >
          End
        </button>
      )}
    </div>
  );
}
