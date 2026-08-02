'use client';

import Modal from '@/components/ui/Modal';
import {
  MessageSquare,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  BookOpen,
  UserPlus,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: MessageSquare,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Direct Private Messaging (1-on-1)',
    description:
      'Message any verified Oro in your network in real-time with end-to-end user privacy.',
    tips: [
      'Click on any connected Oro in "My Oros" or "Explore" to start a chat.',
      'Supports text messages, image links, and consultation links.',
      'Conversations appear chronologically in your thread list.',
    ],
  },
  {
    icon: Users,
    color: 'bg-[#458B9E]/10 text-[#458B9E] border-[#458B9E]/20',
    title: '2. Group Collab Threads',
    description:
      'Create multi-member team conversations to collaborate on projects with multiple Oros simultaneously.',
    tips: [
      'Click "+ New Group" at the top right to start a team chat.',
      'Select members from your verified connections.',
      'Group threads display participant counts and latest sender names.',
    ],
  },
  {
    icon: Clock,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '3. Unread Message Badges',
    description:
      'Track unread conversations instantly with real-time numerical notification badges.',
    tips: [
      'Unread badges display on active threads and sidebar navigation.',
      'Opening a conversation automatically marks all unread messages as read.',
    ],
  },
  {
    icon: Sparkles,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    title: '4. Live Presence Status',
    description:
      'See which participants are currently online and active on the Orochat platform.',
    tips: [
      'Green pulse dots indicate connected users who are online.',
      'Presence updates automatically in real-time as users navigate.',
    ],
  },
];

export default function CollabGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collab Messaging Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Collab Messaging</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to start private 1-on-1 chats, create group team threads, and track online presence with your Oros.
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
