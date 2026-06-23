'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { createOrRefreshConnectOnboardingLink } from '@/features/settings/stripe-connect-actions';

export default function ConnectPayoutsButton({ label }: { label: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const run = async () => {
    setIsLoading(true);
    const result = await createOrRefreshConnectOnboardingLink();
    if ('error' in result) {
      setIsLoading(false);
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  };

  return (
    <Button type="button" onClick={run} isLoading={isLoading}>
      {label}
    </Button>
  );
}
