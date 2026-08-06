import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getOrCreateDirectConversation } from '@/features/collab/actions';
import ChatRoom from '@/components/feature/Collab/ChatRoom';
import Card from '@/components/ui/Card';

export default async function CollabConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // `id` may be an existing conversation, or (for legacy/profile "Message" links)
  // a target userId — resolve to a real conversation either way.
  const existingParticipant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: session.user.id } },
  });

  if (existingParticipant) {
    return <ChatRoom conversationId={id} currentUserId={session.user.id} />;
  }

  const conversationExists = await db.conversation.findUnique({ where: { id } });
  if (conversationExists) {
    // Conversation exists but the current user isn't a participant
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">You&apos;re not a member of this conversation.</p>
          </div>
        </Card>
      </div>
    );
  }

  const result = await getOrCreateDirectConversation(session.user.id, id);
  if (result.error || !result.conversationId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{result.error || 'Unable to start this conversation.'}</p>
          </div>
        </Card>
      </div>
    );
  }

  redirect(`/collab/${result.conversationId}`);
}
