import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrganizationsForUser } from '@/features/oroslate/actions';
import OrganizationList from '@/components/feature/Oroslate/OrganizationList';

export default async function OroslatePage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const organizations = await getOrganizationsForUser(session.user.id);

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-2.5 sm:px-6 py-4 sm:py-8">
      <OrganizationList currentUserId={session.user.id} organizations={organizations} referralRef={ref} />
    </div>
  );
}

