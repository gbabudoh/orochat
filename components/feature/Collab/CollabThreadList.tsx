'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRelativeTime, formatCompactDate, formatMessagePreview } from '@/lib/utils/formatters';
import {
  MessageSquare,
  Users,
  Search,
  X,
  UserPlus,
  Compass,
  Video,
  Phone,
  Loader2,
  Building,
} from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import Button from '@/components/ui/Button';
import { getOrCreateDirectConversation } from '@/features/collab/actions';

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
  presence?: 'online' | 'offline';
}

interface Conversation {
  conversationId: string;
  isGroup: boolean;
  name: string | null;
  createdAt: Date | string;
  otherParticipants: Member[];
  latestMessage?: {
    content: string;
    createdAt: Date | string;
    sender: { name: string };
  } | null;
  unreadCount: number;
}

interface SearchedOro {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  title: string | null;
  company: string | null;
  presence: 'online' | 'offline';
  isConnected: boolean;
  existingConversationId: string | null;
}

interface CollabThreadListProps {
  conversations: Conversation[];
  currentUserId: string;
}

export default function CollabThreadList({ conversations, currentUserId }: CollabThreadListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'direct' | 'group'>('all');
  const [searchedOros, setSearchedOros] = useState<SearchedOro[]>([]);
  const [isSearchingOros, setIsSearchingOros] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Perform live server search for Oros when typing query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedOros([]);
      setIsSearchingOros(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOros(true);
      try {
        const response = await fetch(`/api/collab/search-oros?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await response.json();
        if (data.success) {
          setSearchedOros(data.oros || []);
        }
      } catch (error) {
        console.error('Failed to search Oros:', error);
      } finally {
        setIsSearchingOros(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartChat = async (oro: SearchedOro) => {
    if (oro.existingConversationId) {
      router.push(`/collab/${oro.existingConversationId}`);
      return;
    }

    setActionLoadingId(`${oro.id}-chat`);
    try {
      // Find or create conversation
      const res = await getOrCreateDirectConversation(currentUserId, oro.id);
      if (res.success && res.conversationId) {
        router.push(`/collab/${res.conversationId}`);
      } else {
        alert(res.error || 'Unable to start chat thread');
      }
    } catch {
      alert('Failed to initiate conversation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartCall = async (oro: SearchedOro, callType: 'video' | 'voice') => {
    setActionLoadingId(`${oro.id}-${callType}`);
    try {
      if (oro.existingConversationId) {
        router.push(`/collab/${oro.existingConversationId}?autoCall=${callType}`);
        return;
      }

      const res = await getOrCreateDirectConversation(currentUserId, oro.id);
      if (res.success && res.conversationId) {
        router.push(`/collab/${res.conversationId}?autoCall=${callType}`);
      } else {
        alert(res.error || 'Unable to start call');
      }
    } catch {
      alert('Failed to initiate call');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (tabFilter === 'direct' && c.isGroup) return false;
    if (tabFilter === 'group' && !c.isGroup) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const groupName = c.name?.toLowerCase() || '';
    const participantNames = c.otherParticipants.map((p) => p.name.toLowerCase()).join(' ');

    return groupName.includes(query) || participantNames.includes(query);
  });

  const directCount = conversations.filter((c) => !c.isGroup).length;
  const groupCount = conversations.filter((c) => c.isGroup).length;

  return (
    <div className="space-y-5">
      {/* Search & Filter Controls Header Area */}
      <div className="space-y-3">
        {/* Search Input Box */}
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or find Oros by name, title, or company..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/90 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs sm:text-sm transition-all outline-none bg-slate-50/60 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium shadow-2xs truncate"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Enterprise Segmented Filter Tabs */}
        <div className="bg-slate-100/90 p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto scrollbar-none snap-x border border-slate-200/60 max-w-full">
          <button
            type="button"
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 shrink-0 snap-start select-none ${
              tabFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>All Chats</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md min-w-[18px] text-center transition-colors ${
                tabFilter === 'all'
                  ? 'bg-[#458B9E]/15 text-[#458B9E]'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {conversations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 shrink-0 snap-start select-none ${
              tabFilter === 'direct'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Direct 1-on-1</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md min-w-[18px] text-center transition-colors ${
                tabFilter === 'direct'
                  ? 'bg-[#458B9E]/15 text-[#458B9E]'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {directCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('group')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 shrink-0 snap-start select-none ${
              tabFilter === 'group'
                ? 'bg-white text-purple-950 shadow-xs border border-purple-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>Group Threads</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md min-w-[18px] text-center transition-colors ${
                tabFilter === 'group'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {groupCount}
            </span>
          </button>
        </div>
      </div>

      {/* Searched Oros Directory Section (shown when user types in search box) */}
      {searchQuery.trim() !== '' && (
        <div className="bg-gray-50/70 border border-gray-200/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#458B9E]" />
              <span>Oros Network Directory ({searchedOros.length})</span>
            </h3>
            {isSearchingOros && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#458B9E]" /> Searching...
              </span>
            )}
          </div>

          {searchedOros.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchedOros.map((oro) => (
                <div
                  key={oro.id}
                  className="p-3.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between gap-3 hover:border-[#458B9E]/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      userId={oro.id}
                      name={oro.name}
                      avatarUrl={oro.avatar}
                      size="md"
                      presence={oro.presence}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-900 truncate text-sm">{oro.name}</h4>
                        {oro.isConnected && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                            Oro
                          </span>
                        )}
                      </div>
                      {oro.title && <p className="text-xs text-gray-500 truncate">{oro.title}</p>}
                      {oro.company && (
                        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{oro.company}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Dock: Chat | Video Call | Voice Call */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                    {/* Chat Button */}
                    <button
                      type="button"
                      onClick={() => handleStartChat(oro)}
                      disabled={actionLoadingId === `${oro.id}-chat`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-[#458B9E]/10 text-[#458B9E] hover:bg-[#458B9E] hover:text-white transition-all cursor-pointer border border-[#458B9E]/20"
                    >
                      {actionLoadingId === `${oro.id}-chat` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      <span>Chat</span>
                    </button>

                    {/* Video Call Button */}
                    <button
                      type="button"
                      onClick={() => handleStartCall(oro, 'video')}
                      disabled={actionLoadingId === `${oro.id}-video`}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer border border-emerald-200/80"
                      title="Start 1-on-1 Video Call"
                    >
                      {actionLoadingId === `${oro.id}-video` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Video className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Video Call</span>
                    </button>

                    {/* Voice Call Button */}
                    <button
                      type="button"
                      onClick={() => handleStartCall(oro, 'voice')}
                      disabled={actionLoadingId === `${oro.id}-voice`}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white transition-all cursor-pointer border border-purple-200/80"
                      title="Start Voice Call"
                    >
                      {actionLoadingId === `${oro.id}-voice` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Phone className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Voice Call</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isSearchingOros && (
              <p className="text-xs text-gray-500 italic py-2 text-center">
                No matching Oros found in directory for &quot;{searchQuery}&quot;.
              </p>
            )
          )}
        </div>
      )}

      {/* Conversations List Header */}
      {searchQuery.trim() !== '' && (
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 pt-1">
          <MessageSquare className="w-4 h-4 text-[#458B9E]" />
          <span>Active Conversation Threads ({filteredConversations.length})</span>
        </h3>
      )}

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <div className="space-y-1">
          {filteredConversations.map((conversation) => {
            const title = conversation.isGroup
              ? conversation.name || conversation.otherParticipants.map((m) => m.name).join(', ')
              : conversation.otherParticipants[0]?.name || 'Conversation';
            const subtitle = conversation.isGroup
              ? `${conversation.otherParticipants.length + 1} members`
              : conversation.otherParticipants[0]?.title;

            return (
              <Link
                key={conversation.conversationId}
                href={`/collab/${conversation.conversationId}`}
                className="flex items-center gap-3.5 py-3 px-3.5 rounded-2xl hover:bg-slate-50 active:bg-slate-100/80 transition-all group border border-transparent hover:border-slate-200/60"
              >
                {conversation.isGroup ? (
                  <div className="w-11 h-11 rounded-2xl bg-purple-50/90 border border-purple-200/80 text-purple-700 flex items-center justify-center shrink-0 font-bold shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <UserAvatar
                    userId={conversation.otherParticipants[0]?.id || ''}
                    name={title}
                    avatarUrl={conversation.otherParticipants[0]?.avatar}
                    size="lg"
                    presence={conversation.otherParticipants[0]?.presence}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className="font-bold text-slate-900 group-hover:text-[#458B9E] transition-colors truncate text-sm sm:text-[15px]">
                      {title}
                    </h3>
                    <span className="text-[10px] sm:text-xs text-slate-500 shrink-0 font-semibold tracking-tight bg-slate-100/90 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {formatCompactDate(
                        conversation.latestMessage?.createdAt ?? conversation.createdAt
                      )}
                    </span>
                  </div>

                  {subtitle && (
                    <p className="text-xs text-slate-500 truncate mb-0.5 font-medium">{subtitle}</p>
                  )}

                  {conversation.latestMessage && (
                    <p className="text-xs text-slate-600 truncate leading-snug">
                      {conversation.isGroup && (
                        <span className="font-semibold text-slate-800">
                          {conversation.latestMessage.sender.name}:{' '}
                        </span>
                      )}
                      {formatMessagePreview(conversation.latestMessage.content)}
                    </p>
                  )}
                </div>

                {conversation.unreadCount > 0 && (
                  <div className="bg-[#458B9E] text-white text-[11px] font-extrabold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 text-[#458B9E] flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>

          <div className="max-w-sm space-y-1">
            <h3 className="text-base font-bold text-gray-900">
              {conversations.length === 0 ? 'No conversations yet' : 'No matching active chats'}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {conversations.length === 0
                ? 'Start typing an Oro name in the search box above to chat, video call, or voice call!'
                : 'Try checking the Oros Network Directory results above or clear your search query.'}
            </p>
          </div>

          {conversations.length === 0 && (
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <Link href="/oro/discover">
                <Button size="sm" className="rounded-full text-xs px-4 py-2 bg-[#458B9E] hover:bg-[#387383]">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  <span>Find Oros to Message</span>
                </Button>
              </Link>
              <Link href="/compass">
                <Button size="sm" variant="secondary" className="rounded-full text-xs px-4 py-2">
                  <Compass className="w-4 h-4 mr-1.5 text-[#458B9E]" />
                  <span>Explore Compass</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
