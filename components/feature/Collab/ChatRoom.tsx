'use client';

import { useEffect, useRef, useState } from 'react';
import { getMessages, getConversation, sendMessage, addParticipants, startCall, endCallForEveryone, enforceCallDurationCutoff, archiveCallSession, deleteCallSession, deleteMessage } from '@/features/collab/actions';
import { createAgreement, signAgreement, getAgreementsByIds } from '@/features/collab/agreement-actions';
import MessageBubble from '@/components/feature/Collab/MessageBubble';
import AddParticipantsModal from '@/components/feature/Collab/AddParticipantsModal';
import NewAgreementModal from '@/components/feature/Collab/NewAgreementModal';
import CallHistoryModal from '@/components/feature/Collab/CallHistoryModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UserAvatar from '@/components/ui/UserAvatar';
import { Send, UserPlus, Users, Video, PhoneOff, FileText, ChevronDown, History, ArrowLeft } from 'lucide-react';
import { ChatMessage, AgreementData, AGREEMENT_MESSAGE_PREFIX } from '@/types/chat';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const hasFiredCutoff = useRef(false);

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
        console.error('Failed to get LiveKit token:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch LiveKit token:', err);
    }
  };

  const startVideoCall = async (durationSeconds?: number) => {
    setIsDurationMenuOpen(false);
    const result = await startCall(conversationId, currentUserId, durationSeconds);
    if (!('success' in result) || !result.success) {
      console.error('Failed to start call:', 'error' in result ? result.error : undefined);
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/collab"
              className="shrink-0 p-1.5 -ml-1.5 rounded-full text-gray-500 hover:text-[#458B9E] hover:bg-[#F0F3F7] transition-colors"
              aria-label="Back to Collab"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {isGroup ? (
              <div className="w-9 h-9 rounded-full bg-[#458B9E] flex items-center justify-center shrink-0">
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
              <p className="font-semibold text-[#333333] truncate">{headerTitle}</p>
              {isGroup ? (
                <p className="text-xs text-gray-500">{members.length + 1} members</p>
              ) : (
                members[0]?.presence && (
                  <p className="text-xs text-gray-500">{PRESENCE_LABEL[members[0].presence]}</p>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F8FAFB] sm:bg-transparent rounded-full sm:rounded-none p-1 sm:p-0">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAgreementOpen(true)} className="text-[#458B9E] hover:text-[#3a7585] hover:bg-white shrink-0 whitespace-nowrap p-2! sm:px-3! sm:py-1.5!">
              <FileText className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Agreement</span>
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
                className="text-[#458B9E] hover:text-[#3a7585] hover:bg-white whitespace-nowrap p-2! sm:px-3! sm:py-1.5!"
              >
                <Video className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Start Call</span>
                <ChevronDown className="w-3.5 h-3.5 sm:ml-1" />
              </Button>
              {isDurationMenuOpen && durationMenuPos && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDurationMenuOpen(false)} />
                  <div
                    className="fixed w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 text-center"
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
                        className="w-full px-3 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsHistoryOpen(true)} className="text-[#458B9E] hover:text-[#3a7585] hover:bg-white shrink-0 whitespace-nowrap p-2! sm:px-3! sm:py-1.5!">
              <History className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Call History</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(true)} className="hover:bg-white shrink-0 whitespace-nowrap p-2! sm:px-3! sm:py-1.5!">
              <UserPlus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Add people</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-2">Start the conversation!</p>
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
        <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
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
              <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                {isModerator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={endCallForEveryoneNow}
                    className="text-[#D32F2F] hover:bg-[#D32F2F]/10 font-semibold whitespace-nowrap px-2 sm:px-3"
                  >
                    <PhoneOff className="w-4 h-4 sm:mr-1.5 shrink-0" />
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
                  <PhoneOff className="w-4 h-4 sm:mr-1.5 shrink-0" />
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
