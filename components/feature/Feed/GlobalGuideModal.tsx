'use client';

import Modal from '@/components/ui/Modal';
import {
  Globe,
  Send,
  SlidersHorizontal,
  Briefcase,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Send,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Share Global Public Updates',
    description:
      'Use the Global Post Composer at the top to publish thoughts, articles, or project updates to all verified Oros worldwide.',
    tips: [
      'Visibility is automatically set to "Public" so everyone can see it.',
      'Supports optional image URL attachments and up to 3,000 characters.',
      'Public posts count towards your platform activity score.',
    ],
  },
  {
    icon: Globe,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Filter Activity by Country',
    description:
      'Browse public posts from Oros in specific countries worldwide using the Filter by Country selector.',
    tips: [
      'Select any country (e.g. 🇳🇬 Nigeria, 🇺🇸 United States, 🇬🇧 United Kingdom).',
      'Country flags reflect the author’s registered professional location.',
    ],
  },
  {
    icon: Briefcase,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Browse 22 Professional Categories',
    description:
      'Filter public discussions by industry domain using AI vector similarity matching.',
    tips: [
      'Click any category pill (e.g. Software Engineering, Data Science & AI, Finance).',
      'AI semantically matches post content to relevant industry categories.',
      'Click "Clear Filters" to return to the full worldwide feed.',
    ],
  },
  {
    icon: Sparkles,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Live Stream & Sponsored Ads',
    description:
      'Engage with posts in real-time and discover featured Partner sponsored content.',
    tips: [
      'Like and comment on public posts to connect directly with authors.',
      'Sponsored ad cards appear periodically in the feed from Orochat Partners.',
      'Scroll down to automatically load more recent global activity.',
    ],
  },
];

export default function GlobalGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Feed Feature Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Global Activity</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to share public updates, filter discussions by country or industry, and engage with verified professionals worldwide.
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
