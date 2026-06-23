import Link from 'next/link';
import { AdminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import CreatePoolForm from '@/components/admin/CreatePoolForm';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default async function AdminRevenuePage() {
  const pools = await AdminService.getAllRevenuePools();

  const totalGross = pools.reduce((sum, pool) => sum + (pool.grossAmount ?? 0), 0);
  const totalOroPool = pools.reduce((sum, pool) => sum + pool.totalAmount, 0);
  const totalPlatformCut = pools.reduce((sum, pool) => sum + (pool.platformCutAmount ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Revenue Pools</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Gross Revenue</p>
          <p className="text-2xl font-bold text-[#333333]">${totalGross.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Oro Pool</p>
          <p className="text-2xl font-bold text-[#333333]">${totalOroPool.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Platform Cut</p>
          <p className="text-2xl font-bold text-[#333333]">${totalPlatformCut.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="max-w-lg mb-6">
        <h2 className="font-semibold text-[#333333] mb-3">Create Pool</h2>
        <CreatePoolForm />
      </Card>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Oro Pool</th>
              <th className="px-4 py-3 font-medium">Platform Cut</th>
              <th className="px-4 py-3 font-medium">Distributed</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pools.map((pool) => (
              <tr key={pool.id}>
                <td className="px-4 py-3">{MONTH_NAMES[pool.month - 1]} {pool.year}</td>
                <td className="px-4 py-3">{pool.grossAmount != null ? `$${pool.grossAmount.toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3">${pool.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3">{pool.platformCutAmount != null ? `$${pool.platformCutAmount.toFixed(2)}` : '—'}</td>
                <td className="px-4 py-3">{pool.distributed ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/revenue/${pool.id}`} className="text-[#458B9E] hover:underline text-xs font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pools.length === 0 && <p className="text-center text-gray-500 py-12">No revenue pools yet</p>}
      </Card>
    </div>
  );
}
