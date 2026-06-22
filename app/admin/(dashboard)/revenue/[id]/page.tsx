import { notFound } from 'next/navigation';
import { AdminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import PoolDistributeButton from '@/components/admin/PoolDistributeButton';
import MarkPaidButton from '@/components/admin/MarkPaidButton';

export default async function AdminRevenuePoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pool = await AdminService.getRevenuePool(id);
  if (!pool) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-2">
        Pool — {pool.month}/{pool.year}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Gross ${pool.grossAmount?.toFixed(2) ?? '—'} · Oro pool ${pool.totalAmount.toFixed(2)} · Platform cut $
        {pool.platformCutAmount?.toFixed(2) ?? '—'}
      </p>

      {!pool.distributed && (
        <div className="mb-6">
          <PoolDistributeButton poolId={pool.id} />
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">TES Share</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pool.distributions.map((dist) => (
              <tr key={dist.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#333333]">{dist.user.name}</p>
                  <p className="text-gray-500 text-xs">{dist.user.email}</p>
                </td>
                <td className="px-4 py-3">{(dist.tesShare * 100).toFixed(2)}%</td>
                <td className="px-4 py-3">${dist.amount.toFixed(2)}</td>
                <td className="px-4 py-3">{dist.paid ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">{!dist.paid && <MarkPaidButton distributionId={dist.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pool.distributions.length === 0 && <p className="text-center text-gray-500 py-12">Not distributed yet</p>}
      </Card>
    </div>
  );
}
