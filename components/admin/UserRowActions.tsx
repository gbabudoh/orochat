'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Ban, CheckCircle2, MessageSquare, Trash2 } from 'lucide-react';
import { setUserPaused } from '@/features/admin/user-actions';
import AdminMessageModal from './AdminMessageModal';
import TerminateUserModal from './TerminateUserModal';

interface Props {
  userId: string;
  userName: string;
  isPaused: boolean;
  canTerminate: boolean;
  // Detail page renders this in a header, not a table row — icons need more
  // room to breathe there than in a dense table cell.
  size?: 'sm' | 'md';
  // Detail page needs to navigate away once termination removes the row
  // it's showing; the table just refreshes the list in place (default).
  terminateRedirectTo?: string;
}

const ICON_BUTTON_BASE =
  'inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export default function UserRowActions({ userId, userName, isPaused, canTerminate, size = 'sm', terminateRedirectTo }: Props) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);

  const dims = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const iconDims = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const toggleSuspend = async () => {
    setIsToggling(true);
    await setUserPaused(userId, !isPaused);
    setIsToggling(false);
    toast.success(isPaused ? 'User reactivated' : 'User suspended');
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Link
          href={`/admin/users/${userId}`}
          title="View account"
          className={`${ICON_BUTTON_BASE} ${dims} text-gray-500 hover:bg-gray-100`}
        >
          <Eye className={iconDims} />
        </Link>

        <button
          type="button"
          onClick={toggleSuspend}
          disabled={isToggling}
          title={isPaused ? 'Reactivate account' : 'Suspend account'}
          className={`${ICON_BUTTON_BASE} ${dims} ${
            isPaused ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
          }`}
        >
          {isPaused ? <CheckCircle2 className={iconDims} /> : <Ban className={iconDims} />}
        </button>

        <button
          type="button"
          onClick={() => setIsMessageOpen(true)}
          title="Send message"
          className={`${ICON_BUTTON_BASE} ${dims} text-[#458B9E] hover:bg-[#458B9E]/10`}
        >
          <MessageSquare className={iconDims} />
        </button>

        <button
          type="button"
          onClick={() => canTerminate && setIsTerminateOpen(true)}
          disabled={!canTerminate}
          title={canTerminate ? 'Terminate account' : 'Only Super Admins can terminate accounts'}
          className={`${ICON_BUTTON_BASE} ${dims} text-red-700 hover:bg-red-50`}
        >
          <Trash2 className={iconDims} />
        </button>
      </div>

      <AdminMessageModal
        isOpen={isMessageOpen}
        onClose={() => setIsMessageOpen(false)}
        userId={userId}
        userName={userName}
      />
      <TerminateUserModal
        isOpen={isTerminateOpen}
        onClose={() => setIsTerminateOpen(false)}
        userId={userId}
        userName={userName}
        redirectTo={terminateRedirectTo}
      />
    </>
  );
}
