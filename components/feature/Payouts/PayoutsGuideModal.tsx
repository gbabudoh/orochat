'use client';

import Modal from '@/components/ui/Modal';
import {
  Wallet,
  PieChart,
  Video,
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
    icon: PieChart,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: '1. Ad Revenue Share Pool (65%)',
    description:
      '65% of platform advertising revenue is placed into a monthly distribution pool for qualified Partners.',
    tips: [
      'Partner status is unlocked upon reaching 1,000 verified connection Oros.',
      'Revenue distributions are calculated monthly based on activity score.',
    ],
  },
  {
    icon: Video,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    title: '2. Flash Consultations Earnings (70%)',
    description:
      'Earn 70% direct income from paid 1-on-1 video consultation sessions with clients.',
    tips: [
      'Set your custom topic and fixed session rate ($/consult) in Profile Settings.',
      'Earnings are automatically routed to your connected Stripe account.',
    ],
  },
  {
    icon: CreditCard,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: '3. Stripe Connect Setup',
    description:
      'Connect your bank account or debit card securely via Stripe Connect for automated payouts.',
    tips: [
      'Onboarding takes under 2 minutes with Stripe identity verification.',
      'Automated payout transfers occur directly to your bank account.',
    ],
  },
  {
    icon: Wallet,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '4. Payout History & Statements',
    description:
      'Track total processed payouts, pending distribution balances, and historical statements.',
    tips: [
      'View detailed monthly statements breakdown in the Payout Ledger table.',
      'Pending balances automatically clear upon distribution payout dates.',
    ],
  },
];

export default function PayoutsGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Partner Payouts & Revenue Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Partner Payouts</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              This guide details Partner ad revenue pools (65%), consultation income (70%), Stripe Connect setup, and distribution statements.
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
