'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters';
import { getCallHistory, archiveCallSession, unarchiveCallSession, deleteCallSession } from '@/features/collab/actions';
import { Video, Archive, ArchiveRestore, Trash2 } from 'lucide-react';

interface CallHistoryEntry {
  id: string;
  roomName: string;
  initiatorId: string;
  durationSeconds: number | null;
  startedAt: Date | string;
  endedAt: Date | string | null;
  archived: boolean;
  initiator: { id: string; name: string; avatar: string | null };
}

interface CallHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentUserId: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'No limit';
  return `${Math.round(seconds / 60)} min`;
}

export default function CallHistoryModal({ isOpen, onClose, conversationId, currentUserId }: CallHistoryModalProps) {
  const [calls, setCalls] = useState<CallHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const result = await getCallHistory(conversationId, currentUserId);
    if (result.success && result.calls) {
      setCalls(result.calls as CallHistoryEntry[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, conversationId]);

  const handleArchive = async (id: string, archived: boolean) => {
    setPendingId(id);
    try {
      if (archived) await unarchiveCallSession(id, currentUserId);
      else await archiveCallSession(id, currentUserId);
      await load();
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingId(id);
    try {
      await deleteCallSession(id, currentUserId);
      await load();
    } finally {
      setPendingId(null);
    }
  };

  const visibleCalls = calls.filter((c) => c.archived === showArchived);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Call History" size="lg">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!showArchived ? 'bg-[#458B9E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showArchived ? 'bg-[#458B9E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Archived
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading call history…</p>
      ) : visibleCalls.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          {showArchived ? 'No archived calls.' : 'No calls yet.'}
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visibleCalls.map((call) => {
            const isModerator = call.initiatorId === currentUserId;
            const isPending = pendingId === call.id;
            return (
              <div key={call.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-[#458B9E]/10 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4 text-[#458B9E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#333333]">
                    <UserAvatar userId={call.initiator.id} name={call.initiator.name} avatarUrl={call.initiator.avatar} size="sm" />
                    <span className="truncate">{call.initiator.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${call.endedAt ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                      {call.endedAt ? 'Ended' : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5" title={formatDateTime(call.startedAt)}>
                    {formatRelativeTime(call.startedAt)} &middot; {formatDuration(call.durationSeconds)}
                  </p>
                </div>
                {isModerator && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleArchive(call.id, call.archived)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title={call.archived ? 'Unarchive' : 'Archive'}
                    >
                      {call.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(call.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
