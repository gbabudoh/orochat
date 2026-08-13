'use client';

import Modal from '@/components/ui/Modal';
import { Mail, Search, ShieldAlert, Users, CheckCircle2, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    icon: Search,
    color: 'bg-[#458B9E]/10 text-[#458B9E] border-[#458B9E]/20',
    title: '1. Finding someone to note',
    description: 'Search Explore for an Oro by name or @handle, then open their full profile.',
    tips: [
      'You do not need to be connected to send a Direct Note.',
      'Look for "Send Direct Note" in the profile\'s action bar.',
    ],
  },
  {
    icon: Mail,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    title: '2. Sending and replying',
    description: 'A Direct Note is a short message, not a full chat — one thread per person.',
    tips: [
      'Sending a second note to the same person reopens your existing thread.',
      'Replies land here in DN, never in Collab.',
    ],
  },
  {
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    title: '3. Connecting unlocks the rest',
    description: 'Direct Note stays separate — permanently. It never grants access to Collab, Compass, Nest, or Oroslate.',
    tips: [
      'To message freely, video call, or collaborate, send a Connection request instead.',
      'Once connected, use Collab — DN is only for that first, pre-connection note.',
    ],
  },
  {
    icon: ShieldAlert,
    color: 'bg-red-50 text-red-600 border-red-200',
    title: '4. Staying safe',
    description: 'Every Direct Note thread has Block and Report controls.',
    tips: [
      'Blocking someone stops them from messaging or connection-requesting you again.',
      'Report anything that feels like spam or harassment.',
    ],
  },
];

export default function DNGuideModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Direct Notes Guide">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-[#458B9E]/10 border border-[#458B9E]/20 rounded-2xl p-4 text-xs text-gray-800">
          <BookOpen className="w-5 h-5 text-[#458B9E] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Welcome to Direct Notes</h4>
            <p className="mt-0.5 text-gray-600 leading-relaxed">
              A small, bounded way to reach someone you haven&apos;t connected with yet.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {GUIDE_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-4 space-y-2.5">
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
