'use client';

import Link from 'next/link';
import { formatRelativeTime, formatMessagePreview } from '@/lib/utils/formatters';
import { MessageSquare, Users } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';

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
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">No conversations yet</p>
        <p className="text-sm text-gray-400 mt-2">Start connecting with your Oros to begin messaging</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation) => {
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
            className="flex items-center gap-3 py-3 sm:py-4 px-2 sm:px-4 rounded-lg hover:bg-[#F0F3F7] active:bg-[#F0F3F7] transition-colors group"
          >
            {conversation.isGroup ? (
              <div className="w-10 h-10 rounded-full bg-[#458B9E] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
            ) : (
              <UserAvatar
                userId={conversation.otherParticipants[0]?.id || ''}
                name={title}
                avatarUrl={conversation.otherParticipants[0]?.avatar}
                size="md"
                presence={conversation.otherParticipants[0]?.presence}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <h3 className="font-semibold text-[#333333] truncate min-w-0">{title}</h3>
                <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">
                  {formatRelativeTime(conversation.latestMessage?.createdAt ?? conversation.createdAt)}
                </span>
              </div>
              {subtitle && (
                <p className="text-sm text-gray-500 truncate mb-0.5">{subtitle}</p>
              )}
              {conversation.latestMessage && (
                <p className="text-sm text-gray-600 truncate">
                  {conversation.isGroup && `${conversation.latestMessage.sender.name}: `}
                  {formatMessagePreview(conversation.latestMessage.content)}
                </p>
              )}
            </div>
            {conversation.unreadCount > 0 && (
              <div className="bg-[#458B9E] text-white text-xs font-semibold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
