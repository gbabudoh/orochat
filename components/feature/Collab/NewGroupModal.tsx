'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UserAvatar from '@/components/ui/UserAvatar';
import { getUserConnections } from '@/features/connections/actions';
import { createGroupConversation } from '@/features/collab/actions';

interface Oro {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function NewGroupModal({ isOpen, onClose, currentUserId }: NewGroupModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [oros, setOros] = useState<Oro[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setSelected([]);
    setError('');
    setIsLoading(true);
    getUserConnections(currentUserId).then((result) => {
      if (result.success && result.connections) {
        setOros(result.connections.map((c) => c.oro as Oro));
      }
      setIsLoading(false);
    });
  }, [isOpen, currentUserId]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (selected.length < 2) {
      setError('Pick at least 2 Oros for a group');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createGroupConversation(currentUserId, name, selected);
      if (result.success && result.conversationId) {
        onClose();
        router.push(`/collab/${result.conversationId}`);
      } else {
        setError(result.error || 'Failed to create group');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Group Chat">
      <Input
        label="Group name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Project Alpha Team"
      />

      <p className="text-sm font-medium text-[#333333] mt-4 mb-2">Add Oros</p>
      {isLoading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading your Oros…</p>
      ) : oros.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          You need at least 2 connected Oros to start a group.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {oros.map((oro) => (
            <label
              key={oro.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(oro.id)}
                onChange={() => toggle(oro.id)}
                className="w-4 h-4 text-[#458B9E] border-gray-300 rounded focus:ring-[#458B9E]"
              />
              <UserAvatar userId={oro.id} name={oro.name} avatarUrl={oro.avatar} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#333333] truncate">{oro.name}</p>
                {oro.title && <p className="text-xs text-gray-500 truncate">{oro.title}</p>}
              </div>
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleCreate} isLoading={isSubmitting}>
          Create Group
        </Button>
      </div>
    </Modal>
  );
}
