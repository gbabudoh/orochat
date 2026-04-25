import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import CommunityCard from '@/components/feature/Compass/CommunityCard';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import type { Compass } from '.prisma/client';

export default async function CompassPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  // Get all Compass communities
  const communities = await db.compass.findMany({
    include: {
      _count: {
        select: {
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Compass</h1>
        {user?.isPartner && (
          <Link href="/compass/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          </Link>
        )}
      </div>

      {communities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No communities yet</p>
          {user?.isPartner && (
            <Link href="/compass/create">
              <Button variant="accent">Create the first community</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community: Compass & { _count: { memberships: number } }) => (
            <CommunityCard key={community.id} compass={community} />
          ))}
        </div>
      )}
    </div>
  );
}

