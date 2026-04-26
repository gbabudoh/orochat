export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}
