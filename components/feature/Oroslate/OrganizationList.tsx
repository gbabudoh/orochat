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
    <div>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Oroslate</h1>
            <HelpTooltip
              title="Oroslate Corporate Suite Guide"
              description="Enterprise organisation management, paid team Slates, and affiliate earnings."
              tips={[
                'Click New Organisation to establish a corporate workspace with a 14-day Pro trial.',
                'Convert chat threads into org-owned project Slates with Kanban boards.',
                'Manage team seat licenses and external Oro collaborators.',
              ]}
            />
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Turn your Orochat connections into paid team workspaces
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 sm:self-center">
          <OroslateHeaderGuide />
          <Link
            href="/oroslate/affiliate"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-[#458B9E] bg-gray-100/80 hover:bg-gray-100 rounded-lg ring-1 ring-gray-200/70 transition-all"
          >
            <Wallet className="w-3.5 h-3.5 text-[#458B9E]" />
            Community Leader Portal
          </Link>
          <Button onClick={() => setIsModalOpen(true)}>
            <Building2 className="w-4 h-4 mr-1.5" />
            New Organisation
          </Button>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl shadow-sm border border-gray-200/90 p-8 sm:p-12 text-center max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#366f7e] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#458B9E]/20 ring-8 ring-[#458B9E]/10">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2.5">Bring your team into Orochat</h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
            Oroslate combines project boards, real-time chat, and your verified Oro network into one paid
            workspace — with a 14-day free Pro trial, no card required.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-8 text-left">
            <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-2.5">
              <Kanban className="w-4 h-4 text-[#458B9E] shrink-0" />
              <span className="text-xs font-semibold text-gray-700">Project Boards</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-[#458B9E] shrink-0" />
              <span className="text-xs font-semibold text-gray-700">Team Chat</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center gap-2.5">
              <Users2 className="w-4 h-4 text-[#458B9E] shrink-0" />
              <span className="text-xs font-semibold text-gray-700">External Oros</span>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="lg" onClick={() => setIsModalOpen(true)}>
              <Building2 className="w-4 h-4 mr-1.5" />
              <span className="sm:hidden">Create Organisation</span>
              <span className="hidden sm:inline">Create Your First Organisation</span>
            </Button>
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

