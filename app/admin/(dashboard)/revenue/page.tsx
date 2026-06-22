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

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Revenue Pools</h1>

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
