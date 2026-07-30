'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { setConsultSettings } from '@/features/booking/actions';
import { Video, FileText, Sparkles, DollarSign, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

const DURATION_OPTIONS = [
  { seconds: 900, label: '15 min' },
  { seconds: 1800, label: '30 min' },
  { seconds: 2700, label: '45 min' },
  { seconds: 3600, label: '60 min' },
];

interface ConsultSettingsFormProps {
  userId: string;
  initialEnabled: boolean;
  initialPriceCents: number | null;
  initialDurations: number[];
  initialTopic: string | null;
  initialDescription: string | null;
  initialOutcomes: string | null;
}

export default function ConsultSettingsForm({
  userId,
  initialEnabled,
  initialPriceCents,
  initialDurations,
  initialTopic,
  initialDescription,
  initialOutcomes,
}: ConsultSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [topic, setTopic] = useState(initialTopic ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [outcomes, setOutcomes] = useState(initialOutcomes ?? '');
  const [priceDollars, setPriceDollars] = useState(initialPriceCents ? (initialPriceCents / 100).toFixed(2) : '');
  const [durations, setDurations] = useState<number[]>(initialDurations);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDuration = (seconds: number) => {
    setDurations((prev) => (prev.includes(seconds) ? prev.filter((d) => d !== seconds) : [...prev, seconds]));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const priceCents = Math.round(parseFloat(priceDollars || '0') * 100);
    const result = await setConsultSettings(userId, { enabled, priceCents, durations, topic, description, outcomes });
    setIsSaving(false);

    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Consult settings saved');
  };

  return (
    <div className="space-y-6">
      {/* Accept Paid Consults Toggle Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#458B9E]/10 via-[#458B9E]/5 to-transparent rounded-xl border border-[#458B9E]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#458B9E] flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base">Accept paid consults</h3>
            <p className="text-xs text-gray-500">Enable video booking button on your profile</p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#458B9E]/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#458B9E]" />
        </label>
      </div>

      {enabled && (
        <div className="space-y-5 pt-1">
          {/* Consult Topic */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-1.5">
              <Video className="w-4 h-4 text-[#458B9E]" />
              <span>What's this consult for?</span>
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Career coaching for early-career engineers"
              className="w-full"
            />
          </div>

          {/* More Detail (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-1.5">
              <FileText className="w-4 h-4 text-[#458B9E]" />
              <span>More detail (optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give customers more context on what to expect from the call."
              rows={4}
              className="w-full px-4 py-3 min-h-[100px] text-sm rounded-xl border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all outline-none leading-relaxed"
            />
          </div>

          {/* What Customers Will Get (Optional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-1.5">
              <Sparkles className="w-4 h-4 text-[#458B9E]" />
              <span>What customers will get (optional)</span>
            </label>
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              placeholder={'e.g.\nA personalized career roadmap\nResume feedback\nAnswers to your top questions'}
              rows={5}
              className="w-full px-4 py-3 min-h-[125px] text-sm rounded-xl border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all outline-none leading-relaxed"
            />
          </div>

          {/* Price per Consult (USD) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-1.5">
              <DollarSign className="w-4 h-4 text-[#458B9E]" />
              <span>Price per consult (USD)</span>
            </label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="50.00"
              className="w-full"
            />
          </div>

          {/* Durations Offered */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#333333] mb-2">
              <Clock className="w-4 h-4 text-[#458B9E]" />
              <span>Durations offered</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {DURATION_OPTIONS.map((opt) => {
                const selected = durations.includes(opt.seconds);
                return (
                  <button
                    key={opt.seconds}
                    type="button"
                    onClick={() => toggleDuration(opt.seconds)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full border-2 transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#458B9E] text-white border-[#458B9E] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#458B9E]/40'
                    }`}
                  >
                    {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Save Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#458B9E]" />
          Automatic 70/30 payout split
        </span>
        <Button type="button" onClick={handleSave} isLoading={isSaving} className="px-6 py-2.5">
          Save Settings
        </Button>
      </div>
    </div>
  );
}

