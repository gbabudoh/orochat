import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLeaderCompasses, getAffiliateSummary } from '@/features/oroslate/affiliate-actions';
import AffiliatePortal from '@/components/feature/Oroslate/AffiliatePortal';

export default async function AffiliatePortalPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [compasses, summary] = await Promise.all([
    getLeaderCompasses(session.user.id),
    getAffiliateSummary(session.user.id),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return (
    <div className="max-w-5xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6">
      <AffiliatePortal currentUserId={session.user.id} compasses={compasses} summary={summary} baseUrl={baseUrl} />
    </div>
  );
}
