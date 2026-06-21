import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNests } from '@/features/nest/actions';
import NewNestButton from '@/components/feature/Nest/NewNestButton';
import NestCard from '@/components/feature/Nest/NestCard';

export default async function NestPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const nests = await getNests(session.user.id);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">OroNest</h1>
          <p className="text-sm text-gray-500 mt-1">Project workspaces for you and your Oros</p>
        </div>
        <NewNestButton currentUserId={session.user.id} />
      </div>

      {nests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No Nests yet</p>
          <NewNestButton currentUserId={session.user.id} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nests.map((nest) => (
            <NestCard key={nest.id} nest={nest} />
          ))}
        </div>
      )}
    </div>
  );
}
