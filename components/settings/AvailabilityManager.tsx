'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { addAvailabilitySlot, removeAvailabilitySlot } from '@/features/booking/actions';

const DURATION_LABELS: Record<number, string> = {
  900: '15 min',
  1800: '30 min',
  2700: '45 min',
  3600: '60 min',
};

interface Slot {
  id: string;
  startAt: string; // ISO
  durationSeconds: number;
  isBooked: boolean;
}

interface AvailabilityManagerProps {
  userId: string;
  initialSlots: Slot[];
  allowedDurations: number[];
}

export default function AvailabilityManager({ userId, initialSlots, allowedDurations }: AvailabilityManagerProps) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [startAt, setStartAt] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(allowedDurations[0] ?? 900);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!startAt) {
      toast.error('Pick a date and time');
      return;
    }

    setIsAdding(true);
    const result = await addAvailabilitySlot(userId, new Date(startAt), durationSeconds);
    setIsAdding(false);

    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    setSlots((prev) => [...prev, { ...result.slot, startAt: result.slot.startAt.toISOString() }].sort((a, b) => a.startAt.localeCompare(b.startAt)));
    setStartAt('');
    toast.success('Slot added');
  };

  const handleRemove = async (slotId: string) => {
    const result = await removeAvailabilitySlot(slotId, userId);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Date & time"
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          className="max-w-xs"
        />
        <div>
          <label className="block text-sm font-medium text-[#333333] mb-1.5">Duration</label>
          <select
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
          >
            {allowedDurations.map((d) => (
              <option key={d} value={d}>{DURATION_LABELS[d] ?? `${d / 60} min`}</option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={handleAdd} isLoading={isAdding}>
          Add slot
        </Button>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-gray-500">No upcoming open times — add one above.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {slots.map((slot) => (
            <li key={slot.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-[#333333]">
                  {new Date(slot.startAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="text-xs text-gray-500">
                  {DURATION_LABELS[slot.durationSeconds] ?? `${slot.durationSeconds / 60} min`}
                  {slot.isBooked && <span className="ml-2 text-[#458B9E] font-medium">Booked</span>}
                </p>
              </div>
              {!slot.isBooked && (
                <button
                  type="button"
                  onClick={() => handleRemove(slot.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
