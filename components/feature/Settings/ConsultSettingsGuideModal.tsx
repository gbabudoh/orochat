'use client';

import Modal from '@/components/ui/Modal';
import {
  Video,
  DollarSign,
  Calendar,
  CreditCard,
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
    title: '1. Offer Paid Video Consultations (70% Cut)',
    description:
      'Host 1-on-1 scheduled video call consultations on your profile with automatic 70% revenue payouts.',
    tips: [
      '70% of session fee is deposited directly to your connected bank account.',
      'Sessions run in integrated HD video call rooms with calendar reminders.',
    ],
  },
  {
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    title: '2. Pricing, Topic & Deliverables',
    description:
      'Set your fixed session price ($/consult), topic title, detailed description, and key outcomes.',
    tips: [
      'Be clear about your area of expertise and what clients will achieve.',
      'Specify clear consultation outcomes (e.g., Code Review, Strategy Audit).',
    ],
  },
  {
    icon: Calendar,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Durations & Available Times',
    description:
      'Select supported session lengths (15m, 30m, 60m) and create availability time slots.',
    tips: [
      'Clients can only book time slots you explicitly make available.',
      'Set slot capacity for 1-on-1 or small group consultations.',
    ],
  },
  {
    icon: CreditCard,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Stripe Payout Requirements',
    description:
      'Ensure your payout account is connected before accepting paid consult bookings.',
    tips: [
      'Visit Payment Setup (/settings/payouts) to connect Stripe if not already active.',
      'Funds clear instantly upon customer payment completion.',
    ],
  },
];

export default function ConsultSettingsGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Flash-Consult Settings Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Flash-Consult Settings</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide explains how to enable paid consults on your profile, set rates (70% cut), manage topics, and configure available time slots.
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
