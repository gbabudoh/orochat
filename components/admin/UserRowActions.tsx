'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Ban, RotateCcw, MessageSquare, Trash2 } from 'lucide-react';
import { setUserPaused } from '@/features/admin/user-actions';
import AdminMessageModal from './AdminMessageModal';
import TerminateUserModal from './TerminateUserModal';

interface Props {
  userId: string;
  userName: string;
  isPaused: boolean;
  canTerminate: boolean;
  size?: 'sm' | 'md';
  terminateRedirectTo?: string;
}

const ICON_BUTTON_BASE =
  'inline-flex items-center justify-center rounded-xl transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export default function UserRowActions({
  userId,
  userName,
  isPaused,
  canTerminate,
  size = 'sm',
  terminateRedirectTo,
}: Props) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);

  const dims = size === 'sm' ? 'w-8 h-8' : 'w-9.5 h-9.5';
  const iconDims = size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5';

  const toggleSuspend = async () => {
    setIsToggling(true);
    await setUserPaused(userId, !isPaused);
    setIsToggling(false);
    toast.success(isPaused ? 'User account reactivated' : 'User account suspended');
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Link
          href={`/admin/users/${userId}`}
          title="View User Details"
          className={`${ICON_BUTTON_BASE} ${dims} text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-200`}
        >
          <Eye className={iconDims} />
        </Link>

        <button
          type="button"
          onClick={toggleSuspend}
          disabled={isToggling}
          title={isPaused ? 'Reactivate Account' : 'Suspend Account'}
          className={`${ICON_BUTTON_BASE} ${dims} ${
            isPaused
              ? 'text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
              : 'text-amber-700 hover:bg-amber-50 hover:border-amber-200'
          }`}
        >
          {isPaused ? <RotateCcw className={iconDims} /> : <Ban className={iconDims} />}
        </button>

        <button
          type="button"
          onClick={() => setIsMessageOpen(true)}
          title="Send Admin Message"
          className={`${ICON_BUTTON_BASE} ${dims} text-[#458B9E] hover:bg-[#458B9E]/10 hover:border-[#458B9E]/20`}
        >
          <MessageSquare className={iconDims} />
        </button>

        <button
          type="button"
          onClick={() => canTerminate && setIsTerminateOpen(true)}
          disabled={!canTerminate}
          title={canTerminate ? 'Terminate Account' : 'Only Super Admins can terminate accounts'}
          className={`${ICON_BUTTON_BASE} ${dims} text-red-600 hover:bg-red-50 hover:border-red-200`}
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
