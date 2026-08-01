import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSlate } from '@/features/oroslate/actions';
import NestWorkspace from '@/components/feature/Nest/NestWorkspace';
import TrialBanner from '@/components/feature/Oroslate/TrialBanner';
import Card from '@/components/ui/Card';
import { TIER_LIMITS } from '@/lib/oroslate/tiers';

export default async function SlatePage({ params }: { params: Promise<{ slateId: string }> }) {
  const { slateId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const result = await getSlate(slateId, session.user.id);

  if (!result.success || !result.nest || !result.organization) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{result.error || "You're not a member of this Slate."}</p>
          </div>
        </Card>
      </div>
    );
  }

  const { nest, organization } = result;
  const subscription = organization.subscription;
  const isTrialing = subscription?.status === 'TRIALING';
  const isLocked = isTrialing && subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) < new Date() : false;
  const tier = subscription?.tier ?? 'STARTER';

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#458B9E]/10 text-[#458B9E]">
          {isTrialing ? 'Pro Trial' : TIER_LIMITS[tier].label}
        </span>
      </div>

      {subscription?.trialEndsAt && isTrialing && (
        <TrialBanner organizationId={organization.id} trialEndsAt={subscription.trialEndsAt} />
      )}

      {isLocked ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-700 font-medium mb-2">This Slate is locked.</p>
            <p className="text-sm text-gray-500">
              Your team&apos;s chat history, boards, and notes are safe, but access is paused until the
              organization upgrades to a paid plan.
            </p>
          </div>
        </Card>
      ) : (
        <NestWorkspace
          nestId={nest.id}
          nestName={nest.name}
          ownerId={nest.ownerId}
          conversationId={nest.conversationId}
          members={nest.members.map((m) => m.user)}
          currentUserId={session.user.id}
          archived={nest.archived}
          expiresAt={nest.expiresAt}
          backHref={`/oroslate/org/${organization.id}`}
          backLabel={organization.name}
        />
      )}
    </div>
  );
}
