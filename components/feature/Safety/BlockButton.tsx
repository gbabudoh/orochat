'use client';

import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { blockUser } from '@/features/safety/actions';

interface BlockButtonProps {
  blockerId: string;
  blockedId: string;
  blockedName: string;
  onBlocked?: () => void;
}

export default function BlockButton({ blockerId, blockedId, blockedName, onBlocked }: BlockButtonProps) {
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    if (!confirm(`Block ${blockedName}? They won't be able to send you Direct Notes or connection requests, and you won't see each other in search.`)) {
      return;
    }
    setIsBlocking(true);
    try {
      const result = await blockUser(blockerId, blockedId);
      if (result.success) {
        onBlocked?.();
      } else {
        alert(result.error || 'Failed to block user');
      }
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBlock}
      isLoading={isBlocking}
      className="text-[#D32F2F] hover:bg-[#D32F2F]/10"
    >
      <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
      Block
    </Button>
  );
}
