'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, UserPlus, Flag } from 'lucide-react';
import { getDirectNoteMessages, sendDirectNote } from '@/features/dn/actions';
import { sendConnectionRequest } from '@/features/connections/actions';
import BlockButton from '@/components/feature/Safety/BlockButton';
import ReportModal from '@/components/feature/Safety/ReportModal';
import UserAvatar from '@/components/ui/UserAvatar';
import Button from '@/components/ui/Button';

const POLL_INTERVAL_MS = 3000;
const MAX_LENGTH = 500;

interface DNUser {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
  company: string | null;
}

interface DNMessage {
  id: string;
  directNoteId: string;
  senderId: string;
  content: string;
  createdAt: Date | string;
  sender: { id: string; name: string; avatar: string | null };
}

interface DirectNoteThreadProps {
  threadId: string;
  currentUserId: string;
  otherUser: DNUser;
  isConnected: boolean;
}

export default function DirectNoteThread({ threadId, currentUserId, otherUser, isConnected }: DirectNoteThreadProps) {
  const [messages, setMessages] = useState<DNMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [connectState, setConnectState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const poll = async () => {
      const result = await getDirectNoteMessages(threadId, currentUserId);
      if (!active || !Array.isArray(result)) return;
      const fresh = result.filter((m) => !knownIds.current.has(m.id));
      if (fresh.length > 0 || knownIds.current.size === 0) {
        result.forEach((m) => knownIds.current.add(m.id));
        setMessages(result as DNMessage[]);
      }
      setIsLoading(false);
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [threadId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const result = await sendDirectNote(currentUserId, otherUser.id, newMessage.trim());
      if (result.success && result.message) {
        knownIds.current.add(result.message.id);
        setMessages((prev) => [...prev, result.message as unknown as DNMessage]);
        setNewMessage('');
      } else if (result.error) {
        alert(result.error);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleConnect = async () => {
    setConnectState('sending');
    const result = await sendConnectionRequest(currentUserId, otherUser.id);
    setConnectState(result.success ? 'sent' : 'idle');
    if (!result.success) alert(result.error || 'Failed to send connection request');
  };

  if (isBlocked) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-8 text-center">
          <p className="text-slate-500 text-sm">You&apos;ve blocked {otherUser.name}.</p>
          <Link href="/dn" className="text-[#458B9E] text-xs font-semibold mt-2 inline-block">
            Back to Direct Notes
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading Direct Note...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0 px-1 sm:px-0">
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 border-b border-slate-200/80 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/dn"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 shadow-2xs transition-all active:scale-[0.98]"
              aria-label="Back to Direct Notes"
            >
              <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
            </Link>
            <UserAvatar userId={otherUser.id} name={otherUser.name} avatarUrl={otherUser.avatar} size="md" />
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 text-sm sm:text-base truncate tracking-tight">{otherUser.name}</p>
              {otherUser.title && <p className="text-[11px] font-semibold text-slate-500 truncate">{otherUser.title}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {!isConnected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleConnect}
                isLoading={connectState === 'sending'}
                disabled={connectState === 'sent'}
                className="bg-white text-slate-700 hover:bg-slate-50 hover:text-[#458B9E] border border-slate-200/80 shadow-2xs rounded-lg px-2.5 py-1 text-xs font-semibold"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5 text-[#458B9E]" />
                {connectState === 'sent' ? 'Request Sent' : 'Send a Connection request instead'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReportOpen(true)}
              className="text-slate-500 hover:bg-slate-100"
            >
              <Flag className="w-3.5 h-3.5 mr-1.5" />
              Report
            </Button>
            <BlockButton
              blockerId={currentUserId}
              blockedId={otherUser.id}
              blockedName={otherUser.name}
              onBlocked={() => setIsBlocked(true)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50/30">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-bold text-sm">No messages yet</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Say hello below!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwn = message.senderId === currentUserId;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isOwn ? 'bg-[#458B9E] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input Dock */}
        <form onSubmit={handleSend} className="border-t border-slate-200/80 p-3 sm:p-4 bg-white">
          <div className="relative flex items-center">
            <textarea
              rows={1}
              value={newMessage}
              maxLength={MAX_LENGTH}
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Write a Direct Note reply..."
              style={{ minHeight: '44px', maxHeight: '140px', resize: 'none' }}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-4 pr-12 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all shadow-2xs leading-relaxed block"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#458B9E] hover:bg-[#397484] disabled:opacity-40 text-white flex items-center justify-center shadow-xs transition-all active:scale-[0.95] cursor-pointer"
              aria-label="Send Direct Note"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-right text-[10px] text-slate-400 mt-1 pr-1">{newMessage.length} / {MAX_LENGTH}</p>
        </form>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reporterId={currentUserId}
        reportedUserId={otherUser.id}
        reportedUserName={otherUser.name}
        context="DIRECT_NOTE"
        contextId={threadId}
      />
    </div>
  );
}
