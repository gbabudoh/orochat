'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { terminateUser } from '@/features/admin/user-actions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  // Detail page needs to navigate away once the row it's showing is gone;
  // the table just refreshes the list in place.
  redirectTo?: string;
}

export default function TerminateUserModal({ isOpen, onClose, userId, userName, redirectTo }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleTerminate = async () => {
    setIsLoading(true);
    const result = await terminateUser(userId);
    setIsLoading(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`${userName}'s account has been terminated`);
    onClose();
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terminate this account?" size="sm">
      <p className="text-gray-600 mb-6">
        This will permanently delete <span className="font-semibold">{userName}</span>&apos;s account and all
        associated data — posts, connections, messages, bookings, and everything else tied to it. This action
        cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={handleTerminate} isLoading={isLoading}>
          Terminate account
        </Button>
      </div>
    </Modal>
  );
}
