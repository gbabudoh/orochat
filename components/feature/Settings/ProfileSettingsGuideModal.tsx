'use client';

import Modal from '@/components/ui/Modal';
import {
  User,
  Briefcase,
  Award,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: User,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Profile Photo & Basic Identity',
    description:
      'Upload a professional profile photo (JPG, PNG, GIF under 2MB) and set your full display name.',
    tips: [
      'Profile photos are visible on public feeds, comments, and connection cards.',
      'Full names are verified across the network.',
    ],
  },
  {
    icon: Briefcase,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Professional Identity & Country Flag',
    description:
      'Set your job title, current company, location, unique @handle, and country flag badge.',
    tips: [
      'Handles (@username) appear on public posts in the Global Feed.',
      'Country flag badges display automatically next to your handle.',
    ],
  },
  {
    icon: Award,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Credentials, Work History & Education',
    description:
      'Add certifications, qualifications, detailed work experience, and educational background.',
    tips: [
      'Credentials enhance your professional credibility for consultations.',
      'Add start/end dates and descriptions for past or current roles.',
    ],
  },
  {
    icon: ShieldAlert,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Account Control & Danger Zone',
    description:
      'Manage account visibility by pausing profile activity or permanently deleting your account.',
    tips: [
      'Pausing hides your profile from search without deleting your data.',
      'Reactivate your account anytime by logging back in.',
    ],
  },
];

export default function ProfileSettingsGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Profile Settings</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to update your photo, professional handle, country flag, work history, qualifications, and account settings.
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
