import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNests } from '@/features/nest/actions';
import NestList from '@/components/feature/Nest/NestList';

export default async function NestPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const nests = await getNests(session.user.id);

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6">
      <NestList currentUserId={session.user.id} initialNests={nests} />
    </div>
  );
}
