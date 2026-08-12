'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Kanban, MessageSquare, Users2, Wallet } from 'lucide-react';
import Button from '@/components/ui/Button';
import OrganizationCard from '@/components/feature/Oroslate/OrganizationCard';
import NewOrganizationModal from '@/components/feature/Oroslate/NewOrganizationModal';
import OroslateHeaderGuide from '@/components/feature/Oroslate/OroslateHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';
import type { getOrganizationsForUser } from '@/features/oroslate/actions';

interface OrganizationListProps {
  currentUserId: string;
  organizations: Awaited<ReturnType<typeof getOrganizationsForUser>>;
  referralRef?: string;
}

export default function OrganizationList({ currentUserId, organizations, referralRef }: OrganizationListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shadow-2xs">
              <Building2 className="w-5 h-5 text-[#458B9E]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Oroslate</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Turn your Orochat connections into paid team workspaces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-center">
          <OroslateHeaderGuide />
          <Link
            href="/oroslate/affiliate"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#458B9E] bg-white hover:bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
          >
            <Wallet className="w-3.5 h-3.5 text-[#458B9E]" />
            <span>Leader Portal</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
          >
            <Building2 className="w-4 h-4 text-white/90 shrink-0" />
            <span>New Organisation</span>
          </button>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 w-full max-w-full sm:max-w-2xl mx-auto px-4 py-8 sm:p-10 lg:p-12 text-center my-1">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#458B9E]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Bring your team into Orochat
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed font-medium">
            Oroslate combines project boards, real-time chat, and your verified Oro network into one paid
            workspace — with a 14-day free Pro trial, no card required.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full sm:max-w-lg mx-auto mb-8 text-left">
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0">
                <Kanban className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Project Boards</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">Team Chat</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0">
                <Users2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800">External Oros</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Building2 className="w-4 h-4 text-white/90 shrink-0" />
              <span>Create Your First Organisation</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
          ))}
        </div>
      )}

      <NewOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={currentUserId}
        referralRef={referralRef}
      />
    </div>
  );
}

