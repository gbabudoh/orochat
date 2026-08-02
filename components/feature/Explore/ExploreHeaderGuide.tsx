'use client';

import { useState } from 'react';
import ExploreGuideModal from './ExploreGuideModal';
import { BookOpen } from 'lucide-react';

export default function ExploreHeaderGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-all cursor-pointer border border-[#458B9E]/20 shadow-2xs shrink-0"
        title="Open interactive Explore Discovery guide"
      >
        <BookOpen className="w-4 h-4 text-[#458B9E]" />
        <span>Page Guide</span>
      </button>

      <ExploreGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
