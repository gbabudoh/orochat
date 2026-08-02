'use client';

import Modal from '@/components/ui/Modal';
import {
  Compass,
  Users,
  Sparkles,
  Wallet,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Compass,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Discover & Join Communities',
    description:
      'Compass provides specialized technical circles, interest groups, and industry forums for verified professionals.',
    tips: [
      'Browse all open communities and click "Join" to become a member.',
      'Members get access to dedicated community feeds and member rosters.',
    ],
  },
  {
    icon: Users,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Community Feed & Discussions',
    description:
      'Post targeted updates, ask technical questions, and engage with community members.',
    tips: [
      'Posts published within a Compass are visible on the community feed.',
      'Community admins can pin important announcements and flag policy violations.',
    ],
  },
  {
    icon: Sparkles,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Partner Community Creation',
    description:
      'Verified Partner status holders can create and launch new Compass communities.',
    tips: [
      'Reach 1,000 verified connection Oros to unlock Partner status.',
      'Set custom community names, slugs, descriptions, and cover photos.',
    ],
  },
  {
    icon: Wallet,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Community Leadership & Affiliate Revenue',
    description:
      'Community leaders earn recurring revenue shares when members upgrade to Oroslate paid workspaces.',
    tips: [
      'Generate referral links via the Community Leader Portal.',
      'Earn recurring monthly affiliate commissions paid automatically on the 15th.',
    ],
  },
];

export default function CompassGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compass Communities Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Compass Communities</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to discover professional communities, post in community feeds, launch new circles as a Partner, and earn affiliate revenue.
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
                    Key Instructions:
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
