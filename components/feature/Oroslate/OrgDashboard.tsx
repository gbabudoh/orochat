'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FolderKanban, Plus, Sparkles, Users2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import SlateCard from '@/components/feature/Oroslate/SlateCard';
import NewSlateModal from '@/components/feature/Oroslate/NewSlateModal';
import TrialBanner from '@/components/feature/Oroslate/TrialBanner';
import OrgProfileCard from '@/components/feature/Oroslate/OrgProfileCard';
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
  const isAdmin = organization.members.find((m) => m.user.id === currentUserId)?.role === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-2.5 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Top Navigation Bar */}
      <div>
        <Link
          href="/oroslate"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
          <span>All Organisations</span>
        </Link>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#366f7e] flex items-center justify-center shrink-0 shadow-md shadow-[#458B9E]/20 text-white">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate tracking-tight">
              {organization.name}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                  isTrialing
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs'
                    : 'bg-[#458B9E]/15 text-[#458B9E] border border-[#458B9E]/20 shadow-2xs'
                }`}
              >
                {isTrialing ? 'Pro Trial' : TIER_LIMITS[tier].label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100/90 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                <Users2 className="w-3.5 h-3.5 text-slate-500" />
                {seatCount} seat{seatCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          <Link href={`/oroslate/org/${organization.id}/talent`} className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98] cursor-pointer"
            >
              <Users2 className="w-3.5 h-3.5 text-[#458B9E]" />
              <span>Find Talent</span>
            </button>
          </Link>

          <Link href={`/oroslate/org/${organization.id}/upgrade`} className="w-full sm:w-auto">
            <button
              type="button"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-[0.98] cursor-pointer ${
                isTrialing
                  ? 'bg-amber-400 text-amber-950 hover:bg-amber-500 shadow-xs font-bold'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 shadow-2xs'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTrialing ? 'text-amber-950' : 'text-[#458B9E]'}`} />
              <span>{isTrialing ? 'Upgrade' : 'Manage Billing'}</span>
            </button>
          </Link>

          {slates.length > 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-white/90 shrink-0" />
              <span>New Slate</span>
            </button>
          )}
        </div>
      </div>

      {subscription?.trialEndsAt && isTrialing && (
        <TrialBanner organizationId={organization.id} trialEndsAt={subscription.trialEndsAt} />
      )}

      <div>
        <OrgProfileCard
          organizationId={organization.id}
          slug={organization.slug}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          description={organization.description}
          industry={organization.industry}
          website={organization.website}
        />
      </div>

      {/* Main Content / Empty State */}
      {slates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 w-full max-w-full sm:max-w-2xl mx-auto px-4 py-8 sm:p-10 lg:p-12 text-center my-1">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <FolderKanban className="w-8 h-8 sm:w-10 sm:h-10 text-[#458B9E]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Create your first Slate
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed font-medium">
            A Slate is a dedicated project workspace — task board, notes, and team chat — for this organisation.
          </p>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-white/90 shrink-0" />
              <span>Create Your First Slate</span>
            </button>
          </div>
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

