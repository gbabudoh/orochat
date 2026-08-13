'use client';

import Link from 'next/link';
import { Mail, Search } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatCompactDate } from '@/lib/utils/formatters';

interface DNUser {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
  company: string | null;
}

interface DirectNoteThreadSummary {
  threadId: string;
  otherUser: DNUser;
  latestMessage?: { content: string; createdAt: Date | string; sender: { name: string } } | null;
  unreadCount: number;
  updatedAt: Date | string;
}

interface DirectNoteThreadListProps {
  threads: DirectNoteThreadSummary[];
}

export default function DirectNoteThreadList({ threads }: DirectNoteThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 text-[#458B9E] flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8" />
        </div>
        <div className="max-w-sm space-y-1">
          <h3 className="text-base font-bold text-gray-900">No Direct Notes yet</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Find someone in Explore and send a note from their profile — no connection required.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#458B9E] hover:bg-[#387383] text-white transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Go to Explore</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {threads.map((thread) => (
        <Link
          key={thread.threadId}
          href={`/dn/${thread.threadId}`}
          className="flex items-center gap-3.5 py-3 px-3.5 rounded-2xl hover:bg-slate-50 active:bg-slate-100/80 transition-all group border border-transparent hover:border-slate-200/60"
        >
          <UserAvatar userId={thread.otherUser.id} name={thread.otherUser.name} avatarUrl={thread.otherUser.avatar} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="font-bold text-slate-900 group-hover:text-[#458B9E] transition-colors truncate text-sm sm:text-[15px]">
                {thread.otherUser.name}
              </h3>
              <span className="text-[10px] sm:text-xs text-slate-500 shrink-0 font-semibold tracking-tight bg-slate-100/90 px-2 py-0.5 rounded-md whitespace-nowrap">
                {formatCompactDate(thread.latestMessage?.createdAt ?? thread.updatedAt)}
              </span>
            </div>

            {thread.otherUser.title && (
              <p className="text-xs text-slate-500 truncate mb-0.5 font-medium">{thread.otherUser.title}</p>
            )}

            {thread.latestMessage && (
              <p className="text-xs text-slate-600 truncate leading-snug">{thread.latestMessage.content}</p>
            )}
          </div>

          {thread.unreadCount > 0 && (
            <div className="bg-[#458B9E] text-white text-[11px] font-extrabold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
