'use client';

import { useState } from 'react';
import { Copy, Check, Wallet, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { TIER_LIMITS } from '@/lib/oroslate/tiers';
import type { getAffiliateSummary, getLeaderCompasses } from '@/features/oroslate/affiliate-actions';

function formatGBP(cents: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(cents / 100);
}

interface AffiliatePortalProps {
  currentUserId: string;
  compasses: Awaited<ReturnType<typeof getLeaderCompasses>>;
  summary: Awaited<ReturnType<typeof getAffiliateSummary>>;
  baseUrl: string;
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-[#458B9E] text-white hover:bg-[#397484] shadow-2xs transition-all shrink-0 cursor-pointer active:scale-[0.98]"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white/90" />}
      <span>{copied ? 'Copied' : 'Copy referral link'}</span>
    </button>
  );
}

export default function AffiliatePortal({ currentUserId, compasses, summary, baseUrl }: AffiliatePortalProps) {
  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="space-y-4">
        <div>
          <Link
            href="/oroslate"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
            <span>Back to Oroslate</span>
          </Link>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shadow-2xs">
              <Wallet className="w-5 h-5 text-[#458B9E]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Community Leader Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Earn a recurring revenue share when businesses you refer from your Compass communities upgrade to Oroslate.
          </p>
        </div>
      </div>

      {/* Executive Financial Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Maturation</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatGBP(summary.pendingMaturationCents)}
            </p>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-amber-200/60">
              Unlocks after a 30-day hold
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ready for Next Payout</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatGBP(summary.readyForPayoutCents)}
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-emerald-200/60">
              Paid automatically on the 15th
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Paid Out</span>
            <div className="w-8 h-8 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatGBP(summary.totalPaidCents)}
            </p>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1 border border-slate-200/60">
              Lifetime earnings
            </span>
          </div>
        </div>
      </div>

      {/* Your Referral Links */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Your referral links</h2>
        {compasses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              You need to create or moderate a Compass community to generate a referral link.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {compasses.map((compass) => (
              <div
                key={compass.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{compass.name}</span>
                <CopyLinkButton url={`${baseUrl}/oroslate?ref=${compass.id}_${currentUserId}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referred Organisations */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Referred organisations</h2>
        {summary.referredOrganizations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              No organisations referred yet — share a link above to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs bg-white">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.referredOrganizations.map((org) => (
                  <tr key={org.organizationId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{org.organizationName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{TIER_LIMITS[org.tier].label}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{org.seatCount}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{org.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Ledger */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Payout ledger</h2>
        {summary.ledgerEntries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Payout history will appear here once a referred org pays its first invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs bg-white">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{new Date(entry.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{entry.organizationName}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatGBP(entry.amountCents)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{entry.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
