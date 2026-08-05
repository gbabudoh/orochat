'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getOrganizationsForUser, convertConversationToSlate } from '@/features/oroslate/actions';

interface ConvertToSlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  conversationId: string;
  defaultName: string;
}

type OrgOption = Awaited<ReturnType<typeof getOrganizationsForUser>>[number];

export default function ConvertToSlateModal({
  isOpen,
  onClose,
  currentUserId,
  conversationId,
  defaultName,
}: ConvertToSlateModalProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [name, setName] = useState(defaultName);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(defaultName);
    setError('');
    setIsLoading(true);
    getOrganizationsForUser(currentUserId).then((orgs) => {
      setOrganizations(orgs);
      setOrganizationId(orgs[0]?.id ?? '');
      setIsLoading(false);
    });
  }, [isOpen, currentUserId, defaultName]);

  const handleConvert = async () => {
    setError('');
    if (!organizationId) {
      setError('Choose an organisation first');
      return;
    }
    if (!name.trim()) {
      setError('Slate name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await convertConversationToSlate(conversationId, organizationId, currentUserId, name);
      if (result.success && result.slateId) {
        onClose();
        router.push(`/oroslate/slate/${result.slateId}`);
      } else {
        setError(result.error || 'Failed to convert this chat into a Slate');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert this chat into an Oroslate Project" size="sm">
      {isLoading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading your organisations…</p>
      ) : organizations.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-4">
            You need an Oroslate organisation before converting a chat into a project workspace.
          </p>
          <Link href="/oroslate" onClick={onClose}>
            <Button type="button">Create an Organisation</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#333333] mb-1.5">Organisation</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Slate name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q3 Contract Negotiation"
          />

          <p className="text-xs text-gray-500 mt-2">
            This instantly moves the conversation into a dedicated workspace with a task board and notes —
            your chat history stays exactly where it is.
          </p>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConvert} isLoading={isSubmitting}>
              Convert to Slate
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
