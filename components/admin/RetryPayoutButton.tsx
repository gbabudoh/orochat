'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { retryDistributionPayout } from '@/features/admin/revenue-actions';

export default function RetryPayoutButton({ distributionId }: { distributionId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const run = async () => {
    setIsLoading(true);
    const result = await retryDistributionPayout(distributionId);
    setIsLoading(false);
    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('Payout sent');
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={isLoading}
      className="text-xs font-medium text-[#458B9E] hover:underline disabled:opacity-60"
    >
      {isLoading ? 'Retrying…' : 'Retry payout'}
    </button>
  );
}
