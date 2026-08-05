'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { TIER_LIMITS, estimateMonthlyCents } from '@/lib/oroslate/tiers';
import { startOroslateCheckout, openOroslateBillingPortal } from '@/features/oroslate/billing-actions';
import type { SlateTier } from '@prisma/client';

function formatGBP(cents: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

interface UpgradePlansProps {
  organizationId: string;
  currentUserId: string;
  currentTier: SlateTier;
  currentStatus: string;
  currentSeatCount: number;
}

const SELF_SERVE_TIERS: Exclude<SlateTier, 'ENTERPRISE'>[] = ['STARTER', 'PRO'];

export default function UpgradePlans({
  organizationId,
  currentUserId,
  currentTier,
  currentStatus,
  currentSeatCount,
}: UpgradePlansProps) {
  const [annual, setAnnual] = useState(false);
  const [seatCount, setSeatCount] = useState(Math.max(1, currentSeatCount));
  const [loadingTier, setLoadingTier] = useState<SlateTier | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [error, setError] = useState('');

  const hasPaidSubscription = currentStatus === 'ACTIVE' || currentStatus === 'PAST_DUE';

  const handleChoose = async (tier: Exclude<SlateTier, 'ENTERPRISE'>) => {
    setError('');
    setLoadingTier(tier);
    try {
      const result = await startOroslateCheckout(organizationId, currentUserId, tier, seatCount, annual);
      if ('url' in result && result.url) {
        window.location.href = result.url;
      } else {
        setError('error' in result ? result.error : 'Failed to start checkout');
      }
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageBilling = async () => {
    setError('');
    setIsPortalLoading(true);
    try {
      const result = await openOroslateBillingPortal(organizationId, currentUserId);
      if ('url' in result && result.url) {
        window.location.href = result.url;
      } else {
        setError('error' in result ? result.error : 'Failed to open billing portal');
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-2">Choose your Oroslate plan</h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          A dedicated workspace, real-time team chat, and project boards — priced per organisation plus seats.
        </p>

        {hasPaidSubscription && (
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={handleManageBilling} isLoading={isPortalLoading}>
              Manage Billing
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${!annual ? 'text-[#333333]' : 'text-gray-400'}`}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-[#458B9E]' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                annual ? 'translate-x-5' : ''
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-[#333333]' : 'text-gray-400'}`}>
            Annual <span className="text-[#458B9E] font-semibold">(save 20%)</span>
          </span>
        </div>

        <div className="mt-4 inline-flex items-center gap-2">
          <label htmlFor="seatCount" className="text-sm text-gray-600">Team seats:</label>
          <input
            id="seatCount"
            type="number"
            min={1}
            value={seatCount}
            onChange={(e) => setSeatCount(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 px-2 py-1 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-center text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {SELF_SERVE_TIERS.map((tier) => {
          const limits = TIER_LIMITS[tier];
          const monthlyCents = estimateMonthlyCents(tier, seatCount) ?? 0;
          const displayCents = annual ? Math.round((monthlyCents * 12 * 0.8) / 12) : monthlyCents;
          const isCurrent = currentTier === tier && hasPaidSubscription;
          const isPro = tier === 'PRO';

          return (
            <Card key={tier} className={isPro ? 'ring-2 ring-[#458B9E] relative' : 'relative'}>
              {isPro && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFC93C] text-[#333333] text-xs font-bold px-3 py-1 rounded-full shadow">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                {isPro && <Sparkles className="w-4 h-4 text-[#458B9E]" />}
                <h3 className="text-lg font-bold text-[#333333]">{limits.label}</h3>
              </div>
              <p className="text-3xl font-bold text-[#333333] mb-1">
                {formatGBP(displayCents)}<span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {formatGBP(limits.baseFeeCents!)} base + {formatGBP(limits.seatFeeCents!)}/seat, {seatCount} seat{seatCount === 1 ? '' : 's'}
                {annual ? ' — billed annually' : ''}
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#458B9E] shrink-0" />
                  {limits.maxBoards === Infinity ? 'Unlimited' : `Up to ${limits.maxBoards}`} project boards
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#458B9E] shrink-0" />
                  {limits.historyDays === Infinity ? 'Unlimited' : `${limits.historyDays}-day`} chat history
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#458B9E] shrink-0" />
                  {limits.freeExternalOrosPerSeat === Infinity
                    ? 'Unlimited'
                    : limits.freeExternalOrosPerSeat === 0
                      ? 'No'
                      : `${limits.freeExternalOrosPerSeat} free`}{' '}
                  external Oro seats per seat
                </li>
              </ul>
              <Button
                className="w-full"
                variant={isPro ? 'primary' : 'secondary'}
                disabled={isCurrent}
                isLoading={loadingTier === tier}
                onClick={() => handleChoose(tier)}
              >
                {isCurrent ? 'Current Plan' : `Choose ${limits.label}`}
              </Button>
            </Card>
          );
        })}

        <Card>
          <h3 className="text-lg font-bold text-[#333333] mb-2">{TIER_LIMITS.ENTERPRISE.label}</h3>
          <p className="text-3xl font-bold text-[#333333] mb-1">Custom</p>
          <p className="text-xs text-gray-500 mb-4">Volume seat pricing, SSO, and dedicated support</p>
          <ul className="space-y-2 text-sm text-gray-600 mb-6">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#458B9E] shrink-0" />
              Everything in Pro Slate
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#458B9E] shrink-0" />
              Single Sign-On (SSO) & compliance controls
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#458B9E] shrink-0" />
              Unlimited external Oro collaborators
            </li>
          </ul>
          <a href="mailto:sales@orochat.com?subject=Oroslate%20Enterprise">
            <Button className="w-full" variant="secondary">Contact Sales</Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
