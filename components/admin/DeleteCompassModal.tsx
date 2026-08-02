'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { deleteCompass } from '@/features/admin/compass-actions';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  compassId: string;
  compassName: string;
}

export default function DeleteCompassModal({ isOpen, onClose, compassId, compassName }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await deleteCompass(compassId);
    setIsLoading(false);

    if (res?.success) {
      toast.success(`Community "${compassName}" removed permanently`);
      onClose();
      router.refresh();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Community">
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Confirm Deletion</h4>
            <p className="mt-0.5 leading-relaxed">
              Are you sure you want to permanently delete <strong>{compassName}</strong>? This action cannot be undone and will clean up all associated memberships.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isLoading ? 'Deleting…' : 'Delete Community'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
