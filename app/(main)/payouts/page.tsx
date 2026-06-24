import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { AdminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Settings } from 'lucide-react';

export default async function PayoutsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, distributions] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { stripeConnectAccountId: true, stripeConnectOnboarded: true },
    }),
    AdminService.getUserDistributions(userId),
  ]);

  const isConnected = !!user?.stripeConnectAccountId;
  const isActive = !!user?.stripeConnectOnboarded;

  const totalEarned = distributions
    .filter((dist) => dist.payoutStatus === 'PAID')
    .reduce((sum, dist) => sum + dist.amount, 0);
  const pendingAmount = distributions
    .filter((dist) => dist.payoutStatus === 'PENDING' || dist.payoutStatus === 'NOT_CONNECTED')
    .reduce((sum, dist) => sum + dist.amount, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Payouts</h1>

      <Card padding="lg" className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Total Earned</p>
        <p className="text-3xl font-bold text-[#333333]">${totalEarned.toFixed(2)}</p>
        {pendingAmount > 0 && (
          <p className="text-sm text-gray-500 mt-1">${pendingAmount.toFixed(2)} pending payout</p>
        )}
      </Card>

      {!isActive && (
        <Card padding="lg" className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-amber-700 font-medium">
              {isConnected
                ? 'Finish setting up your payout account to receive future payouts.'
                : 'Connect a payout account to receive your share of ad revenue.'}
            </p>
            <Link href="/settings/payouts">
              <Button type="button" variant="secondary" size="sm">
                <Settings className="w-4 h-4 mr-1.5" />
                Set up payment
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {distributions.map((dist) => (
              <tr key={dist.id}>
                <td className="px-4 py-3 text-[#333333]">
                  {dist.pool.month}/{dist.pool.year}
                </td>
                <td className="px-4 py-3 text-[#333333]">${dist.amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {dist.payoutStatus === 'PAID' && <span className="text-green-600 font-medium">Paid</span>}
                  {dist.payoutStatus === 'FAILED' && (
                    <span className="text-red-600 font-medium" title={dist.payoutFailureReason ?? ''}>
                      Failed
                    </span>
                  )}
                  {dist.payoutStatus === 'NOT_CONNECTED' && <span className="text-amber-600 font-medium">Not connected</span>}
                  {dist.payoutStatus === 'PENDING' && <span className="text-gray-400">Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {distributions.length === 0 && <p className="text-center text-gray-500 py-12">No payout history yet</p>}
      </Card>
    </div>
  );
}
