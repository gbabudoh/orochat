'use client';

import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { MessageSquare } from 'lucide-react';

interface Conversation {
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    title?: string | null;
  };
  latestMessage?: {
    content: string;
    createdAt: Date | string;
  } | null;
  unreadCount: number;
}

interface CollabThreadListProps {
  conversations: Conversation[];
  currentUserId: string;
}

export default function CollabThreadList({ conversations, currentUserId }: CollabThreadListProps) {
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
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <Link
          key={conversation.userId}
          href={`/collab/${conversation.userId}`}
          className="flex items-center space-x-3 p-4 rounded-lg hover:bg-[#F0F3F7] transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[#458B9E] flex items-center justify-center flex-shrink-0">
            {conversation.user.avatar ? (
              <img
                src={conversation.user.avatar}
                alt={conversation.user.name}
                className="w-full h-full rounded-full"
              />
            ) : (
              <span className="text-white font-semibold">
                {conversation.user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-[#333333] truncate">{conversation.user.name}</h3>
              {conversation.latestMessage && (
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatRelativeTime(conversation.latestMessage.createdAt)}
                </span>
              )}
            </div>
            {conversation.user.title && (
              <p className="text-sm text-gray-500 truncate mb-1">{conversation.user.title}</p>
            )}
            {conversation.latestMessage && (
              <p className="text-sm text-gray-600 truncate">{conversation.latestMessage.content}</p>
            )}
          </div>
          {conversation.unreadCount > 0 && (
            <div className="bg-[#458B9E] text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

