'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { sendConnectionRequest } from '@/features/connections/actions';
import { UserPlus, Check, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileActionsProps {
  userId: string;
  currentUserId: string | undefined;
  isConnected: boolean;
  hasPendingRequest: boolean;
}

export default function ProfileActions({
  userId,
  currentUserId,
  isConnected,
  hasPendingRequest: initialPending,
}: ProfileActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPending, setHasPending] = useState(initialPending);

  const handleConnect = async () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendConnectionRequest(currentUserId, userId);
      if (result.success) {
        setHasPending(true);
        router.refresh();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Link href={`/collab/${userId}`}>
        <Button size="sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          Message
        </Button>
      </Link>
    );
  }

  if (hasPending) {
    return (
      <Button disabled size="sm" variant="ghost" className="bg-gray-100">
        <Check className="w-4 h-4 mr-2" />
        Request Pending
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleConnect} isLoading={isLoading}>
      <UserPlus className="w-4 h-4 mr-2" />
      Connect
    </Button>
  );
}
