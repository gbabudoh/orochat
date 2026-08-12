'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
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
      setError('Organisation name is required');
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
        setError(result.error || 'Failed to create organisation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create an Oroslate Organisation">
      <div className="space-y-4 pt-1">
        <Input
          label="Organisation name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Apex Design Ltd"
          autoFocus
        />

        {/* Trial Perk Callout Container */}
        <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 shadow-2xs flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-[#458B9E]/10 text-[#458B9E] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-900">14-Day Free Pro Slate Trial</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              No credit card required. You can create Slates, invite your team, and manage projects right away.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200/80 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Creating…</span>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-white/90 shrink-0" />
                <span>Create Organisation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
