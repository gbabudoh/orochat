import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { getOrganization } from '@/features/oroslate/actions';
import UpgradePlans from '@/components/feature/Oroslate/UpgradePlans';
import Card from '@/components/ui/Card';

export default async function UpgradePage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const result = await getOrganization(organizationId, session.user.id);

  if (!result.success || !result.organization) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{result.error || "You're not a member of this organization."}</p>
          </div>
        </Card>
      </div>
    );
  }

  const { organization } = result;
  const seatCount = organization.members.filter((m) => !m.isExternalOro).length;

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-6 sm:py-10">
      <Link
        href={`/oroslate/org/${organization.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#458B9E] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Back to {organization.name}
      </Link>

      <UpgradePlans
        organizationId={organization.id}
        currentUserId={session.user.id}
        currentTier={organization.subscription?.tier ?? 'STARTER'}
        currentStatus={organization.subscription?.status ?? 'TRIALING'}
        currentSeatCount={seatCount}
      />
    </div>
  );
}
