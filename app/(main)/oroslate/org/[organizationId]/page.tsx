import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrganization, getSlatesForOrganization } from '@/features/oroslate/actions';
import OrgDashboard from '@/components/feature/Oroslate/OrgDashboard';
import Card from '@/components/ui/Card';

export default async function OrganizationPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Independent reads — run them in parallel instead of one-after-another so
  // the page isn't waiting on two sequential round trips to a remote DB.
  const [result, slates] = await Promise.all([
    getOrganization(organizationId, session.user.id),
    getSlatesForOrganization(organizationId, session.user.id),
  ]);

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
    <OrgDashboard currentUserId={session.user.id} organization={result.organization} slates={slates} />
  );
}
