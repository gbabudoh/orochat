'use client';

import { useEffect, useRef, useState } from 'react';
import { getMessages, getConversation, sendMessage, addParticipants } from '@/features/collab/actions';
import MessageBubble from '@/components/feature/Collab/MessageBubble';
import AddParticipantsModal from '@/components/feature/Collab/AddParticipantsModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UserAvatar from '@/components/ui/UserAvatar';
import { Send, UserPlus, Users } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

const POLL_INTERVAL_MS = 3000;

interface Member {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
}

interface ChatRoomProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatRoom({ conversationId, currentUserId }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set());

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

    const poll = async () => {
      const result = await getMessages(conversationId, currentUserId);
      if (!active || !Array.isArray(result)) return;
      const fresh = result.filter((m) => !knownIds.current.has(m.id));
      if (fresh.length > 0 || knownIds.current.size === 0) {
        result.forEach((m) => knownIds.current.add(m.id));
        setMessages(result);
      }
      setIsLoading(false);
    };

    loadConversation();
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

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
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            {isGroup ? (
              <div className="w-9 h-9 rounded-full bg-[#458B9E] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
            ) : (
              members[0] && <UserAvatar userId={members[0].id} name={members[0].name} avatarUrl={members[0].avatar} size="md" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[#333333] truncate">{headerTitle}</p>
              {isGroup && <p className="text-xs text-gray-500">{members.length + 1} members</p>}
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add people
          </Button>
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
    </div>
  );
}
