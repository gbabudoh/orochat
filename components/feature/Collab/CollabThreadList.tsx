'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatRelativeTime, formatMessagePreview } from '@/lib/utils/formatters';
import { MessageSquare, Users, Search, X, UserPlus, Compass } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import Button from '@/components/ui/Button';

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

interface CollabThreadListProps {
  conversations: Conversation[];
}

export default function CollabThreadList({ conversations }: CollabThreadListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'direct' | 'group'>('all');

  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (tabFilter === 'direct' && c.isGroup) return false;
    if (tabFilter === 'group' && !c.isGroup) return false;

    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const groupName = c.name?.toLowerCase() || '';
    const participantNames = c.otherParticipants.map((p) => p.name.toLowerCase()).join(' ');

    return groupName.includes(query) || participantNames.includes(query);
  });

  const directCount = conversations.filter((c) => !c.isGroup).length;
  const groupCount = conversations.filter((c) => c.isGroup).length;

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Filter Tabs (rendered when conversations exist or search is active) */}
      {conversations.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setTabFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                tabFilter === 'all'
                  ? 'bg-[#458B9E] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Chats ({conversations.length})
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('direct')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                tabFilter === 'direct'
                  ? 'bg-[#458B9E] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Direct 1-on-1 ({directCount})
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('group')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                tabFilter === 'group'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Group Threads ({groupCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations by name…"
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <div className="divide-y divide-gray-100">
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
                className="flex items-center gap-3.5 py-3.5 px-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
              >
                {conversation.isGroup ? (
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 font-bold">
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
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 group-hover:text-[#458B9E] transition-colors truncate text-sm sm:text-base">
                      {title}
                    </h3>
                    <span className="text-xs text-gray-400 shrink-0 font-medium">
                      {formatRelativeTime(
                        conversation.latestMessage?.createdAt ?? conversation.createdAt
                      )}
                    </span>
                  </div>

                  {subtitle && (
                    <p className="text-xs text-gray-500 truncate mb-1">{subtitle}</p>
                  )}

                  {conversation.latestMessage && (
                    <p className="text-xs text-gray-600 truncate leading-snug">
                      {conversation.isGroup && (
                        <span className="font-semibold text-gray-800">
                          {conversation.latestMessage.sender.name}:{' '}
                        </span>
                      )}
                      {formatMessagePreview(conversation.latestMessage.content)}
                    </p>
                  )}
                </div>

                {conversation.unreadCount > 0 && (
                  <div className="bg-[#458B9E] text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0 shadow-xs">
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
              {conversations.length === 0 ? 'No conversations yet' : 'No matching chats found'}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {conversations.length === 0
                ? 'Start connecting with verified Oros or create a team group thread to begin messaging.'
                : 'Try clearing your search query or switching filter tabs.'}
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
