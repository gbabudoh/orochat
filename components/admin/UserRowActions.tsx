'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setUserPaused } from '@/features/admin/user-actions';

interface Props {
  userId: string;
  isPaused: boolean;
}

export default function UserRowActions({ userId, isPaused }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async () => {
    setIsLoading(true);
    await setUserPaused(userId, !isPaused);
    setIsLoading(false);
    toast.success(isPaused ? 'User reactivated' : 'User paused');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading}
      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-60 ${
        isPaused ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'
      }`}
    >
      {isPaused ? 'Reactivate' : 'Pause'}
    </button>
  );
}
