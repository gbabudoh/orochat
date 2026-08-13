'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { reportUser } from '@/features/safety/actions';

const REASON_OPTIONS: { value: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'FAKE_PROFILE' | 'OTHER'; label: string }[] = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'FAKE_PROFILE', label: 'Fake profile' },
  { value: 'OTHER', label: 'Other' },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  context: 'DIRECT_NOTE' | 'PROFILE' | 'MESSAGE';
  contextId?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  reporterId,
  reportedUserId,
  reportedUserName,
  context,
  contextId,
}: ReportModalProps) {
  const [reason, setReason] = useState<typeof REASON_OPTIONS[number]['value']>('SPAM');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await reportUser(reporterId, reportedUserId, context, reason, contextId, details.trim() || undefined);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setDetails('');
      setReason('SPAM');
    }, 200);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Report ${reportedUserName}`}>
      {submitted ? (
        <div className="text-center py-6">
          <p className="text-sm font-semibold text-gray-900">Report submitted</p>
          <p className="text-xs text-gray-500 mt-1">Thanks — our team will review this.</p>
          <Button type="button" variant="ghost" className="mt-4" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#333333] mb-2">Reason</label>
            <div className="flex flex-wrap gap-2">
              {REASON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReason(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    reason === opt.value
                      ? 'bg-[#D32F2F] text-white border-[#D32F2F]'
                      : 'bg-white text-[#333333] border-gray-200 hover:border-[#D32F2F]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">Details (optional)</label>
            <textarea
              rows={3}
              value={details}
              maxLength={500}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-[#333333] resize-none outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20"
            />
          </div>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleSubmit} isLoading={isSubmitting}>
              <Flag className="w-4 h-4 mr-1.5" />
              Submit Report
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
