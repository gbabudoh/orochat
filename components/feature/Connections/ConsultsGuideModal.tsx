'use client';

import Modal from '@/components/ui/Modal';
import {
  Video,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Video,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Paid 1-on-1 Video Consultations',
    description:
      'Book 1-on-1 scheduled video consultation sessions with verified Orochat industry experts.',
    tips: [
      'Consultations take place via integrated HD video rooms.',
      'Sessions allow direct technical advice, code reviews, and strategic guidance.',
    ],
  },
  {
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    title: '2. Transparent Session Rates & Topics',
    description:
      'Inspect fixed session rates ($/consultation) and consultation topics prior to booking.',
    tips: [
      'Consultants specify clear topic descriptions and session prices upfront.',
      'Payment is processed securely with instant confirmation.',
    ],
  },
  {
    icon: Calendar,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Booking & Scheduling Flow',
    description:
      'Click "Book Consult" to view available time slots and schedule your video session.',
    tips: [
      'Selecting a consultant opens their profile booking interface.',
      'Receive instant calendar invites and video room links.',
    ],
  },
  {
    icon: Sparkles,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Offer Paid Consultations Yourself',
    description:
      'Enable paid consultations on your profile to share expertise and earn income.',
    tips: [
      'Navigate to Profile Settings -> Consultations to set your topic and session rate.',
      'Your profile will automatically appear in this directory once enabled.',
    ],
  },
];

export default function ConsultsGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Video Consultations Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Video Consultations</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to find experts, inspect session rates, book video calls, and enable paid consultations on your own profile.
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
