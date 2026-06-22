import { db } from '@/lib/db';
import { AdminService } from '@/services/admin.service';
import { Users, Megaphone, DollarSign } from 'lucide-react';
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

export default async function AdminOverviewPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (GROWTH_WINDOW_DAYS - 1));

  const [totalUsers, partnerCount, activeCampaignCount, currentPool, recentUsers, pools] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isPartner: true } }),
    db.adCampaign.count({ where: { status: 'ACTIVE' } }),
    AdminService.getCurrentRevenuePool(),
    db.user.findMany({ select: { createdAt: true }, where: { createdAt: { gte: start } } }),
    AdminService.getAllRevenuePools(),
  ]);

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users },
    { label: 'Partners (Oros)', value: partnerCount, icon: Users },
    { label: 'Active Campaigns', value: activeCampaignCount, icon: Megaphone },
    {
      label: 'Current Pool',
      value: currentPool ? `$${currentPool.totalAmount.toFixed(2)}` : '—',
      icon: DollarSign,
    },
  ];

  const usersGrowthData = buildUsersGrowthData(recentUsers.map((u) => u.createdAt));
  const revenueData = [...pools].reverse().map((pool) => ({
    period: `${MONTH_NAMES[pool.month - 1]} ${pool.year}`,
    oroPool: pool.totalAmount,
    platformCut: pool.platformCutAmount ?? 0,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{label}</p>
              <Icon className="w-4 h-4 text-[#458B9E]" />
            </div>
            <p className="text-2xl font-bold text-[#333333]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UsersGrowthChart data={usersGrowthData} />
        <RevenueChart data={revenueData} />
      </div>
    </div>
  );
}
