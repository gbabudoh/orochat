'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { setConsultSettings } from '@/features/booking/actions';

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
    <div className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-[#458B9E] focus:ring-[#458B9E]"
        />
        <span className="text-sm font-medium text-[#333333]">Accept paid consults on my profile</span>
      </label>

      {enabled && (
        <>
          <Input
            label="What's this consult for?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Career coaching for early-career engineers"
          />

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">More detail (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give customers more context on what to expect from the call."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">What customers will get (optional)</label>
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              placeholder={'e.g.\nA personalized career roadmap\nResume feedback\nAnswers to your top questions'}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
            />
          </div>

          <Input
            label="Price per consult (USD)"
            type="number"
            min="1"
            step="0.01"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
            placeholder="50.00"
          />

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">Durations offered</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  type="button"
                  onClick={() => toggleDuration(opt.seconds)}
                  className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-colors ${
                    durations.includes(opt.seconds)
                      ? 'bg-[#458B9E] text-white border-[#458B9E]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#458B9E]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </div>
    </div>
  );
}
