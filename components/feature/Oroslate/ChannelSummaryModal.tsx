'use client';

import { useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { generateChannelSummary } from '@/features/oroslate/ai-actions';
import { createTask } from '@/features/nest/actions';

interface ChannelSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentUserId: string;
  slateId?: string;
}

type Summary = {
  summary_text: string;
  decisions_made: string[];
  action_items: { assignee: string; task: string }[];
};

// Only mounted while the modal is open, so each open starts from fresh
// `useState` defaults instead of needing an effect to reset state.
function ChannelSummaryContent({
  conversationId,
  currentUserId,
  slateId,
}: {
  conversationId: string;
  currentUserId: string;
  slateId?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set());

  useEffect(() => {
    generateChannelSummary(conversationId, currentUserId).then((result) => {
      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        setError(result.error || 'Failed to generate summary');
      }
      setIsLoading(false);
    });
  }, [conversationId, currentUserId]);

  const handleAddTask = async (index: number, item: { assignee: string; task: string }) => {
    if (!slateId) return;
    const result = await createTask(slateId, currentUserId, {
      title: item.task,
      description: `Suggested by Oro AI — assignee: ${item.assignee}`,
    });
    if (result.success) {
      setAddedTasks((prev) => new Set(prev).add(index));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500 py-6 text-center animate-pulse">Reading the last 50 messages…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-500 py-4 text-center">{error}</p>;
  }
  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#333333] leading-relaxed">{summary.summary_text}</p>

      {summary.decisions_made.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Decisions made</p>
          <ul className="space-y-1">
            {summary.decisions_made.map((decision, i) => (
              <li key={i} className="text-sm text-[#333333] flex items-start gap-1.5">
                <span className="text-[#458B9E] mt-0.5">•</span>
                {decision}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.action_items.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Action items</p>
          <ul className="space-y-2">
            {summary.action_items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-2 bg-[#F0F3F7] rounded-lg px-3 py-2">
                <span className="text-sm text-[#333333] min-w-0">
                  <span className="font-medium">{item.assignee}:</span> {item.task}
                </span>
                {slateId && (
                  <button
                    type="button"
                    onClick={() => handleAddTask(i, item)}
                    disabled={addedTasks.has(i)}
                    className="shrink-0 text-xs font-semibold text-[#458B9E] hover:text-[#3a7585] disabled:text-gray-400 flex items-center gap-1"
                  >
                    {addedTasks.has(i) ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Add task
                      </>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChannelSummaryModal({
  isOpen,
  onClose,
  conversationId,
  currentUserId,
  slateId,
}: ChannelSummaryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ Catch Up with Oro AI" size="sm">
      {isOpen && (
        <ChannelSummaryContent conversationId={conversationId} currentUserId={currentUserId} slateId={slateId} />
      )}

      <div className="flex justify-end mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
