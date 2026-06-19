import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConversations } from '@/features/collab/actions';
import CollabThreadList from '@/components/feature/Collab/CollabThreadList';
import NewGroupButton from '@/components/feature/Collab/NewGroupButton';

export default async function CollabPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const conversations = await getConversations(session.user.id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Collab</h1>
        <NewGroupButton currentUserId={session.user.id} />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <CollabThreadList conversations={conversations} />
      </div>
    </div>
  );
}

