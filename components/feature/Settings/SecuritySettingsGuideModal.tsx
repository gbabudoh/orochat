'use client';

import Modal from '@/components/ui/Modal';
import {
  KeyRound,
  ShieldCheck,
  Eye,
  Lock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: KeyRound,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Change Account Password',
    description:
      'Update your login password regularly to protect your profile and workspace data.',
    tips: [
      'Requires entering your current password for security verification.',
      'Passwords are encrypted using bcrypt hashing.',
    ],
  },
  {
    icon: ShieldCheck,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    title: '2. Password Strength Requirements',
    description:
      'Strong passwords ensure maximum protection against unauthorized access.',
    tips: [
      'Must be at least 8 characters long.',
      'Use a mix of uppercase letters, lowercase letters, numbers, and symbols.',
    ],
  },
  {
    icon: Eye,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Password Visibility Toggles',
    description:
      'Click the eye icon next to any password input field to toggle text visibility.',
    tips: [
      'Allows verifying complex password entries before submitting.',
      'Toggle back to hidden view when entering passwords in public.',
    ],
  },
  {
    icon: Lock,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Account Protection & Session Safety',
    description:
      'Keep your account credentials secure and avoid reusing passwords across websites.',
    tips: [
      'Never share your password with anyone.',
      'Sign out of shared or public browsers after completing your session.',
    ],
  },
];

export default function SecuritySettingsGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Settings Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Security Settings</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to change your password, meet strength requirements, toggle field visibility, and secure your account.
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
