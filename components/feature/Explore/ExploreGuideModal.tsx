'use client';

import Modal from '@/components/ui/Modal';
import {
  Search,
  Globe,
  Map,
  Users,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Search,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. AI & Keyword Professional Search',
    description:
      'Search verified professionals by full name, company name, job title, or skill across the entire platform.',
    tips: [
      'Enter any query (e.g. "Software Architect", "Google", "Design Lead").',
      'Search leverages AI semantic matching for accurate results.',
    ],
  },
  {
    icon: Globe,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Country & 22 Category Domain Filters',
    description:
      'Filter discovery listings by country flag or browse by 22 specialized professional categories.',
    tips: [
      'Filter by 240+ countries to locate regional talent.',
      'Select industry category pills (e.g. Data Science & AI, Executive Leadership).',
    ],
  },
  {
    icon: Map,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. List View vs Interactive Map View',
    description:
      'Toggle between standard directory card listings and interactive Leaflet map markers.',
    tips: [
      'Click Map View to see geographic distribution of professionals worldwide.',
      'Click map pin markers to view user details.',
    ],
  },
  {
    icon: Users,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Connecting & Viewing Profiles',
    description:
      'Inspect verified connection counts, Partner badges, and launch direct chats or booking sessions.',
    tips: [
      'Click "View Profile" to view full credentials, experience, and bookable availability.',
      'Send connection invitations directly from the user profile page.',
    ],
  },
];

export default function ExploreGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Explore Discovery Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Explore Professionals</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to search professionals, filter by country or industry domain, toggle map view, and connect with Oros.
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
