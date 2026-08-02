import { db } from '@/lib/db';
import AuditLogTable from '@/components/admin/AuditLogTable';
import Pagination from '@/components/admin/Pagination';
import { parsePage } from '@/lib/admin/pagination';
import Link from 'next/link';
import { ScrollText, Clock, Users, Shield, Search, X } from 'lucide-react';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 25;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q, category, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  // Construct filtering condition
  const whereConditions: Prisma.AdminAuditLogWhereInput[] = [];

  if (q?.trim()) {
    whereConditions.push({
      OR: [
        { action: { contains: q.trim(), mode: 'insensitive' } },
        { targetType: { contains: q.trim(), mode: 'insensitive' } },
        { targetId: { contains: q.trim(), mode: 'insensitive' } },
        { admin: { name: { contains: q.trim(), mode: 'insensitive' } } },
        { admin: { email: { contains: q.trim(), mode: 'insensitive' } } },
      ],
    });
  }

  if (category === 'user') {
    whereConditions.push({ action: { startsWith: 'user.' } });
  } else if (category === 'campaign') {
    whereConditions.push({ action: { startsWith: 'campaign.' } });
  }

  const where: Prisma.AdminAuditLogWhereInput | undefined =
    whereConditions.length > 0 ? { AND: whereConditions } : undefined;

  // Start of today for "Actions Today" metric
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Run audit queries in parallel
  const [
    logs,
    totalFilteredCount,
    totalLogsCount,
    actionsTodayCount,
    uniqueAdminsGroup,
    latestLog,
  ] = await Promise.all([
    db.adminAuditLog.findMany({
      where,
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.adminAuditLog.count({ where }),
    db.adminAuditLog.count(),
    db.adminAuditLog.count({ where: { createdAt: { gte: startOfToday } } }),
    db.adminAuditLog.groupBy({ by: ['adminId'] }),
    db.adminAuditLog.findFirst({ orderBy: { createdAt: 'desc' } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / PAGE_SIZE));
  const searchParamsObj = { q, category, page: pageParam };

  // Category filter URL builder
  const buildFilterHref = (targetCategory?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (targetCategory) params.set('category', targetCategory);
    return `?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security & Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete immutable record of all administrative actions, campaign operations, and moderation events.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Audit Events</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalLogsCount.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">Logged actions</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <ScrollText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions Today</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{actionsTodayCount.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Since midnight</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Admins</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{uniqueAdminsGroup.length.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1">Operators with activity</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Security</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">Active</h3>
            <p className="text-xs text-gray-400 mt-1">
              {latestLog ? `Latest ${new Date(latestLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No logs'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#458B9E]/10 text-[#458B9E]">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls Bar: Category Filters + Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Link
            href={buildFilterHref(undefined)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !category
                ? 'bg-[#458B9E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Logs ({totalLogsCount})
          </Link>
          <Link
            href={buildFilterHref('user')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              category === 'user'
                ? 'bg-[#458B9E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            User Actions
          </Link>
          <Link
            href={buildFilterHref('campaign')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              category === 'campaign'
                ? 'bg-[#458B9E] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ad Campaigns
          </Link>
        </div>

        {/* Search Input Box */}
        <form className="relative flex items-center min-w-[260px] sm:w-80">
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search action, admin, or target ID…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
          />
          {q && (
            <Link
              href={buildFilterHref(category)}
              className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </Link>
          )}
        </form>
      </div>

      {/* Audit Log Table */}
      <AuditLogTable logs={logs} />

      {/* Pagination Bar */}
      <Pagination page={page} totalPages={totalPages} searchParams={searchParamsObj} />
    </div>
  );
}
