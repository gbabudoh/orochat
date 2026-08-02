import { db } from '@/lib/db';
import { AdminService } from '@/services/admin.service';
import Link from 'next/link';
import {
  Users,
  Megaphone,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Compass,
  ArrowRight,
  Activity,
  PlusCircle,
  CheckCircle2,
  Database,
  Server,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import UsersGrowthChart from '@/components/admin/UsersGrowthChart';
import RevenueChart from '@/components/admin/RevenueChart';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GROWTH_WINDOW_DAYS = 30;

function buildUsersGrowthData(createdDates: Date[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (GROWTH_WINDOW_DAYS - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < GROWTH_WINDOW_DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  createdDates.forEach((date) => {
    const key = date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  return Array.from(buckets.entries()).map(([key, count]) => ({
    date: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count,
  }));
}

function getInitials(name: string) {
  if (!name) return 'AD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatActionLabel(action: string) {
  switch (action) {
    case 'campaign.create':
      return { label: 'Campaign Created', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'campaign.update':
      return { label: 'Campaign Updated', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'campaign.status_change':
      return { label: 'Status Changed', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'campaign.sponsorship_update':
      return { label: 'Sponsorship Updated', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'compass.suspend':
      return { label: 'Community Suspended', color: 'bg-red-50 text-red-700 border-red-200' };
    case 'compass.reactivate':
      return { label: 'Community Reactivated', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'compass.flag':
      return { label: 'Community Flagged', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'compass.delete':
      return { label: 'Community Deleted', color: 'bg-red-50 text-red-700 border-red-200' };
    case 'user.pause':
      return { label: 'Account Paused', color: 'bg-red-50 text-red-700 border-red-200' };
    case 'user.unpause':
      return { label: 'Account Unpaused', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'user.partner_toggle':
      return { label: 'Partner Status Toggled', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'user.message':
      return { label: 'Notice Sent', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    default:
      return { label: action.replace('.', ' '), color: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
}

export default async function AdminOverviewPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (GROWTH_WINDOW_DAYS - 1));

  // Parallel DB queries
  const [
    totalUsers,
    partnerCount,
    activeCampaignCount,
    currentPool,
    recentUsers,
    pools,
    recentLogs,
    communitiesCount,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isPartner: true } }),
    db.adCampaign.count({ where: { status: 'ACTIVE' } }),
    AdminService.getCurrentRevenuePool(),
    db.user.findMany({ select: { createdAt: true }, where: { createdAt: { gte: start } } }),
    AdminService.getAllRevenuePools(),
    db.adminAuditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true, email: true } } },
    }),
    db.compass.count(),
  ]);

  const usersGrowthData = buildUsersGrowthData(recentUsers.map((u) => u.createdAt));
  const revenueData = [...pools].reverse().map((pool) => ({
    period: `${MONTH_NAMES[pool.month - 1]} ${pool.year}`,
    oroPool: pool.totalAmount,
    platformCut: pool.platformCutAmount ?? 0,
  }));

  const partnerRatio = totalUsers > 0 ? ((partnerCount / totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview Command Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time platform metrics, revenue pools, ad campaign activity, and system health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Link
          href="/admin/users"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md hover:border-[#458B9E]/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-[#458B9E] group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalUsers.toLocaleString()}</h3>
          <p className="text-xs text-gray-400 mt-1 flex items-center justify-between">
            <span>Registered accounts</span>
            <span className="text-[#458B9E] font-medium group-hover:underline flex items-center gap-0.5">
              View directory <ArrowRight className="w-3 h-3" />
            </span>
          </p>
        </Link>

        {/* Partners */}
        <Link
          href="/admin/users?filter=partner"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Orochat Partners</p>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{partnerCount.toLocaleString()}</h3>
          <p className="text-xs text-amber-600 font-medium mt-1">
            {partnerRatio}% partner conversion rate
          </p>
        </Link>

        {/* Active Campaigns */}
        <Link
          href="/admin/ads"
          className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Campaigns</p>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeCampaignCount.toLocaleString()}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Running live sponsored feed ads</span>
          </p>
        </Link>

        {/* Revenue Pool */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Pool</p>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">
            {currentPool ? `$${currentPool.totalAmount.toFixed(2)}` : '$0.00'}
          </h3>
          <p className="text-xs text-purple-600 font-medium mt-1">
            Stripe Connect revenue distribution
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Executive Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/ads/new"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#458B9E] hover:bg-[#3b7889] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Campaign</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 text-xs font-semibold transition-colors"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Users Directory</span>
          </Link>

          <Link
            href="/admin/audit"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Security Audit Logs</span>
          </Link>

          <Link
            href="/admin/compass"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 text-xs font-semibold transition-colors"
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Compass ({communitiesCount})</span>
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">New Users Growth</h3>
              <p className="text-xs text-gray-500">Registration trajectory over the last 30 days</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              30 Days
            </span>
          </div>
          <UsersGrowthChart data={usersGrowthData} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Revenue & Pool Split</h3>
              <p className="text-xs text-gray-500">Monthly ad revenue distributions to Oro Partners</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold">
              Monthly
            </span>
          </div>
          <RevenueChart data={revenueData} />
        </div>
      </div>

      {/* Bottom 2-Column Section: Audit Activity Stream + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Audit Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#458B9E]" />
              <h3 className="font-bold text-gray-900 text-base">Recent Platform Activity</h3>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-[#458B9E] hover:underline flex items-center gap-1"
            >
              View all audit logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentLogs.map((log) => {
              const actionMeta = formatActionLabel(log.action);
              return (
                <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#458B9E]/10 text-[#458B9E] font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials(log.admin.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{log.admin.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionMeta.color}`}
                        >
                          {actionMeta.label}
                        </span>
                      </div>
                      {log.targetType && (
                        <p className="text-gray-500 font-mono text-[11px] truncate mt-0.5">
                          Target: {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 10)}…)` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium shrink-0">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              );
            })}

            {recentLogs.length === 0 && (
              <p className="text-xs text-gray-400 py-6 text-center">No recent audit log entries recorded.</p>
            )}
          </div>
        </div>

        {/* Right Column: Platform System & Infrastructure Health */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">System Infrastructure</h3>
            <p className="text-xs text-gray-500">Platform status and database health</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-800">PostgreSQL DB</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Healthy
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-gray-800">Stripe Express</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-gray-800">MinIO Storage</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-gray-800">Audit & Auth Engine</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Secured
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-gray-400 text-center border-t border-gray-100">
            Orochat Admin Control Suite v2.4.0
          </div>
        </div>
      </div>
    </div>
  );
}
