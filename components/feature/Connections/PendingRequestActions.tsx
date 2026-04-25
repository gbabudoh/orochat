'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { acceptConnection, rejectConnection } from '@/features/connections/actions';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingRequestActionsProps {
  connectionId: string;
  userId: string;
}

export default function PendingRequestActions({ connectionId, userId }: PendingRequestActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (action: 'accept' | 'reject') => {
    setIsLoading(action);
    try {
      const result = action === 'accept' 
        ? await acceptConnection(connectionId, userId)
        : await rejectConnection(connectionId, userId);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || `Failed to ${action} request`);
      }
    } catch {
      alert('An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        size="sm" 
        onClick={() => handleAction('accept')} 
        isLoading={isLoading === 'accept'}
        className="bg-green-600 hover:bg-green-700"
      >
        <Check className="w-4 h-4 mr-1" />
        Accept
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={() => handleAction('reject')} 
        isLoading={isLoading === 'reject'}
        className="text-red-500 hover:bg-red-50"
      >
        <X className="w-4 h-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
