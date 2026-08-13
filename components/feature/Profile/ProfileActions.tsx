'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { sendConnectionRequest } from '@/features/connections/actions';
import WarmIntroModal from '@/components/feature/Profile/WarmIntroModal';
import DirectNoteComposeModal from '@/components/feature/DN/DirectNoteComposeModal';
import { UserPlus, Check, MessageSquare, Sparkles, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileActionsProps {
  userId: string;
  userName: string;
  currentUserId: string | undefined;
  isConnected: boolean;
  hasPendingRequest: boolean;
  isBlocked?: boolean;
}

export default function ProfileActions({
  userId,
  userName,
  currentUserId,
  isConnected,
  hasPendingRequest: initialPending,
  isBlocked = false,
}: ProfileActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPending, setHasPending] = useState(initialPending);
  const [isWarmIntroOpen, setIsWarmIntroOpen] = useState(false);
  const [isDirectNoteOpen, setIsDirectNoteOpen] = useState(false);

  const handleConnect = async () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendConnectionRequest(currentUserId, userId);
      if (result.success) {
        setHasPending(true);
        router.refresh();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isBlocked) {
    return null;
  }

  // Available on every profile regardless of connection status — DN is a
  // permanently separate, always-on channel alongside Collab, not just a
  // pre-connection icebreaker.
  const directNoteButton = currentUserId && (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setIsDirectNoteOpen(true)}
      className="flex-1 sm:flex-initial rounded-xl border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-[#458B9E] text-xs sm:text-sm font-semibold shadow-2xs whitespace-nowrap"
      title="Send Direct Note"
    >
      <Mail className="w-4 h-4 text-[#458B9E] mr-1.5 shrink-0" />
      <span className="hidden sm:inline">Send </span>
      <span>Direct Note</span>
    </Button>
  );

  const directNoteModal = currentUserId && (
    <DirectNoteComposeModal
      isOpen={isDirectNoteOpen}
      onClose={() => setIsDirectNoteOpen(false)}
      currentUserId={currentUserId}
      recipientId={userId}
      recipientName={userName}
      isConnected={isConnected}
    />
  );

  if (isConnected) {
    return (
      <>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:gap-2.5">
          <Link href={`/collab/${userId}`} className="flex-1 sm:flex-initial">
            <Button size="sm" className="w-full rounded-xl text-xs sm:text-sm font-semibold shadow-2xs whitespace-nowrap">
              <MessageSquare className="w-4 h-4 mr-1.5 shrink-0" />
              <span>Message</span>
            </Button>
          </Link>
          {directNoteButton}
        </div>
        {directNoteModal}
      </>
    );
  }

  if (hasPending) {
    return (
      <>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:gap-2.5">
          <Button disabled size="sm" variant="ghost" className="flex-1 sm:flex-initial rounded-xl bg-slate-100/80 text-slate-500 border border-slate-200/60 text-xs sm:text-sm font-semibold cursor-not-allowed whitespace-nowrap">
            <Check className="w-4 h-4 mr-1.5 shrink-0 text-slate-400" />
            <span>Request Pending</span>
          </Button>
          {directNoteButton}
        </div>
        {directNoteModal}
      </>
    );
  }

  return (
    <>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center sm:gap-2.5">
        <Button size="sm" onClick={handleConnect} isLoading={isLoading} className="w-full sm:w-auto rounded-xl text-xs sm:text-sm font-semibold shadow-2xs whitespace-nowrap">
          <UserPlus className="w-4 h-4 mr-1.5 shrink-0" />
          <span>Connect</span>
        </Button>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-nowrap sm:gap-2.5">
          {currentUserId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsWarmIntroOpen(true)}
              className="flex-1 sm:flex-initial rounded-xl border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-[#458B9E] text-xs sm:text-sm font-semibold shadow-2xs whitespace-nowrap"
              title="Draft Warm Intro"
            >
              <Sparkles className="w-4 h-4 text-amber-500 mr-1.5 shrink-0" />
              <span className="hidden sm:inline">Draft </span>
              <span>Warm Intro</span>
            </Button>
          )}
          {directNoteButton}
        </div>
      </div>

      {currentUserId && (
        <WarmIntroModal
          isOpen={isWarmIntroOpen}
          onClose={() => setIsWarmIntroOpen(false)}
          currentUserId={currentUserId}
          recipientId={userId}
          recipientName={userName}
        />
      )}

      {directNoteModal}
    </>
  );
}
