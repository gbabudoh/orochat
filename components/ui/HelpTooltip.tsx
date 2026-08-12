'use client';

import { useEffect, useRef, useState } from 'react';
import { HelpCircle, Info, Sparkles } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  tips?: string[];
  align?: 'left' | 'right' | 'center';
}

const POPOVER_WIDTH_MOBILE = 288; // w-72
const POPOVER_WIDTH_DESKTOP = 320; // sm:w-80
const VIEWPORT_MARGIN = 16;

export default function HelpTooltip({ title, description, tips, align = 'left' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const width = window.innerWidth >= 640 ? POPOVER_WIDTH_DESKTOP : POPOVER_WIDTH_MOBILE;

      let left =
        align === 'right'
          ? rect.right - width
          : align === 'center'
            ? rect.left + rect.width / 2 - width / 2
            : rect.left;

      // Clamp so the popover always stays fully on-screen, regardless of
      // where the trigger sits (e.g. after a long heading).
      const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
      left = Math.min(Math.max(left, VIEWPORT_MARGIN), Math.max(maxLeft, VIEWPORT_MARGIN));

      setCoords({ top: rect.bottom + 8, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, align]);

  return (
    <div
      className="relative inline-flex items-center shrink-0"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-all cursor-pointer border border-[#458B9E]/20 outline-none focus-visible:ring-2 focus-visible:ring-[#458B9E]/40 shrink-0 select-none"
        title="Hover or tap for usage instructions"
      >
        <HelpCircle className="w-3 h-3 text-[#458B9E] shrink-0" />
        <span>Guide</span>
      </button>

      {/* Pop-over Card — fixed + measured so it always stays within the viewport */}
      {isOpen && coords && (
        <div
          style={{ top: coords.top, left: coords.left }}
          className="fixed w-72 sm:w-80 bg-white rounded-2xl border border-gray-200 p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
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
