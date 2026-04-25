import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConversations } from '@/features/collab/actions';
import CollabThreadList from '@/components/feature/Collab/CollabThreadList';

export default async function CollabPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const conversations = await getConversations(session.user.id);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Collab</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <CollabThreadList conversations={conversations} currentUserId={session.user.id} />
      </div>
    </div>
  );
}

