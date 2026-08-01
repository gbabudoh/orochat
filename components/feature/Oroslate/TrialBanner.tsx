'use client';

import Link from 'next/link';
import { Sparkles, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TrialBannerProps {
  organizationId: string;
  trialEndsAt: Date | string;
}

function daysRemaining(trialEndsAt: Date | string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function TrialBanner({ organizationId, trialEndsAt }: TrialBannerProps) {
  const daysLeft = daysRemaining(trialEndsAt);
  const upgradeHref = `/oroslate/org/${organizationId}/upgrade`;

  if (daysLeft <= 0) {
    return (
      <div className="flex items-center justify-between gap-3 mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">
            Your Pro Slate trial has ended. This workspace is locked until you upgrade.
          </p>
        </div>
        <Link href={upgradeHref} className="shrink-0">
          <Button variant="danger" size="sm">Reactivate Oroslate Pro</Button>
        </Link>
      </div>
    );
  }

  if (daysLeft <= 1) {
    return (
      <div className="flex items-center justify-between gap-3 mb-6 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            1 day left on your Pro Slate trial. Upgrade now to avoid project interruption.
          </p>
        </div>
        <Link href={upgradeHref} className="shrink-0">
          <Button variant="accent" size="sm">Secure My Slate</Button>
        </Link>
      </div>
    );
  }

  if (daysLeft <= 3) {
    return (
      <div className="flex items-center justify-between gap-3 mb-6 p-3.5 rounded-lg bg-[#F0F3F7] border border-[#458B9E]/20">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-[#458B9E] shrink-0" />
          <p className="text-sm text-[#333333]">
            Your Pro Slate trial ends in {daysLeft} day{daysLeft === 1 ? '' : 's'}. Keep your advanced boards and unlimited chat history active.
          </p>
        </div>
        <Link href={upgradeHref} className="shrink-0">
          <Button variant="primary" size="sm">Lock In Pro Tiers</Button>
        </Link>
      </div>
    );
  }

  return null;
}
