'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { getMessages } from '@/features/collab/actions';
import { sendMessage } from '@/features/collab/actions';
import MessageBubble from '@/components/feature/Collab/MessageBubble';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Send } from 'lucide-react';
import { subscribeToChat } from '@/services/realtime.service';
import { ChatMessage } from '@/types/chat';

export default function ChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const oroId = params.oroId as string;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id || !oroId) return;

    const loadMessages = async () => {
      try {
        const result = await getMessages(session.user.id, oroId);
        if (Array.isArray(result)) {
          setMessages(result);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToChat(session.user.id, oroId, (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session?.user?.id, oroId]);

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
      formData.append('receiverId', oroId);

      const result = await sendMessage(session?.user?.id || '', formData);
      if (result.success && result.message) {
        setMessages((prev) => [...prev, result.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

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
                  currentUserId={session?.user?.id || ''}
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
    </div>
  );
}

