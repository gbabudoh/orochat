'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { markPaid } from '@/features/admin/revenue-actions';

export default function MarkPaidButton({ distributionId }: { distributionId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const run = async () => {
    setIsLoading(true);
    await markPaid(distributionId);
    setIsLoading(false);
    toast.success('Marked as paid');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={isLoading}
      className="text-xs font-medium text-[#458B9E] hover:underline disabled:opacity-60"
    >
      Mark Paid
    </button>
  );
}
