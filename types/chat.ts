// 'use server' files can only export async functions, so this marker — used
// by both server actions and client components — lives in this plain shared
// module instead of features/collab/agreement-actions.ts.
export const AGREEMENT_MESSAGE_PREFIX = '📝 AGREEMENT:';

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

export interface AgreementSignerData {
  id: string;
  userId: string;
  signedAt: Date | string | null;
  publicKeyJwk: JsonWebKey | null;
  signature: string | null;
  user: { id: string; name: string; avatar: string | null };
}

export interface AgreementData {
  id: string;
  title: string;
  terms: string;
  initiatorId: string;
  initiatorKey: JsonWebKey;
  initiatorSignature: string;
  status: 'PENDING' | 'EXECUTED';
  initiator: { id: string; name: string; avatar: string | null };
  signers: AgreementSignerData[];
}
