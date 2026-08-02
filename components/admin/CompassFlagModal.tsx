'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { flagCompass } from '@/features/admin/compass-actions';
import { Flag, AlertTriangle, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  compassId: string;
  compassName: string;
  isFlagged: boolean;
  currentReason?: string | null;
}

const PRESET_REASONS = [
  'Inappropriate or Offensive Content',
  'Spam or Misleading Information',
  'Copyright or Intellectual Property Violation',
  'Terms of Service & Platform Policy Violation',
];

export default function CompassFlagModal({
  isOpen,
  onClose,
  compassId,
  compassName,
  isFlagged,
  currentReason,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState(currentReason ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await flagCompass(compassId, !isFlagged, reason.trim());
    setIsLoading(false);

    if (res?.success) {
      toast.success(isFlagged ? 'Flag cleared for community' : 'Community flagged for review');
      onClose();
      router.refresh();
    }
  };

  const handleClearFlag = async () => {
    setIsLoading(true);
    await flagCompass(compassId, false);
    setIsLoading(false);
    toast.success('Flag removed');
    onClose();
    router.refresh();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isFlagged ? 'Manage Flag' : 'Flag Community'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">
              {isFlagged ? 'Community Currently Flagged' : 'Flag Community for Moderation'}
            </h4>
            <p className="mt-0.5 leading-relaxed">
              Target: <strong>{compassName}</strong>. Flagging adds a warning badge to the admin directory for moderation tracking.
            </p>
          </div>
        </div>

        {!isFlagged && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Preset Reason
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    reason === preset
                      ? 'bg-[#458B9E]/10 border-[#458B9E] text-[#458B9E] font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            {isFlagged ? 'Flag Reason Note' : 'Custom Flag Reason'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the reason for flagging this community..."
            rows={3}
            required={!isFlagged}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#458B9E] text-xs leading-relaxed outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {isFlagged ? (
            <button
              type="button"
              onClick={handleClearFlag}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Clear Flag
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {isLoading ? 'Saving…' : isFlagged ? 'Update Flag' : 'Flag Community'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
