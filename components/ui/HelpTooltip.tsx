'use client';

import { useState } from 'react';
import { HelpCircle, Info, Sparkles } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  tips?: string[];
  align?: 'left' | 'right' | 'center';
}

export default function HelpTooltip({ title, description, tips, align = 'left' }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const alignClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0';

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-all cursor-pointer border border-[#458B9E]/20"
        title="Hover or tap for usage instructions"
      >
        <HelpCircle className="w-3 h-3 text-[#458B9E]" />
        <span>Guide</span>
      </button>

      {/* Pop-over Card */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-gray-200 p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 ${alignClass}`}
        >
          <div className="flex items-start gap-2.5 mb-2">
            <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{description}</p>
            </div>
          </div>

          {tips && tips.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Pro Usage Tips</span>
              </div>
              <ul className="space-y-1">
                {tips.map((tip, idx) => (
                  <li key={idx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                    <span className="text-[#458B9E] font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
