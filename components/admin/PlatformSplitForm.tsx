'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updatePlatformSplit } from '@/features/admin/revenue-actions';
import { Percent, Sparkles, Save, ShieldCheck } from 'lucide-react';

interface Props {
  oroSharePercent: number;
}

const PRESETS = [
  { label: '50/50 Equal', val: 0.5 },
  { label: '65/35 Default', val: 0.65 },
  { label: '75/25 Creator Preferred', val: 0.75 },
  { label: '80/20 Maximum', val: 0.8 },
];

export default function PlatformSplitForm({ oroSharePercent }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(oroSharePercent);
  const [isLoading, setIsLoading] = useState(false);

  const oroPercent = Math.round(value * 100);
  const platformPercent = Math.max(0, 100 - oroPercent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData();
    formData.append('oroSharePercent', String(value));
    const result = await updatePlatformSplit(formData);
    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Revenue split updated to ${oroPercent}% Oros / ${platformPercent}% Orochat`);
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Live Split Badges Header */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Oro Partners Pool</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">{oroPercent}%</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Distributed to qualified Oros</p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#458B9E] uppercase tracking-wider">
            <Percent className="w-3.5 h-3.5" />
            <span>Orochat Platform</span>
          </div>
          <p className="text-2xl font-extrabold text-[#458B9E] mt-1">{platformPercent}%</p>
          <p className="text-[11px] text-[#458B9E]/80 mt-0.5">Retained platform operations</p>
        </div>
      </div>

      {/* Dual Color Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-gray-700">
          <span>Oro Share ({oroPercent}%)</span>
          <span>Platform Cut ({platformPercent}%)</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex border border-gray-200">
          <div
            className="h-full bg-amber-500 transition-all duration-200"
            style={{ width: `${oroPercent}%` }}
          />
          <div
            className="h-full bg-[#458B9E] transition-all duration-200"
            style={{ width: `${platformPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive Slider Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Adjust Oro Share Percentage ({oroPercent}%)
        </label>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.01"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#458B9E]"
        />
        <div className="flex justify-between text-[11px] text-gray-400 font-mono">
          <span>10% (Min)</span>
          <span>50%</span>
          <span>90% (Max)</span>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Quick Preset Splits
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => setValue(preset.val)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                value === preset.val
                  ? 'bg-[#458B9E] text-white border-[#458B9E] shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Super Admin Authorization Granted</span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 bg-[#458B9E] hover:bg-[#397484] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving Split…' : 'Save Revenue Split'}
        </button>
      </div>
    </form>
  );
}
