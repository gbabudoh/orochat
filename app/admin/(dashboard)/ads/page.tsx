import Link from 'next/link';
import { AdCampaignService } from '@/services/ad-campaign.service';
import { AdCampaignStatus } from '@prisma/client';
import AdsTable from '@/components/admin/AdsTable';
import Pagination from '@/components/admin/Pagination';
import { PAGE_SIZE, parsePage, parseDir } from '@/lib/admin/pagination';

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

  const { campaigns, total } = await AdCampaignService.listCampaigns({
    q,
    status: statusFilter,
    sort: sortKey,
    dir: sortDir,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const searchParamsObj = { q, status, sort, dir, page: pageParam };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Ad Campaigns</h1>
        <Link
          href="/admin/ads/new"
          className="bg-[#458B9E] hover:bg-[#3a7585] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          New Campaign
        </Link>
      </div>

      <form className="flex items-center gap-3 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by advertiser or headline…"
          className="w-full max-w-sm px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
        <select name="status" defaultValue={status ?? ''} className="px-3 py-2 rounded-lg border-2 border-gray-200 text-sm">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="text-sm font-medium text-[#458B9E] hover:underline">
          Filter
        </button>
      </form>

      <AdsTable campaigns={campaigns} currentSort={sortKey} currentDir={dir} searchParams={searchParamsObj} />
      <Pagination page={page} totalPages={totalPages} searchParams={searchParamsObj} />
    </div>
  );
}
