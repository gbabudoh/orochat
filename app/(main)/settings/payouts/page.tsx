import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import ConnectPayoutsButton from '@/components/settings/ConnectPayoutsButton';
import PayoutSettingsHeaderGuide from '@/components/feature/Settings/PayoutSettingsHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { CheckCircle2, Clock, ArrowUpRight, Video, TrendingUp, ShieldCheck, CreditCard } from 'lucide-react';

export default async function PayoutsSettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeConnectAccountId: true, stripeConnectOnboarded: true },
  });

  const isConnected = !!user?.stripeConnectAccountId;
  const isActive = !!user?.stripeConnectOnboarded;
  const isPending = isConnected && !isActive;

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">Payment Setup</h1>
            <HelpTooltip
              title="Payment Setup Guide"
              description="Connect a Stripe payout account to receive partner ad revenue share (65%) and video consult earnings (70%)."
              tips={[
                'Click Connect Payout Account to start Stripe onboarding.',
                'Linked bank accounts or debit cards receive direct deposits.',
                'Visit Payouts Dashboard to view transaction ledger statements.',
              ]}
            />
          </div>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
            Connect a Stripe payout account to receive your share of the monthly ad revenue pool and Flash-Consult bookings. Looking for your earnings? Visit the{' '}
            <Link href="/payouts" className="text-[#458B9E] hover:underline font-semibold inline-flex items-center gap-0.5">
              <span>Payouts Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            .
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <PayoutSettingsHeaderGuide />
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Status Card */}
        <Card padding="none" className="p-4 sm:p-6 shadow-md border-t-4 border-[#458B9E]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center shrink-0 shadow-md">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Payout Account</h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Bank or debit card account where payouts are transferred.
                </p>
              </div>
            </div>

            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs sm:text-sm font-semibold rounded-full shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Connected & Ready</span>
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs sm:text-sm font-semibold rounded-full shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Setup Incomplete</span>
              </span>
            )}
            {!isConnected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs sm:text-sm font-semibold rounded-full shrink-0">
                <span>Not Connected</span>
              </span>
            )}
          </div>

          {!isConnected && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-sm text-gray-600">Connect your account via Stripe to accept payments and receive automated payouts.</p>
              <ConnectPayoutsButton label="Connect payout account" />
            </div>
          )}

          {isPending && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-sm text-amber-600 font-medium">Your setup is incomplete. Finish Stripe onboarding to start accepting payments.</p>
              <ConnectPayoutsButton label="Finish setup" />
            </div>
          )}

          {isActive && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span>Payout account active via Stripe Connect</span>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/payouts" className="text-xs sm:text-sm text-[#458B9E] font-semibold hover:underline">
                  View Earnings
                </Link>
                <ConnectPayoutsButton label="Update Payout Account" />
              </div>
            </div>
          )}
        </Card>

        {/* Payout Stream Highlights */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card padding="none" className="p-4 sm:p-5 border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[#458B9E]/10 flex items-center justify-center text-[#458B9E]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Ad Revenue Share</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
              Verified Partners receive a 65% monthly ad revenue distribution based on Total Engagement Score (TES).
            </p>
            <span className="text-xs font-semibold text-[#458B9E]">65% Partner Cut</span>
          </Card>

          <Card padding="none" className="p-4 sm:p-5 border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[#458B9E]/10 flex items-center justify-center text-[#458B9E]">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Flash-Consult Bookings</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
              Earn 70% on all 1:1 video consultation bookings scheduled directly on your profile.
            </p>
            <span className="text-xs font-semibold text-[#458B9E]">70% Instant Payout Split</span>
          </Card>
        </div>
      </div>
    </div>
  );
}

