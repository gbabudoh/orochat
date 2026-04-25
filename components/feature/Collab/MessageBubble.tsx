'use client';

import { formatRelativeTime } from '@/lib/utils/formatters';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date | string;
    sender: {
      id: string;
      name: string;
      avatar?: string | null;
    };
  };
  currentUserId: string;
}

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwn = message.senderId === currentUserId;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-[#458B9E] flex items-center justify-center flex-shrink-0">
            {message.sender.avatar ? (
              <img src={message.sender.avatar} alt={message.sender.name} className="w-full h-full rounded-full" />
            ) : (
              <span className="text-white text-xs font-semibold">
                {message.sender.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        <div className={`rounded-lg px-4 py-2 ${isOwn ? 'bg-[#458B9E] text-white' : 'bg-[#F0F3F7] text-[#333333]'}`}>
          {!isOwn && (
            <div className="text-xs font-semibold mb-1 opacity-75">{message.sender.name}</div>
          )}
          <div className="text-sm">{message.content}</div>
          <div className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
            {formatRelativeTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

