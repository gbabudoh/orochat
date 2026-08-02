'use client';

import Modal from '@/components/ui/Modal';
import {
  Eye,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Eye,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Total Profile Views Tracking',
    description:
      'Monitor the total number of visits logged on your Orochat profile. Analytics are completely private to your account.',
    tips: [
      'Only you can view your profile analytics and visitor activity logs.',
      'Tracks both authenticated Orochat members and public visitors.',
    ],
  },
  {
    icon: Globe,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Geographical Country Demographics',
    description:
      'View a breakdown of your profile traffic categorized by visitor country flags.',
    tips: [
      'Displays percentage distribution and exact view counts per country.',
      'Country flags represent registered user locations or visitor IP locations.',
    ],
  },
  {
    icon: Clock,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Recent Activity Stream',
    description:
      'Timeline of the last 30 logged profile visits with relative timestamps.',
    tips: [
      'Authenticated member visits display full name, title, and avatar.',
      'Clicking a logged member opens their profile to connect or message.',
      'Anonymous guest visits display geographical country tags.',
    ],
  },
  {
    icon: TrendingUp,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Traffic & Network Growth Insights',
    description:
      'Use traffic trends to identify interested professionals and expand your Oro network.',
    tips: [
      'Follow up with recent profile visitors by sending connection requests.',
      'High traffic from specific countries indicates targeted community reach.',
    ],
  },
];

export default function AnalyticsGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Analytics Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Profile Analytics</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to track your profile view count, monitor country traffic demographics, and inspect recent visitor activity.
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
