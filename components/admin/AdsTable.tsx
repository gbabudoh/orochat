'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import { AdCampaignStatus } from '@prisma/client';
import CampaignStatusControl from './CampaignStatusControl';
import SortableHeader from './SortableHeader';
import { bulkSetCampaignStatus } from '@/features/admin/ad-campaign-actions';

interface CampaignRow {
  id: string;
  headline: string;
  advertiserName: string;
  status: AdCampaignStatus;
  startAt: Date;
  endAt: Date;
  impressionCount: number;
  clickCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-50 text-green-700',
  PAUSED: 'bg-amber-50 text-amber-700',
  ENDED: 'bg-gray-100 text-gray-400',
};

interface Props {
  campaigns: CampaignRow[];
  currentSort?: string;
  currentDir?: string;
  searchParams: Record<string, string | undefined>;
}

export default function AdsTable({ campaigns, currentSort, currentDir, searchParams }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = campaigns.length > 0 && campaigns.every((c) => selected.has(c.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(campaigns.map((c) => c.id)));

  const runBulk = async (status: AdCampaignStatus) => {
    setIsBulkLoading(true);
    await bulkSetCampaignStatus(Array.from(selected), status);
    setIsBulkLoading(false);
    toast.success(`Selected campaigns set to ${status.toLowerCase()}`);
    setSelected(new Set());
    router.refresh();
  };

  const headerProps = { currentSort, currentDir, searchParams };

  return (
    <Card padding="none" className="overflow-hidden">
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#458B9E]/5 border-b border-gray-200">
          <span className="text-sm text-gray-600">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={isBulkLoading} onClick={() => runBulk('ACTIVE')} className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60 transition-colors">
              Activate
            </button>
            <button type="button" disabled={isBulkLoading} onClick={() => runBulk('PAUSED')} className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition-colors">
              Pause
            </button>
            <button type="button" disabled={isBulkLoading} onClick={() => runBulk('ENDED')} className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-60 transition-colors">
              End
            </button>
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-3 w-8">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4" aria-label="Select all" />
            </th>
            <th className="px-4 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">
              <SortableHeader label="Dates" sortKey="createdAt" {...headerProps} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortableHeader label="Impressions" sortKey="impressions" {...headerProps} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortableHeader label="Clicks" sortKey="clicks" {...headerProps} />
            </th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {campaigns.map((campaign) => (
            <tr key={campaign.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(campaign.id)}
                  onChange={() => toggle(campaign.id)}
                  className="w-4 h-4"
                  aria-label={`Select ${campaign.headline}`}
                />
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/ads/${campaign.id}`} className="font-medium text-[#333333] hover:text-[#458B9E]">
                  {campaign.headline}
                </Link>
                <p className="text-gray-500 text-xs">{campaign.advertiserName}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[campaign.status]}`}>
                  {campaign.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {new Date(campaign.startAt).toLocaleDateString()} – {new Date(campaign.endAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">{campaign.impressionCount}</td>
              <td className="px-4 py-3">{campaign.clickCount}</td>
              <td className="px-4 py-3">
                <CampaignStatusControl campaignId={campaign.id} status={campaign.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {campaigns.length === 0 && <p className="text-center text-gray-500 py-12">No campaigns found</p>}
    </Card>
  );
}
