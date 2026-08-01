'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createOrganization } from '@/features/oroslate/actions';
import { attachReferral } from '@/features/oroslate/affiliate-actions';

interface NewOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  referralRef?: string;
}

export default function NewOrganizationModal({ isOpen, onClose, currentUserId, referralRef }: NewOrganizationModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrganization(currentUserId, name);
      if (result.success && result.organizationId) {
        if (referralRef) await attachReferral(result.organizationId, referralRef);
        onClose();
        router.push(`/oroslate/org/${result.organizationId}`);
      } else {
        setError(result.error || 'Failed to create organization');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create an Oroslate Organization">
      <Input
        label="Organization name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Apex Design Ltd"
      />
      <p className="text-xs text-gray-500 mt-2">
        Your organization starts on a 14-day free Pro Slate trial — no card required. You can create Slates,
        invite your team, and upgrade any time before the trial ends.
      </p>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      <div className="flex justify-end gap-2 mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleCreate} isLoading={isSubmitting}>
          Create Organization
        </Button>
      </div>
    </Modal>
  );
}
