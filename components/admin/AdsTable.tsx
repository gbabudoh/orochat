'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdCampaignStatus } from '@prisma/client';
import CampaignStatusControl from './CampaignStatusControl';
import SortableHeader from './SortableHeader';
import { bulkSetCampaignStatus } from '@/features/admin/ad-campaign-actions';
import {
  Megaphone,
  Plus,
  Eye,
  MousePointer,
  Calendar,
  PlayCircle,
  PauseCircle,
  StopCircle,
  FileText,
  TrendingUp,
  Check
} from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
      {/* Floating Bulk Selection Action Header */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-6 py-3 bg-[#458B9E]/10 border-b border-[#458B9E]/20 animate-fade-in">
          <span className="text-sm font-semibold text-[#458B9E] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#458B9E] text-white flex items-center justify-center text-xs font-bold">
              {selected.size}
            </span>
            Campaigns Selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => runBulk('ACTIVE')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60 transition-all cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Activate Selected
            </button>
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => runBulk('PAUSED')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-60 transition-all cursor-pointer"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Pause Selected
            </button>
            <button
              type="button"
              disabled={isBulkLoading}
              onClick={() => runBulk('ENDED')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60 transition-all cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 text-[#458B9E] rounded border-gray-300 focus:ring-[#458B9E]"
                  aria-label="Select all campaigns"
                />
              </th>
              <th className="px-5 py-3.5">Campaign & Advertiser</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">
                <SortableHeader label="Active Dates" sortKey="createdAt" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">
                <SortableHeader label="Impressions" sortKey="impressions" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">
                <SortableHeader label="Clicks" sortKey="clicks" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">CTR %</th>
              <th className="px-5 py-3.5 text-right">Control</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {campaigns.map((campaign) => {
              const isChecked = selected.has(campaign.id);
              const ctrVal = campaign.impressionCount > 0 ? (campaign.clickCount / campaign.impressionCount) * 100 : 0;

              return (
                <tr
                  key={campaign.id}
                  className={`transition-colors ${
                    isChecked ? 'bg-[#458B9E]/5' : 'hover:bg-gray-50/80'
                  }`}
                >
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(campaign.id)}
                      className="w-4 h-4 text-[#458B9E] rounded border-gray-300 focus:ring-[#458B9E]"
                      aria-label={`Select ${campaign.headline}`}
                    />
                  </td>

                  {/* Campaign Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 mt-0.5 shrink-0">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/ads/${campaign.id}`}
                          className="font-bold text-gray-900 hover:text-[#458B9E] transition-colors leading-snug block"
                        >
                          {campaign.headline}
                        </Link>
                        <span className="text-xs text-gray-500 font-medium mt-0.5 block">
                          {campaign.advertiserName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge Column */}
                  <td className="px-5 py-4">
                    {campaign.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    ) : campaign.status === 'PAUSED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        PAUSED
                      </span>
                    ) : campaign.status === 'DRAFT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        <FileText className="w-3 h-3 text-gray-400" />
                        DRAFT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                        ENDED
                      </span>
                    )}
                  </td>

                  {/* Dates Column */}
                  <td className="px-5 py-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>
                        {new Date(campaign.startAt).toLocaleDateString()} – {new Date(campaign.endAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>

                  {/* Impressions Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <Eye className="w-3.5 h-3.5 text-purple-500" />
                      <span>{campaign.impressionCount.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Clicks Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <MousePointer className="w-3.5 h-3.5 text-amber-500" />
                      <span>{campaign.clickCount.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* CTR % Column */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                        ctrVal >= 2.0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ctrVal > 0
                          ? 'bg-[#458B9E]/10 text-[#458B9E] border border-[#458B9E]/20'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {ctrVal.toFixed(2)}%
                    </span>
                  </td>

                  {/* Status Control Column */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end">
                      <CampaignStatusControl campaignId={campaign.id} status={campaign.status} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rich Empty State */}
      {campaigns.length === 0 && (
        <div className="text-center py-16 px-4 space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-[#458B9E]/10 text-[#458B9E] flex items-center justify-center mx-auto shadow-xs">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">No ad campaigns found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Create your first sponsored ad campaign to promote products, special offers, or announcements across the Global feed and Compass communities.
            </p>
          </div>
          <div>
            <Link
              href="/admin/ads/new"
              className="inline-flex items-center gap-2 bg-[#458B9E] hover:bg-[#3a7585] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-[#458B9E]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Campaign</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
