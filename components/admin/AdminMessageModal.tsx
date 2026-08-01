'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { sendUserMessage, AdminNoticeType } from '@/features/admin/user-actions';

const TYPE_OPTIONS: { value: AdminNoticeType; label: string }[] = [
  { value: 'info', label: 'Information' },
  { value: 'warning', label: 'Warning' },
  { value: 'changes', label: 'Account changes' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function AdminMessageModal({ isOpen, onClose, userId, userName }: Props) {
  const [type, setType] = useState<AdminNoticeType>('info');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const reset = () => {
    setType('info');
    setSubject('');
    setMessage('');
  };

  const handleClose = () => {
    if (isSending) return;
    reset();
    onClose();
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    setIsSending(true);
    const result = await sendUserMessage(userId, type, subject, message);
    setIsSending(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`Message sent to ${userName}`);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Message ${userName}`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AdminNoticeType)}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line"
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="What do you want to tell this user?"
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSend} isLoading={isSending}>
            Send message
          </Button>
        </div>
      </div>
    </Modal>
  );
}
