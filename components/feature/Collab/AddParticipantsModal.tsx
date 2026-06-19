'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { getUserConnections } from '@/features/connections/actions';

interface Oro {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface AddParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  excludeUserIds: string[];
  onConfirm: (selectedIds: string[]) => Promise<void>;
  confirmLabel?: string;
}

export default function AddParticipantsModal({
  isOpen,
  onClose,
  currentUserId,
  excludeUserIds,
  onConfirm,
  confirmLabel = 'Add',
}: AddParticipantsModalProps) {
  const [oros, setOros] = useState<Oro[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelected([]);
    setIsLoading(true);
    getUserConnections(currentUserId).then((result) => {
      if (result.success && result.connections) {
        const list = result.connections
          .map((c) => c.oro as Oro)
          .filter((o) => !excludeUserIds.includes(o.id));
        setOros(list);
      }
      setIsLoading(false);
    });
  }, [isOpen, currentUserId, excludeUserIds]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selected);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Oros to chat">
      {isLoading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading your Oros…</p>
      ) : oros.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No more connected Oros to add.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
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

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleConfirm} isLoading={isSubmitting} disabled={selected.length === 0}>
          {confirmLabel}{selected.length > 0 ? ` (${selected.length})` : ''}
        </Button>
      </div>
    </Modal>
  );
}
