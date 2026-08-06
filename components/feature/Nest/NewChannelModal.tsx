'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createChannel } from '@/features/oroslate/actions';

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  nestId: string;
  currentUserId: string;
  onCreated: (channel: { id: string; name: string; conversationId: string }) => void;
}

export default function NewChannelModal({ isOpen, onClose, nestId, currentUserId, onCreated }: NewChannelModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createChannel(nestId, currentUserId, name);
      if (result.success && result.channel) {
        onCreated(result.channel);
        setName('');
        onClose();
        router.refresh();
      } else {
        setError(result.error || 'Failed to create channel');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Channel">
      <Input
        label="Channel name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., design, client-updates"
      />
      <p className="text-xs text-gray-500 mt-2">
        Every current Slate member can see this channel. Your plan's channel limit applies.
      </p>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleCreate} isLoading={isSubmitting}>
          Create Channel
        </Button>
      </div>
    </Modal>
  );
}
