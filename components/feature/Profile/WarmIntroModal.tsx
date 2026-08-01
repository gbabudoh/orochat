'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Send, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { generateWarmIntro, type WarmIntroTone } from '@/features/oroslate/ai-actions';
import { sendConnectionRequest } from '@/features/connections/actions';

const MAX_LENGTH = 300;

const TONE_OPTIONS: { value: WarmIntroTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'pitch', label: 'Pitch-focused' },
];

interface WarmIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  recipientId: string;
  recipientName: string;
}

export default function WarmIntroModal({
  isOpen,
  onClose,
  currentUserId,
  recipientId,
  recipientName,
}: WarmIntroModalProps) {
  const router = useRouter();
  const [tone, setTone] = useState<WarmIntroTone>('professional');
  const [draftText, setDraftText] = useState('');
  const [commonGround, setCommonGround] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const generate = async (selectedTone: WarmIntroTone) => {
    setIsGenerating(true);
    setError('');
    const result = await generateWarmIntro(currentUserId, recipientId, selectedTone);
    if (result.success && result.draft) {
      setDraftText(result.draft.draft_text.slice(0, MAX_LENGTH));
      setCommonGround(result.draft.common_ground_used);
    } else {
      setError(result.error || 'Failed to draft a warm intro');
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    setTone('professional');
    generate('professional');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUserId, recipientId]);

  const handleToneChange = (value: WarmIntroTone) => {
    setTone(value);
    generate(value);
  };

  const handleSend = async () => {
    setError('');
    setIsSending(true);
    try {
      const result = await sendConnectionRequest(currentUserId, recipientId, draftText, true);
      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error || 'Failed to send connection request');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`✨ Craft a Connection Note with Oro AI`}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#333333] mb-2">Select tone</label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleToneChange(opt.value)}
              disabled={isGenerating}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${
                tone === opt.value
                  ? 'bg-[#458B9E] text-white border-[#458B9E]'
                  : 'bg-white text-[#333333] border-gray-200 hover:border-[#458B9E]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {commonGround.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#333333] mb-2">Common ground found</label>
          <div className="flex flex-wrap gap-2">
            {commonGround.map((item, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#458B9E]/10 text-[#458B9E] border border-[#458B9E]/20"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-1">
        {isGenerating ? (
          <div className="w-full rounded-lg border-2 border-gray-100 bg-gray-50 p-4 text-sm text-gray-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Drafting a note for {recipientName}…
          </div>
        ) : (
          <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-[#458B9E] focus-within:ring-2 focus-within:ring-[#458B9E]/20">
            <textarea
              rows={4}
              value={draftText}
              maxLength={MAX_LENGTH}
              onChange={(e) => setDraftText(e.target.value)}
              className="w-full border-none p-3 text-sm text-[#333333] resize-none outline-none"
            />
            <div className="text-right text-xs text-gray-400 px-3 py-1.5 bg-gray-50 border-t border-gray-200">
              {draftText.length} / {MAX_LENGTH} characters
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      <div className="flex justify-between gap-2 mt-6">
        <Button type="button" variant="secondary" onClick={() => generate(tone)} disabled={isGenerating} isLoading={isGenerating}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Regenerate
        </Button>
        <Button type="button" onClick={handleSend} isLoading={isSending} disabled={isGenerating || !draftText.trim()}>
          <Send className="w-4 h-4 mr-1.5" />
          Send Custom Note
        </Button>
      </div>
    </Modal>
  );
}
