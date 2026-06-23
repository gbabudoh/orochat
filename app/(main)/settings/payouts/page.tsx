import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { AdminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import ConnectPayoutsButton from '@/components/settings/ConnectPayoutsButton';

export default async function PayoutsSettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, distributions] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        stripeConnectDetailsSubmitted: true,
      },
    }),
    AdminService.getUserDistributions(userId),
  ]);

  const isConnected = !!user?.stripeConnectAccountId;
  const isActive = !!user?.stripeConnectOnboarded;
  const isPending = isConnected && !isActive;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Payouts</h1>

      <Card padding="lg" className="mb-6">
        <h2 className="font-semibold text-[#333333] mb-1">Payout Account</h2>
        <p className="text-sm text-gray-500 mb-4">
          Connect a Stripe payout account to receive your share of the monthly ad revenue pool.
        </p>

        {!isConnected && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">Not connected</p>
            <ConnectPayoutsButton label="Connect payout account" />
          </div>
        )}

        {isPending && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-amber-600 font-medium">Setup incomplete — finish onboarding to receive payouts</p>
            <ConnectPayoutsButton label="Finish setup" />
          </div>
        )}

        {isActive && (
          <p className="text-sm text-green-600 font-medium">Connected — ready to receive payouts</p>
        )}
      </Card>

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
