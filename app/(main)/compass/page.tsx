import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import CommunityCard from '@/components/feature/Compass/CommunityCard';
import CompassHeaderGuide from '@/components/feature/Compass/CompassHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { Plus, Compass as CompassIcon, Sparkles } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">Compass Communities</h1>
            <HelpTooltip
              title="Compass Communities Guide"
              description="Discover, join, and lead professional technical circles and interest groups."
              tips={[
                'Click Join to become a member of any community.',
                'Community members gain access to dedicated feeds & rosters.',
                'Partners can launch custom Compass communities.',
              ]}
            />
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Discover and join professional communities, interest groups, and technical circles.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <CompassHeaderGuide />
          {user?.isPartner && (
            <Link href="/compass/create">
              <Button className="rounded-full gap-1.5 whitespace-nowrap px-4 bg-[#458B9E] hover:bg-[#387383]">
                <Plus className="w-4 h-4 shrink-0" />
                <span>Create Community</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {communities.length === 0 ? (
        <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-2xl shadow-sm border border-gray-200/90 p-6 sm:p-10 lg:p-12 text-center max-w-2xl mx-auto my-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#458B9E]/20">
            <CompassIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Communities Yet</h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
            Be the pioneer to launch a professional community on Compass. Connect with like-minded software engineers and creators.
          </p>
          {user?.isPartner && (
            <Link href="/compass/create">
              <Button variant="accent" className="rounded-full px-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Create the First Community
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community: Compass & { _count: { memberships: number } }) => (
            <CommunityCard key={community.id} compass={community} />
          ))}
        </div>
      )}
    </div>
  );
}
