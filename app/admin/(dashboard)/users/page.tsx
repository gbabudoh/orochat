import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import UsersTable from '@/components/admin/UsersTable';
import Pagination from '@/components/admin/Pagination';
import { PAGE_SIZE, parsePage, parseDir } from '@/lib/admin/pagination';
import { getAdminSession } from '@/lib/auth.admin';
import Link from 'next/link';
import { Users, Award, ShieldAlert, TrendingUp, Search, X, Filter } from 'lucide-react';

const SORT_FIELD: Record<string, keyof Prisma.UserOrderByWithRelationInput> = {
  name: 'name',
  tes: 'currentTES',
  oros: 'verifiedOrosCount',
  communities: 'compassMembershipsCount',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const { q, filter, sort, dir, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const sortDir = parseDir(dir);
  const sortField = sort && SORT_FIELD[sort] ? SORT_FIELD[sort] : null;
  const session = await getAdminSession();
  const canTerminate = session?.user.role === 'SUPER_ADMIN';

  // Construct filtering conditions
  const whereConditions: Prisma.UserWhereInput[] = [];

  if (q?.trim()) {
    whereConditions.push({
      OR: [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { email: { contains: q.trim(), mode: 'insensitive' } },
      ],
    });
  }

  if (filter === 'partners') {
    whereConditions.push({ isPartner: true });
  } else if (filter === 'flagged') {
    whereConditions.push({ fraudFlags: { some: { resolved: false } } });
  }

  const where: Prisma.UserWhereInput | undefined =
    whereConditions.length > 0 ? { AND: whereConditions } : undefined;

  // Run DB queries in parallel for high performance
  const [
    users,
    totalFilteredCount,
    totalUsersCount,
    partnersCount,
    flaggedCount,
    avgTesAggregate,
  ] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        isPartner: true,
        isPaused: true,
        currentTES: true,
        verifiedOrosCount: true,
        compassMembershipsCount: true,
        fraudFlags: { where: { resolved: false }, select: { id: true, reason: true, riskScore: true } },
      },
      orderBy: sortField ? { [sortField]: sortDir } : { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.user.count({ where }),
    db.user.count(),
    db.user.count({ where: { isPartner: true } }),
    db.user.count({ where: { fraudFlags: { some: { resolved: false } } } }),
    db.user.aggregate({ _avg: { currentTES: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / PAGE_SIZE));
  const searchParamsObj = { q, filter, sort, dir, page: pageParam };

  const avgTes = (avgTesAggregate._avg.currentTES ?? 0).toFixed(1);

  // Quick filter tab URL builder
  const buildFilterHref = (targetFilter?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (targetFilter) params.set('filter', targetFilter);
    if (sort) params.set('sort', sort);
    if (dir) params.set('dir', dir);
    return `?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage user accounts, partner statuses, Trust & Engagement Scores (TES), and fraud flags.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Registered</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalUsersCount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">Platform accounts</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified Partners</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{partnersCount.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {((partnersCount / (totalUsersCount || 1)) * 100).toFixed(0)}% of total users
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flagged Accounts</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{flaggedCount.toLocaleString()}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {flaggedCount > 0 ? 'Requires moderation review' : 'No open flags'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${flaggedCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average TES</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{avgTes} <span className="text-xs text-gray-400 font-normal">/ 5.0</span></h3>
            <p className="text-xs text-gray-400 mt-1">Trust & Engagement Score</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#458B9E]/10 text-[#458B9E]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls Bar: Search + Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Link
            href={buildFilterHref(undefined)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !filter
                ? 'bg-[#458B9E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Users ({totalUsersCount})
          </Link>
          <Link
            href={buildFilterHref('partners')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'partners'
                ? 'bg-[#458B9E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Partners ({partnersCount})
          </Link>
          <Link
            href={buildFilterHref('flagged')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'flagged'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Flagged ({flaggedCount})
          </Link>
        </div>

        {/* Search Input Box */}
        <form className="relative flex items-center min-w-[260px] sm:w-80">
          {q && <input type="hidden" name="filter" value={filter} />}
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
          />
          {q && (
            <Link
              href={buildFilterHref(filter)}
              className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </Link>
          )}
        </form>
      </div>

      {/* Users Table Component */}
      <UsersTable
        users={users}
        currentSort={sort}
        currentDir={dir}
        searchParams={searchParamsObj}
        canTerminate={canTerminate}
      />

      {/* Pagination Bar */}
      <Pagination page={page} totalPages={totalPages} searchParams={searchParamsObj} />
    </div>
  );
}
