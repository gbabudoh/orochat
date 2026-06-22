'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { distributePoolRevenue } from '@/features/admin/revenue-actions';

export default function PoolDistributeButton({ poolId }: { poolId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const run = async () => {
    setIsLoading(true);
    const result = await distributePoolRevenue(poolId);
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Revenue distributed');
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={isLoading}
      className="bg-[#458B9E] hover:bg-[#3a7585] disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
    >
      {isLoading ? 'Distributing…' : 'Run Distribution'}
    </button>
  );
}
