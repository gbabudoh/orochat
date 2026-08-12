'use client';

import { useState } from 'react';
import CompassGuideModal from './CompassGuideModal';
import { BookOpen } from 'lucide-react';

export default function CompassHeaderGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
        title="Open interactive Compass Communities guide"
      >
        <BookOpen className="w-3.5 h-3.5 text-[#458B9E]" />
        <span>Page Guide</span>
      </button>

      <CompassGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
