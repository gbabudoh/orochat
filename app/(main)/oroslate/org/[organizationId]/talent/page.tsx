import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrganization } from '@/features/oroslate/actions';
import TalentSearchClient from '@/components/feature/Oroslate/TalentSearchClient';
import Card from '@/components/ui/Card';

export default async function TalentSearchPage({ params }: { params: Promise<{ organizationId: string }> }) {
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

  return (
    <TalentSearchClient
      organizationId={organizationId}
      organizationName={result.organization.name}
      currentUserId={session.user.id}
    />
  );
}
