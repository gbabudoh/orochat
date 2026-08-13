import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { assertDirectNoteParticipant } from '@/features/dn/actions';
import DirectNoteThread from '@/components/feature/DN/DirectNoteThread';
import Card from '@/components/ui/Card';

export default async function DirectNoteThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let thread;
  try {
    thread = await assertDirectNoteParticipant(id, session.user.id);
  } catch {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">This Direct Note doesn&apos;t exist or you&apos;re not part of it.</p>
          </div>
        </Card>
      </div>
    );
  }

  const otherUserId = thread.senderId === session.user.id ? thread.recipientId : thread.senderId;

  const [otherUser, connection] = await Promise.all([
    db.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, avatar: true, title: true, company: true },
    }),
    db.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: otherUserId, status: 'ACCEPTED' },
          { senderId: otherUserId, receiverId: session.user.id, status: 'ACCEPTED' },
        ],
      },
    }),
  ]);

  if (!otherUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">This Oro&apos;s profile is no longer available.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <DirectNoteThread
      threadId={id}
      currentUserId={session.user.id}
      otherUser={otherUser}
      isConnected={!!connection}
    />
  );
}
