'use client';

import Modal from '@/components/ui/Modal';
import {
  Users,
  Clock,
  Search,
  Video,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Users,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Verified Oros & Partner Status Milestone',
    description:
      'Build your verified professional network by connecting with developers, designers, and creators on Orochat.',
    tips: [
      'Track your progress towards the 1,000 Verified Oros Partner Qualification goal.',
      'Partner status unlocks community creation, verified badges, and revenue features.',
    ],
  },
  {
    icon: Clock,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '2. Pending Connection Invitations',
    description:
      'Review incoming connection requests with custom invitation notes from professionals.',
    tips: [
      'Click Accept to add the Oro to your verified network.',
      'Read custom invitation notes before responding.',
    ],
  },
  {
    icon: Search,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Directory Search & Filter Tabs',
    description:
      'Instantly search connections by name, company, or title and filter by availability.',
    tips: [
      'Filter by "Online Now" to find connections available for messaging.',
      'Filter by "Bookable Consults" to find Oros offering video consult sessions.',
    ],
  },
  {
    icon: Video,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    title: '4. Direct Messaging & Video Consults',
    description:
      'Launch direct 1-on-1 chats or book video consultation sessions with bookable Oros.',
    tips: [
      'Click "Message" to jump directly into a Collab chat thread.',
      'Click "Profile" to view full user credentials and bookable availability.',
    ],
  },
];

export default function OroGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Oros Network Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to My Oros Network</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to build your verified connection network, track Partner milestone progress, filter connections, and book consults.
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
