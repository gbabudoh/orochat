'use client';

import { useEffect, useRef, useState } from 'react';
import { getMessages, getConversation, sendMessage, addParticipants, startCall, endCallForEveryone, enforceCallDurationCutoff, archiveCallSession, deleteCallSession, deleteMessage } from '@/features/collab/actions';
import { createAgreement, signAgreement, getAgreementsByIds } from '@/features/collab/agreement-actions';
import MessageBubble from '@/components/feature/Collab/MessageBubble';
import AddParticipantsModal from '@/components/feature/Collab/AddParticipantsModal';
import NewAgreementModal from '@/components/feature/Collab/NewAgreementModal';
import CallHistoryModal from '@/components/feature/Collab/CallHistoryModal';
import BookingBanner from '@/components/feature/Collab/BookingBanner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UserAvatar from '@/components/ui/UserAvatar';
import { Send, UserPlus, Users, Video, PhoneOff, FileText, ChevronDown, History, ArrowLeft } from 'lucide-react';
import { ChatMessage, AgreementData, AGREEMENT_MESSAGE_PREFIX } from '@/types/chat';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const POLL_INTERVAL_MS = 3000;

const CALL_DURATION_OPTIONS: { label: string; seconds: number | undefined }[] = [
  { label: 'No limit', seconds: undefined },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '60 min', seconds: 3600 },
];

function formatCountdown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
  presence?: 'online' | 'offline';
}

const PRESENCE_LABEL: Record<'online' | 'offline', string> = {
  online: 'Online',
  offline: 'Offline',
};

