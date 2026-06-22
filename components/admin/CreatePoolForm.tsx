'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createRevenuePool } from '@/features/admin/revenue-actions';

export default function CreatePoolForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await createRevenuePool(formData);
    setIsLoading(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Revenue pool created');
      router.refresh();
      e.currentTarget.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
        <input type="number" name="month" min="1" max="12" required className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
        <input type="number" name="year" min="2020" required defaultValue={new Date().getFullYear()} className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Gross ($)</label>
        <input type="number" name="grossAmount" min="0" step="0.01" required className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm" />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="col-span-3 bg-[#458B9E] hover:bg-[#3a7585] disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
      >
        {isLoading ? 'Creating…' : 'Create Pool'}
      </button>
    </form>
  );
}
