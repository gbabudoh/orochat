import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { AdminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Settings, Wallet, Clock, CreditCard, CheckCircle2, AlertCircle, Receipt, Video, PieChart } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1">Payouts</h1>
        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
          Track your partner earnings, pending distributions, and payout history.
        </p>
      </div>

      {/* 3-Column Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Total Earned */}
        <Card padding="none" className="p-4 sm:p-5 border border-gray-200/90 rounded-2xl shadow-sm bg-gradient-to-br from-white via-gray-50/40 to-white">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Earned</span>
            <div className="w-8 h-8 rounded-xl bg-[#458B9E]/10 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-[#458B9E]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">${totalEarned.toFixed(2)}</p>
          <p className="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Processed payouts
          </p>
        </Card>

        {/* Card 2: Pending Distributions */}
        <Card padding="none" className="p-4 sm:p-5 border border-gray-200/90 rounded-2xl shadow-sm bg-gradient-to-br from-white via-amber-50/20 to-white">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Payouts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">${pendingAmount.toFixed(2)}</p>
          <p className="text-xs text-amber-600 font-medium mt-1.5">
            {pendingAmount > 0 ? 'Queued for distribution' : 'No pending balance'}
          </p>
        </Card>

        {/* Card 3: Account Status */}
        <Card padding="none" className="p-4 sm:p-5 border border-gray-200/90 rounded-2xl shadow-sm bg-gradient-to-br from-white via-gray-50/40 to-white">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Status</span>
            <div className="w-8 h-8 rounded-xl bg-[#458B9E]/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-[#458B9E]" />
            </div>
          </div>
          {isActive ? (
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200/80 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Connected & Ready
              </span>
              <p className="text-xs text-gray-500 mt-1">Automated payouts active</p>
            </div>
          ) : (
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 mb-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Action Required
              </span>
              <p className="text-xs text-gray-500 mt-1">Setup Stripe Connect</p>
            </div>
          )}
        </Card>
      </div>

      {!isActive && (
        <Card padding="none" className="p-4 sm:p-5 mb-6 border-2 border-amber-200/80 bg-amber-50/60 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Setup Your Payout Account</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {isConnected
                    ? 'Finish setting up your payout account details to receive your earned funds.'
                    : 'Connect your bank or Stripe payout account to receive your share of ad revenue and consult earnings.'}
                </p>
              </div>
            </div>
            <Link href="/settings/payouts" className="shrink-0">
              <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto rounded-xl">
                <Settings className="w-4 h-4 mr-1.5" />
                Set up payment
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {distributions.length === 0 ? (
        <div className="space-y-6">
          <Card padding="none" className="p-6 sm:p-10 border border-gray-200/90 rounded-2xl text-center bg-white shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-[#458B9E]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">No Payout History Yet</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
              Your distribution statements and paid transactions will appear here once revenue pools are calculated.
            </p>
            <Link href="/settings/payouts">
              <Button variant="secondary" className="rounded-full px-6">
                <Settings className="w-4 h-4 mr-2" />
                Manage Payment Settings
              </Button>
            </Link>
          </Card>

          {/* Revenue Stream Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card padding="none" className="p-4 sm:p-5 border border-gray-200/80 rounded-2xl bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#458B9E]/10 flex items-center justify-center shrink-0">
                  <PieChart className="w-4.5 h-4.5 text-[#458B9E]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Ad Revenue Share (65%)</h4>
                  <p className="text-xs text-gray-500">Partner monthly distribution pool</p>
                </div>
              </div>
            </Card>

            <Card padding="none" className="p-4 sm:p-5 border border-gray-200/80 rounded-2xl bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#458B9E]/10 flex items-center justify-center shrink-0">
                  <Video className="w-4.5 h-4.5 text-[#458B9E]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Flash-Consults (70%)</h4>
                  <p className="text-xs text-gray-500">Instant 1-on-1 video booking earnings</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden rounded-2xl border border-gray-200/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-left text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Period</th>
                  <th className="px-4 py-3.5 font-bold">Amount</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {distributions.map((dist) => (
                  <tr key={dist.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-900">
                      {dist.pool.month}/{dist.pool.year}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#458B9E]">${dist.amount.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      {dist.payoutStatus === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          Paid
                        </span>
                      )}
                      {dist.payoutStatus === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200" title={dist.payoutFailureReason ?? ''}>
                          Failed
                        </span>
                      )}
                      {dist.payoutStatus === 'NOT_CONNECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Not connected
                        </span>
                      )}
                      {dist.payoutStatus === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

