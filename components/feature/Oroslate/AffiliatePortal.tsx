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
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#458B9E]/10 text-[#458B9E] hover:bg-[#458B9E]/20 transition-colors shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy referral link'}
    </button>
  );
}

export default function AffiliatePortal({ currentUserId, compasses, summary, baseUrl }: AffiliatePortalProps) {
  return (
    <div className="space-y-6">
      {/* Top Back Action */}
      <div>
        <Link
          href="/oroslate"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#458B9E] transition-colors bg-white hover:bg-gray-50 border border-gray-200/80 px-3.5 py-1.5 rounded-xl shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
          <span>Back to Oroslate</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1">Community Leader Portal</h1>
        <p className="text-sm text-gray-500">
          Earn a recurring revenue share when businesses you refer from your Compass communities upgrade to Oroslate.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card padding="sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
            <Clock className="w-3.5 h-3.5" />
            Pending Maturation
          </div>
          <p className="text-2xl font-bold text-[#333333]">{formatGBP(summary.pendingMaturationCents)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Unlocks after a 30-day hold</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
            <Wallet className="w-3.5 h-3.5" />
            Ready for Next Payout
          </div>
          <p className="text-2xl font-bold text-[#333333]">{formatGBP(summary.readyForPayoutCents)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Paid automatically on the 15th</p>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Total Paid Out
          </div>
          <p className="text-2xl font-bold text-[#333333]">{formatGBP(summary.totalPaidCents)}</p>
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-[#333333] mb-3">Your referral links</h2>
      {compasses.length === 0 ? (
        <Card padding="sm" className="mb-8">
          <p className="text-sm text-gray-500">
            You need to create or moderate a Compass community to generate a referral link.
          </p>
        </Card>
      ) : (
        <div className="space-y-2 mb-8">
          {compasses.map((compass) => (
            <Card key={compass.id} padding="sm" className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#333333] truncate">{compass.name}</span>
              <CopyLinkButton url={`${baseUrl}/oroslate?ref=${compass.id}_${currentUserId}`} />
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold text-[#333333] mb-3">Referred organisations</h2>
      {summary.referredOrganizations.length === 0 ? (
        <Card padding="sm" className="mb-8">
          <p className="text-sm text-gray-500">No organisations referred yet — share a link above to get started.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto mb-8 rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-[#F0F3F7] text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2.5">Organisation</th>
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Seats</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {summary.referredOrganizations.map((org) => (
                <tr key={org.organizationId}>
                  <td className="px-4 py-2.5 font-medium text-[#333333]">{org.organizationName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{TIER_LIMITS[org.tier].label}</td>
                  <td className="px-4 py-2.5 text-gray-600">{org.seatCount}</td>
                  <td className="px-4 py-2.5 text-gray-600">{org.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold text-[#333333] mb-3">Payout ledger</h2>
      {summary.ledgerEntries.length === 0 ? (
        <Card padding="sm">
          <p className="text-sm text-gray-500">Payout history will appear here once a referred org pays its first invoice.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-[#F0F3F7] text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Organisation</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {summary.ledgerEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 text-gray-600">{new Date(entry.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2.5 text-gray-600">{entry.organizationName}</td>
                  <td className="px-4 py-2.5 font-medium text-[#333333]">{formatGBP(entry.amountCents)}</td>
                  <td className="px-4 py-2.5 text-gray-600">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
