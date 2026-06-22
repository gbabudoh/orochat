'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { resolveFraudFlag } from '@/features/admin/user-actions';

export default function FraudFlagResolve({ flagId }: { flagId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const resolve = async () => {
    setIsLoading(true);
    await resolveFraudFlag(flagId);
    setIsLoading(false);
    toast.success('Fraud flag resolved');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={resolve}
      disabled={isLoading}
      className="text-xs font-medium text-[#458B9E] hover:underline disabled:opacity-60"
    >
      Mark resolved
    </button>
  );
}