interface ChatRoomProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatRoom({ conversationId, currentUserId }: ChatRoomProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agreementsById, setAgreementsById] = useState<Record<string, AgreementData>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDurationMenuOpen, setIsDurationMenuOpen] = useState(false);
  const [durationMenuPos, setDurationMenuPos] = useState<{ top: number; left: number } | null>(null);
  const callButtonRef = useRef<HTMLDivElement>(null);
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const [activeCallSessionId, setActiveCallSessionId] = useState<string | null>(null);
  const [activeCallInitiatorId, setActiveCallInitiatorId] = useState<string | null>(null);
  const [activeCallEndsAt, setActiveCallEndsAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const autoCallParam = searchParams.get('autoCall');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const hasFiredCutoff = useRef(false);
  const hasFiredAutoCall = useRef(false);

  // Auto-trigger call when autoCall query param is present
  useEffect(() => {
    if (autoCallParam && !isLoading && !hasFiredAutoCall.current) {
      hasFiredAutoCall.current = true;
      startVideoCall();
    }
  }, [autoCallParam, isLoading]);

  useEffect(() => {
    let active = true;

    const loadConversation = async () => {
      const result = await getConversation(conversationId, currentUserId);
      if (active && result.success && result.conversation) {
        setIsGroup(result.conversation.isGroup);
        setGroupName(result.conversation.name);
        setMembers(
          result.conversation.participants
            .filter((p) => p.userId !== currentUserId)
            .map((p) => p.user)
        );
      }
    };

    const refreshAgreements = async (messageList: ChatMessage[]) => {
      const agreementIds = messageList
        .filter((m) => m.content.startsWith(AGREEMENT_MESSAGE_PREFIX))
        .map((m) => m.content.slice(AGREEMENT_MESSAGE_PREFIX.length));
      if (agreementIds.length === 0) return;

      const agreements = await getAgreementsByIds(agreementIds);
      if (!active) return;
      setAgreementsById((prev) => {
        const next = { ...prev };
        agreements.forEach((a) => {
          next[a.id] = a as unknown as AgreementData;
        });
        return next;
      });
    };

    const poll = async () => {
      const result = await getMessages(conversationId, currentUserId);
      if (!active || !Array.isArray(result)) return;
      const fresh = result.filter((m) => !knownIds.current.has(m.id));
      if (fresh.length > 0 || knownIds.current.size === 0) {
        result.forEach((m) => knownIds.current.add(m.id));
        setMessages(result);
      }
      refreshAgreements(result);
      setIsLoading(false);
    };

    loadConversation();
    poll();
    const interval = setInterval(() => {
      poll();
      loadConversation();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('conversationId', conversationId);

      const result = await sendMessage(currentUserId, formData);
      if (result.success && result.message) {
        knownIds.current.add(result.message.id);
        setMessages((prev) => [...prev, result.message as ChatMessage]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSpecialMessage = async (content: string) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('conversationId', conversationId);

      const result = await sendMessage(currentUserId, formData);
      if (result.success && result.message) {
        knownIds.current.add(result.message.id);
        setMessages((prev) => [...prev, result.message as ChatMessage]);
      }
    } catch (error) {
      console.error('Failed to send special message:', error);
    }
  };

  const handleCreateAgreement = async (
    title: string,
    terms: string,
    signerUserIds: string[],
    signature: { signatureBase64: string; publicKeyJwk: JsonWebKey }
  ) => {
    const result = await createAgreement(currentUserId, conversationId, title, terms, signerUserIds, signature);
    if (result.success && result.message) {
      knownIds.current.add(result.message.id);
      setMessages((prev) => [...prev, result.message as ChatMessage]);
    } else if (result.error) {
      console.error('Failed to create agreement:', result.error);
    }
    return result;
  };

  const handleSignAgreement = async (agreementId: string, signature: { signatureBase64: string; publicKeyJwk: JsonWebKey }) => {
    const result = await signAgreement(agreementId, currentUserId, signature);
    if (result.success && result.agreement) {
      setAgreementsById((prev) => ({ ...prev, [agreementId]: result.agreement as unknown as AgreementData }));
    }
    return result;
  };

  const handleArchiveCall = async ({ messageId, callSessionId }: { messageId: string; callSessionId: string }) => {
    const result = await archiveCallSession(callSessionId, currentUserId);
    if (result.success) {
      knownIds.current.delete(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const handleDeleteCall = async ({ messageId, callSessionId }: { messageId: string; callSessionId?: string }) => {
    const result = callSessionId
      ? await deleteCallSession(callSessionId, currentUserId)
      : await deleteMessage(messageId, currentUserId);
    if (result.success) {
      knownIds.current.delete(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const joinCallRoom = async (call: { roomName: string; callSessionId?: string; initiatorId?: string; durationSeconds?: number | null; endsAt?: string | null }) => {
    setActiveCallRoom(call.roomName);
    setActiveCallSessionId(call.callSessionId ?? null);
    setActiveCallInitiatorId(call.initiatorId ?? null);
    setActiveCallEndsAt(call.endsAt ?? null);
    hasFiredCutoff.current = false;
    try {
      const response = await fetch(`/api/livekit/token?room=${encodeURIComponent(call.roomName)}`);
      const data = await response.json();
      if (data.token) {
        setLiveKitToken(data.token);
        setLiveKitUrl(data.wsUrl);
      } else {
        alert(data.error || 'LiveKit server token could not be generated.');
        endVideoCall();
      }
    } catch (err) {
      console.error('Failed to fetch LiveKit token:', err);
      alert('Unable to connect to video call server. Please check your network connection.');
      endVideoCall();
    }
  };

  const startVideoCall = async (durationSeconds?: number) => {
    setIsDurationMenuOpen(false);
    const result = await startCall(conversationId, currentUserId, durationSeconds);
    if (!('success' in result) || !result.success) {
      const errorMsg = 'error' in result ? result.error : 'Failed to start call session';
      alert(errorMsg);
      console.error('Failed to start call:', errorMsg);
      return;
    }
    const message = await getMessages(conversationId, currentUserId);
    if (Array.isArray(message)) {
      message.forEach((m) => knownIds.current.add(m.id));
      setMessages(message);
    }
    await joinCallRoom({
      roomName: result.roomName,
      callSessionId: result.callSessionId,
      initiatorId: currentUserId,
      durationSeconds: result.durationSeconds,
      endsAt: result.endsAt,
    });
  };

  const endVideoCall = () => {
    setActiveCallRoom(null);
    setActiveCallSessionId(null);
    setActiveCallInitiatorId(null);
    setActiveCallEndsAt(null);
    setSecondsLeft(null);
    setLiveKitToken(null);
    setLiveKitUrl(null);
  };

  const endCallForEveryoneNow = async () => {
    if (!activeCallSessionId) return;
    await endCallForEveryone(activeCallSessionId, currentUserId);
    endVideoCall();
  };

  const isModerator = !!activeCallInitiatorId && activeCallInitiatorId === currentUserId;

  useEffect(() => {
    if (!activeCallEndsAt) {
      setSecondsLeft(null);
      return;
    }

    const endsAtMs = new Date(activeCallEndsAt).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((endsAtMs - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0 && !hasFiredCutoff.current && activeCallSessionId) {
        hasFiredCutoff.current = true;
        enforceCallDurationCutoff(activeCallSessionId, currentUserId).then(endVideoCall);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCallEndsAt, activeCallSessionId]);

  const handleAddParticipants = async (userIds: string[]) => {
    await addParticipants(conversationId, currentUserId, userIds);
    const result = await getConversation(conversationId, currentUserId);
    if (result.success && result.conversation) {
      setIsGroup(result.conversation.isGroup);
      setMembers(
        result.conversation.participants
          .filter((p) => p.userId !== currentUserId)
          .map((p) => p.user)
      );
    }
  };

  const headerTitle = isGroup
    ? groupName || members.map((m) => m.name).join(', ')
    : members[0]?.name || 'Chat';

  // The viewer is always "online" while looking at the page; other senders
  // use their tracked presence from `members`.
  const presenceBySenderId: Record<string, 'online' | 'offline'> = { [currentUserId]: 'online' };
  members.forEach((m) => {
    if (m.presence) presenceBySenderId[m.id] = m.presence;
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading messages...</p>
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
              href="/collab"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 shadow-2xs transition-all active:scale-[0.98]"
              aria-label="Back to Collab"
            >
              <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
            </Link>
            {isGroup ? (
              <div className="w-9 h-9 rounded-xl bg-[#458B9E] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-4 h-4 text-white" />
              </div>
            ) : (
              members[0] && (
                <UserAvatar
                  userId={members[0].id}
                  name={members[0].name}
                  avatarUrl={members[0].avatar}
                  size="md"
                  presence={members[0].presence}
                />
              )
            )}
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 text-sm sm:text-base truncate tracking-tight">{headerTitle}</p>
              {isGroup ? (
                <p className="text-[11px] font-semibold text-slate-500">{members.length + 1} members</p>
              ) : (
                members[0]?.presence && (
                  <p className="text-[11px] font-bold text-slate-500">{PRESENCE_LABEL[members[0].presence]}</p>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAgreementOpen(true)}
              className="bg-white text-slate-700 hover:bg-slate-50 hover:text-[#458B9E] border border-slate-200/80 shadow-2xs rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-[#458B9E]" />
              <span><span className="sm:hidden">Agreement</span><span className="hidden sm:inline">New Agreement</span></span>
            </Button>

            <div className="relative shrink-0" ref={callButtonRef}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!isDurationMenuOpen && callButtonRef.current) {
                    const rect = callButtonRef.current.getBoundingClientRect();
                    const menuWidth = 160;
                    const left = Math.min(
                      Math.max(rect.left + rect.width / 2 - menuWidth / 2, 8),
                      window.innerWidth - menuWidth - 8
                    );
                    setDurationMenuPos({ top: rect.bottom + 6, left });
                  }
                  setIsDurationMenuOpen((v) => !v);
                }}
                className="bg-white text-slate-700 hover:bg-slate-50 hover:text-[#458B9E] border border-slate-200/80 shadow-2xs rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 whitespace-nowrap"
              >
                <Video className="w-3.5 h-3.5 mr-1.5 text-[#458B9E]" />
                <span><span className="sm:hidden">Call</span><span className="hidden sm:inline">Start Call</span></span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
              </Button>
              {isDurationMenuOpen && durationMenuPos && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDurationMenuOpen(false)} />
                  <div
                    className="fixed w-40 bg-white rounded-xl shadow-md border border-slate-200/90 py-1 z-50 text-center"
                    style={{ top: durationMenuPos.top, left: durationMenuPos.left }}
                  >
                    {CALL_DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setIsDurationMenuOpen(false);
                          startVideoCall(opt.seconds);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="bg-white text-slate-700 hover:bg-slate-50 hover:text-[#458B9E] border border-slate-200/80 shadow-2xs rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 whitespace-nowrap"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-[#458B9E]" />
              <span><span className="sm:hidden">History</span><span className="hidden sm:inline">Call History</span></span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-2xs rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span><span className="sm:hidden">Add</span><span className="hidden sm:inline">Add people</span></span>
            </Button>
          </div>
        </div>

        <BookingBanner conversationId={conversationId} currentUserId={currentUserId} />

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50/30">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-bold text-sm">No messages yet</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Start the conversation below!</p>
            </div>
          ) : (
            <div>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  currentUserName={session?.user?.name || 'Partner'}
                  onJoinCall={joinCallRoom}
                  onSendMessage={handleSendSpecialMessage}
                  onArchiveCall={handleArchiveCall}
                  onDeleteCall={handleDeleteCall}
                  agreementsById={agreementsById}
                  onSignAgreement={handleSignAgreement}
                  senderPresence={presenceBySenderId[message.senderId]}
                />
              ))}
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
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as any);
                }
              }}
              placeholder="Type a message..."
              style={{
                minHeight: '44px',
                maxHeight: '140px',
                resize: 'none',
              }}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-4 pr-12 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all shadow-2xs leading-relaxed block"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#458B9E] hover:bg-[#397484] disabled:opacity-40 text-white flex items-center justify-center shadow-xs transition-all active:scale-[0.95] cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      <AddParticipantsModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        currentUserId={currentUserId}
        excludeUserIds={[currentUserId, ...members.map((m) => m.id)]}
        onConfirm={handleAddParticipants}
      />

      <NewAgreementModal
        isOpen={isAgreementOpen}
        onClose={() => setIsAgreementOpen(false)}
        onCreate={handleCreateAgreement}
        members={members}
        isGroup={isGroup}
      />

      {/* LiveKit Calling Overlay Modal */}
      {activeCallRoom && liveKitToken && liveKitUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="oro-video-call bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-6xl h-[88vh] flex flex-col">
            <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between">
              <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
                <h3 className="font-semibold text-[#333333] flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5 text-[#458B9E] shrink-0" />
                  <span className="truncate text-sm sm:text-base">
                    <span className="sm:hidden">Video Call</span>
                    <span className="hidden sm:inline">Collaborative Video Call (Orochat)</span>
                  </span>
                </h3>
                {secondsLeft !== null && (
                  <span className="shrink-0 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {formatCountdown(secondsLeft)} left
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2 shrink-0">
                {isModerator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={endCallForEveryoneNow}
                    className="text-[#D32F2F] hover:bg-[#D32F2F]/10 font-semibold whitespace-nowrap px-2 sm:px-3"
                  >
                    <PhoneOff className="w-4 h-4 mr-1 sm:mr-1.5 shrink-0" />
                    <span className="hidden sm:inline">End Call for Everyone</span>
                    <span className="sm:hidden">End</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={endVideoCall}
                  className="text-gray-500 hover:bg-gray-200 font-semibold whitespace-nowrap px-2 sm:px-3"
                >
                  <PhoneOff className="w-4 h-4 mr-1 sm:mr-1.5 shrink-0" />
                  <span className="hidden sm:inline">Leave Call</span>
                  <span className="sm:hidden">Leave</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-black overflow-hidden relative">
              <LiveKitRoom
                video={true}
                audio={true}
                token={liveKitToken}
                serverUrl={liveKitUrl}
                data-lk-theme="default"
                style={{ height: '100%' }}
                onDisconnected={endVideoCall}
              >
                <VideoConference />
              </LiveKitRoom>
            </div>
          </div>
        </div>
      )}

      <CallHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversationId={conversationId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
