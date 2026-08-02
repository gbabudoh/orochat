import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConversations } from '@/features/collab/actions';
import CollabThreadList from '@/components/feature/Collab/CollabThreadList';
import NewGroupButton from '@/components/feature/Collab/NewGroupButton';
import CollabHeaderGuide from '@/components/feature/Collab/CollabHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { MessageSquare } from 'lucide-react';

export default async function CollabPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const conversations = await getConversations(session.user.id);

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[#458B9E]/10">
              <MessageSquare className="w-4 h-4 text-[#458B9E]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Collab Messaging</h1>
            <HelpTooltip
              title="Collab Messaging Guide"
              description="Real-time private 1-on-1 chat and team group conversations with your verified Oros."
              tips={[
                'Start 1-on-1 chats directly from My Oros or Explore.',
                'Click + New Group to start a multi-member team conversation.',
                'Live green pulse dots indicate online participants.',
              ]}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Real-time private messaging, group team discussions, and presence tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <CollabHeaderGuide />
          <NewGroupButton currentUserId={session.user.id} />
        </div>
      </div>

      {/* Conversations Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-2 sm:p-6">
        <CollabThreadList conversations={conversations} />
      </div>
    </div>
  );
}
