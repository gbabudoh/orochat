import Link from 'next/link';
import { AdCampaignService } from '@/services/ad-campaign.service';
import { AdCampaignStatus } from '@prisma/client';
import AdsTable from '@/components/admin/AdsTable';
import Pagination from '@/components/admin/Pagination';
import { PAGE_SIZE, parsePage, parseDir } from '@/lib/admin/pagination';
import { db } from '@/lib/db';
import {
  Megaphone,
  Plus,
  PlayCircle,
  Eye,
  MousePointer,
  TrendingUp,
  Search,
  X
} from 'lucide-react';

const STATUS_OPTIONS: AdCampaignStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'];

export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const { q, status, sort, dir, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const sortDir = parseDir(dir);
  const sortKey = sort === 'impressions' || sort === 'clicks' ? sort : 'createdAt';
  const statusFilter = status && STATUS_OPTIONS.includes(status as AdCampaignStatus) ? (status as AdCampaignStatus) : undefined;

  // Run database list and performance metric queries in parallel
  const [
    { campaigns, total: totalFiltered },
    totalCampaigns,
    activeCampaigns,
    totalImpressions,
    totalClicks,
  ] = await Promise.all([
    AdCampaignService.listCampaigns({
      q,
      status: statusFilter,
      sort: sortKey,
      dir: sortDir,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.adCampaign.count(),
    db.adCampaign.count({ where: { status: 'ACTIVE' } }),
    db.adImpression.count(),
    db.adClick.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const searchParamsObj = { q, status, sort, dir, page: pageParam };

  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Status Filter URL builder
  const buildStatusHref = (targetStatus?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (targetStatus) params.set('status', targetStatus);
    if (sort) params.set('sort', sort);
    if (dir) params.set('dir', dir);
    return `?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage sponsored ads, track impressions, click-through rates (CTR), and target audiences.
          </p>
        </div>
        <Link
          href="/admin/ads/new"
          className="inline-flex items-center justify-center gap-2 bg-[#458B9E] hover:bg-[#3a7585] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-[#458B9E]/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Campaigns</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalCampaigns.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">All time created</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Running</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeCampaigns.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Serving in feeds</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <PlayCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Impressions</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalImpressions.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">Total views</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Clicks</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalClicks.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">CTA conversions</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <MousePointer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average CTR</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{avgCtr}%</h3>
            <p className="text-xs text-gray-400 mt-1">Click-through rate</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#458B9E]/10 text-[#458B9E]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls Bar: Status Filter Tabs + Search Input */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Link
            href={buildStatusHref(undefined)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !status
                ? 'bg-[#458B9E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({totalCampaigns})
          </Link>
          {STATUS_OPTIONS.map((st) => (
            <Link
              key={st}
              href={buildStatusHref(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                status === st
                  ? 'bg-[#458B9E] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {st}
            </Link>
          ))}
        </div>

        {/* Search Input Box */}
        <form className="relative flex items-center min-w-[260px] sm:w-80">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search advertiser or headline…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
          />
          {q && (
            <Link
              href={buildStatusHref(status)}
              className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </Link>
          )}
        </form>
      </div>

      {/* Campaigns Table Component */}
      <AdsTable campaigns={campaigns} currentSort={sortKey} currentDir={dir} searchParams={searchParamsObj} />

      {/* Pagination Bar */}
      <Pagination page={page} totalPages={totalPages} searchParams={searchParamsObj} />
    </div>
  );
}
