import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNest } from '@/features/nest/actions';
import NestWorkspace from '@/components/feature/Nest/NestWorkspace';
import Card from '@/components/ui/Card';

export default async function NestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const result = await getNest(id, session.user.id);

  if (!result.success || !result.nest) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">{result.error || 'You&apos;re not a member of this Nest.'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <NestWorkspace
      nestId={result.nest.id}
      nestName={result.nest.name}
      ownerId={result.nest.ownerId}
      conversationId={result.nest.conversationId}
      members={result.nest.members.map((m) => m.user)}
      currentUserId={session.user.id}
    />
  );
}
