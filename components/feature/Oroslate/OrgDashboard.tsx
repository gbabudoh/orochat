'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FolderKanban, Plus, Sparkles, Users2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import SlateCard from '@/components/feature/Oroslate/SlateCard';
import NewSlateModal from '@/components/feature/Oroslate/NewSlateModal';
import TrialBanner from '@/components/feature/Oroslate/TrialBanner';
import { TIER_LIMITS } from '@/lib/oroslate/tiers';
import type { getOrganization, getSlatesForOrganization } from '@/features/oroslate/actions';

type OrgResult = Awaited<ReturnType<typeof getOrganization>>;
type SlateListItem = Awaited<ReturnType<typeof getSlatesForOrganization>>[number];

interface OrgDashboardProps {
  currentUserId: string;
  organization: NonNullable<OrgResult['organization']>;
  slates: SlateListItem[];
}

export default function OrgDashboard({ currentUserId, organization, slates }: OrgDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const subscription = organization.subscription;
  const tier = subscription?.tier ?? 'STARTER';
  const isTrialing = subscription?.status === 'TRIALING';
  const seatCount = organization.members.filter((m) => !m.isExternalOro).length;

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-5 sm:py-8">
      {/* Navigation Back Link */}
      <Link
        href="/oroslate"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#458B9E] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        All Organizations
      </Link>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#458B9E] to-[#5ba3b7] flex items-center justify-center shrink-0 shadow-md shadow-[#458B9E]/15">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate tracking-tight">{organization.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
                  isTrialing
                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20'
                    : 'bg-[#458B9E]/10 text-[#337282] ring-1 ring-[#458B9E]/20'
                }`}
              >
                {isTrialing ? 'Pro Trial' : TIER_LIMITS[tier].label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100/80 px-2.5 py-0.5 rounded-full ring-1 ring-gray-200/60">
                <Users2 className="w-3.5 h-3.5 text-gray-500" />
                {seatCount} seat{seatCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <Link href={`/oroslate/org/${organization.id}/upgrade`}>
            <Button variant={isTrialing ? 'accent' : 'secondary'} size="sm">
              <Sparkles className={`w-4 h-4 mr-1.5 ${isTrialing ? '' : 'text-[#458B9E]'}`} />
              {isTrialing ? 'Upgrade' : 'Manage Billing'}
            </Button>
          </Link>
          {/* Only display header CTA when slates exist to prevent CTA duplication on empty state */}
          {slates.length > 0 && (
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Slate
            </Button>
          )}
        </div>
      </div>

      {subscription?.trialEndsAt && isTrialing && (
        <TrialBanner organizationId={organization.id} trialEndsAt={subscription.trialEndsAt} />
      )}

      {/* Main Content / Empty State */}
      {slates.length === 0 ? (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200/80 shadow-sm p-8 sm:p-12 text-center max-w-xl mx-auto my-8 transition-all hover:shadow-md">
          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#458B9E]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Central Empty State Visual */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#366f7e] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#458B9E]/20 ring-8 ring-[#458B9E]/10">
            <FolderKanban className="w-8 h-8 text-white stroke-[1.75]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2.5">Create your first Slate</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
            A Slate is a dedicated project workspace — task board, notes, and team chat — for this organization.
          </p>

          <Button size="lg" onClick={() => setIsModalOpen(true)} className="shadow-md shadow-[#458B9E]/20">
            <Plus className="w-5 h-5 mr-1.5" />
            New Slate
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {slates.map((slate) => (
            <SlateCard key={slate.id} slate={slate} />
          ))}
        </div>
      )}

      <NewSlateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={currentUserId}
        organizationId={organization.id}
      />
    </div>
  );
}

