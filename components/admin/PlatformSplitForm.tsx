'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updatePlatformSplit } from '@/features/admin/revenue-actions';

export default function PlatformSplitForm({ oroSharePercent }: { oroSharePercent: number }) {
  const router = useRouter();
  const [value, setValue] = useState(oroSharePercent);
  const [isLoading, setIsLoading] = useState(false);

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
      toast.success('Revenue split updated');
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Oro share (%)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Enter as a decimal (e.g. 0.65 = 65% to Oros / 35% to Orochat). Currently {(value * 100).toFixed(0)}% / {((1 - value) * 100).toFixed(0)}%.
        </p>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-[#458B9E] hover:bg-[#3a7585] disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {isLoading ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
