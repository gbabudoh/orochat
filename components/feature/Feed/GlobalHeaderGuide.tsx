'use client';

import { useState } from 'react';
import GlobalGuideModal from './GlobalGuideModal';
import { HelpCircle, BookOpen } from 'lucide-react';

export default function GlobalHeaderGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-all cursor-pointer border border-[#458B9E]/20 shadow-2xs shrink-0"
        title="Open interactive Global Feed guide"
      >
        <BookOpen className="w-3.5 h-3.5 text-[#458B9E]" />
        <span>Page Guide</span>
      </button>

      <GlobalGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
