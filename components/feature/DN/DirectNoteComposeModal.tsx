'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { getDirectNoteThreadId, sendDirectNote } from '@/features/dn/actions';

const MAX_LENGTH = 500;

interface DirectNoteComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  recipientId: string;
  recipientName: string;
  isConnected?: boolean;
}

export default function DirectNoteComposeModal({
  isOpen,
  onClose,
  currentUserId,
  recipientId,
  recipientName,
  isConnected = false,
}: DirectNoteComposeModalProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setContent('');
    setError('');
    setIsChecking(true);

    let active = true;
    getDirectNoteThreadId(currentUserId, recipientId).then((threadId) => {
      if (!active) return;
      if (threadId) {
        onClose();
        router.push(`/dn/${threadId}`);
        return;
      }
      setIsChecking(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUserId, recipientId]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setError('');
    setIsSending(true);
    try {
      const result = await sendDirectNote(currentUserId, recipientId, content.trim());
      if (result.success) {
        onClose();
        router.push(`/dn/${result.threadId}`);
      } else {
        setError(result.error || 'Failed to send Direct Note');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send a Direct Note to ${recipientName}`}>
      {isChecking ? (
        <div className="w-full rounded-lg border-2 border-gray-100 bg-gray-50 p-4 text-sm text-gray-400">
          Checking for an existing note…
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {isConnected
              ? `A short, separate note to ${recipientName} — kept apart from your Collab conversation.`
              : `A short note ${recipientName} can read and reply to — no connection required. You'll still need to connect to unlock messaging, calls, and the rest of Orochat with them.`}
          </p>
          <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-[#458B9E] focus-within:ring-2 focus-within:ring-[#458B9E]/20">
            <textarea
              rows={5}
              value={content}
              maxLength={MAX_LENGTH}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Say hello to ${recipientName}…`}
              className="w-full border-none p-3 text-sm text-[#333333] resize-none outline-none"
            />
            <div className="text-right text-xs text-gray-400 px-3 py-1.5 bg-gray-50 border-t border-gray-200">
              {content.length} / {MAX_LENGTH} characters
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSend} isLoading={isSending} disabled={!content.trim()}>
              <Send className="w-4 h-4 mr-1.5" />
              Send Direct Note
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
