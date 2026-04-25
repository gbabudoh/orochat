'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { joinCommunity } from '@/features/compass/actions';
import { UserPlus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommunityActionsProps {
  compassId: string;
  isMember: boolean;
}

export default function CommunityActions({ compassId, isMember }: CommunityActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [joined, setJoined] = useState(isMember);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const result = await joinCommunity(compassId);
      if (result.success) {
        setJoined(true);
        router.refresh();
      } else {
        alert(result.error || 'Failed to join community');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (joined) {
    return (
      <div className="flex items-center space-x-2 text-green-600 font-medium">
        <Check className="w-5 h-5" />
        <span>Member</span>
      </div>
    );
  }

  return (
    <Button onClick={handleJoin} isLoading={isLoading}>
      <UserPlus className="w-4 h-4 mr-2" />
      Join Community
    </Button>
  );
}
