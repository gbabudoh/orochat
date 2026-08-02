import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import CompassTable from '@/components/admin/CompassTable';
import Link from 'next/link';
import { Compass, Sparkles, Users, MessageSquare, Search, X, Ban } from 'lucide-react';

export default async function AdminCompassPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; sort?: string; dir?: string }>;
}) {
  const { q, filter, sort, dir } = await searchParams;
  const sortDir = dir === 'asc' ? 'asc' : 'desc';

  // Construct filtering conditions
  const whereConditions: Prisma.CompassWhereInput[] = [];

  if (q?.trim()) {
    whereConditions.push({
      OR: [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { slug: { contains: q.trim(), mode: 'insensitive' } },
      ],
    });
  }

  if (filter === 'sponsored') {
    whereConditions.push({ isSponsored: true });
  } else if (filter === 'suspended') {
    whereConditions.push({ isSuspended: true } as any);
  } else if (filter === 'flagged') {
    whereConditions.push({ isFlagged: true } as any);
  }

  const where: Prisma.CompassWhereInput | undefined =
    whereConditions.length > 0 ? { AND: whereConditions } : undefined;

  const orderBy: Prisma.CompassOrderByWithRelationInput =
    sort === 'members'
      ? { memberships: { _count: sortDir } }
      : sort === 'posts'
        ? { posts: { _count: sortDir } }
        : { createdAt: 'desc' };

  // Parallel DB queries for community metrics
  const [
    communities,
    totalCommunitiesCount,
    sponsoredCommunitiesCount,
    suspendedCommunitiesCount,
    flaggedCommunitiesCount,
    totalMembershipsCount,
    totalPostsCount,
  ] = await Promise.all([
    db.compass.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        isSponsored: true,
        isSuspended: true,
        isFlagged: true,
        flagReason: true,
        creator: { select: { name: true, email: true } },
        _count: { select: { memberships: true, posts: true } },
      } as any,
      orderBy,
    }),
    db.compass.count(),
    db.compass.count({ where: { isSponsored: true } }),
    db.compass.count({ where: { isSuspended: true } as any }),
    db.compass.count({ where: { isFlagged: true } as any }),
    db.compassMembership.count(),
    db.feedPost.count({ where: { compassId: { not: null } } }),
  ]);

  const searchParamsObj = { q, filter, sort, dir };

  // Filter URL builder
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
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compass Communities</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor topic channels, control sponsorship, and moderate community status (suspend, flag, or remove).
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Communities</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalCommunitiesCount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">Topic channels</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Compass className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sponsored</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{sponsoredCommunitiesCount.toLocaleString()}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Featured sponsorship</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Memberships</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalMembershipsCount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">User subscriptions</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Moderation Status</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{suspendedCommunitiesCount + flaggedCommunitiesCount}</h3>
            <p className="text-xs text-red-600 font-medium mt-1">
              {suspendedCommunitiesCount} suspended • {flaggedCommunitiesCount} flagged
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-red-50 text-red-600">
            <Ban className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls Bar: Filter Tabs + Search Input */}
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
            All ({totalCommunitiesCount})
          </Link>
          <Link
            href={buildFilterHref('sponsored')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'sponsored'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sponsored ({sponsoredCommunitiesCount})
          </Link>
          <Link
            href={buildFilterHref('suspended')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'suspended'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Suspended ({suspendedCommunitiesCount})
          </Link>
          <Link
            href={buildFilterHref('flagged')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'flagged'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Flagged ({flaggedCommunitiesCount})
          </Link>
        </div>

        {/* Search Input Box */}
        <form className="relative flex items-center min-w-[260px] sm:w-80">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by community name…"
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

      {/* Compass Table Component */}
      <CompassTable
        communities={communities as any}
        currentSort={sort}
        currentDir={dir}
        searchParams={searchParamsObj}
      />
    </div>
  );
}
