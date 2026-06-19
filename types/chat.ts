export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
    title?: string | null;
  };
}
