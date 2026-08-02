'use client';

import Modal from '@/components/ui/Modal';
import {
  Building2,
  Kanban,
  Users2,
  Wallet,
  CheckCircle2,
  BookOpen,
  CreditCard,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Building2,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Corporate Organizations & Paid Workspaces',
    description:
      'Oroslate enables businesses to create org-owned paid workspaces with centralized billing and member management.',
    tips: [
      'Click "+ New Organization" to establish a business entity.',
      'Every new organization starts with a 14-day free Pro trial — no card required.',
      'Organization owners have full control over billing and workspace security.',
    ],
  },
  {
    icon: Kanban,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Org Slates (Project Boards & Team Chat)',
    description:
      'Slates are org-owned project hubs uniting Kanban task management, shared notes, and real-time team chat.',
    tips: [
      'Convert 1-on-1 chats into paid org Slates with one click.',
      'Assign task owners, manage project milestones, and maintain centralized assets.',
      'Slates remain preserved and owned by the organization.',
    ],
  },
  {
    icon: Users2,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Seat Allocation & External Collaboration',
    description:
      'Manage team seat licenses and invite both internal employees and external Oro contractors.',
    tips: [
      'Allocate seats to internal team members for full workspace access.',
      'Invite external verified Oros directly into specific Slates as guest collaborators.',
      'Upgrade or downgrade total seat capacity anytime via Stripe Billing.',
    ],
  },
  {
    icon: Wallet,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Community Leader Affiliate Program',
    description:
      'Compass community leaders earn recurring revenue shares when referred businesses upgrade to Oroslate.',
    tips: [
      'Access your referral links via the "Community Leader Portal".',
      'Earn recurring monthly affiliate commissions via Stripe Connect payout rails.',
    ],
  },
];

export default function OroslateGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Oroslate Corporate Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Oroslate Business & Corporate Suite</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide details enterprise organization setup, org-owned project Slates, seat management, and affiliate revenue streams for business leaders.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {GUIDE_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-4 space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${section.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{section.title}</h4>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed pl-1">{section.description}</p>

                <div className="pt-2 border-t border-gray-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-[#458B9E] uppercase tracking-wider block mb-1">
                    Corporate Instructions:
                  </span>
                  <ul className="space-y-1">
                    {section.tips.map((tip, tIdx) => (
                      <li key={tIdx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#458B9E] shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#458B9E] hover:bg-[#387383] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </Modal>
  );
}
