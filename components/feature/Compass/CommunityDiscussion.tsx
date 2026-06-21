'use client';

import { useEffect, useRef, useState } from 'react';
import { getDiscussionMessages, postDiscussionMessage } from '@/features/compass/actions';
import UserAvatar from '@/components/ui/UserAvatar';
import Button from '@/components/ui/Button';
import { Send } from 'lucide-react';
import { formatPostDateTime } from '@/lib/utils/formatters';

const POLL_INTERVAL_MS = 3000;

interface DiscussionMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
  sender: { id: string; name: string; avatar: string | null };
}

interface CommunityDiscussionProps {
  compassId: string;
  currentUserId: string;
}

export default function CommunityDiscussion({ compassId, currentUserId }: CommunityDiscussionProps) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const poll = async () => {
      const result = await getDiscussionMessages(compassId, currentUserId);
      if (!active) return;
      if (result.success && result.messages) {
        const fresh = result.messages.filter((m) => !knownIds.current.has(m.id));
        if (fresh.length > 0 || knownIds.current.size === 0) {
          result.messages.forEach((m) => knownIds.current.add(m.id));
          setMessages(result.messages);
        }
      }
      setIsLoading(false);
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [compassId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    setError('');
    try {
      const result = await postDiscussionMessage(compassId, currentUserId, content);
      if (result.success && result.message) {
        knownIds.current.add(result.message.id);
        setMessages((prev) => [...prev, result.message]);
        setContent('');
      } else {
        setError(result.error || 'Failed to send message');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: '60vh' }}>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <p className="text-center text-gray-500 py-12">Loading discussion…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-2">Start the conversation with this community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <UserAvatar userId={message.sender.id} name={message.sender.name} avatarUrl={message.sender.avatar} size="sm" />
                    <div className={`rounded-lg px-3 py-2 ${isOwn ? 'bg-[#458B9E] text-white' : 'bg-[#F0F3F7] text-[#333333]'}`}>
                      {!isOwn && <p className="text-xs font-semibold mb-1 opacity-75">{message.sender.name}</p>}
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatPostDateTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-200 p-3 sm:p-4">
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Message this community..."
            maxLength={2000}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-[#333333] placeholder:text-gray-400 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all text-sm"
          />
          <Button type="submit" size="sm" isLoading={isSending} disabled={!content.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
