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
    <div className="max-w-6xl mx-auto w-full min-w-0 px-2.5 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shadow-2xs">
              <CompassIcon className="w-5 h-5 text-[#458B9E]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Compass Communities</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Discover and join professional communities, interest groups, and technical circles.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-center">
          <CompassHeaderGuide />
          {user?.isPartner && (
            <Link href="/compass/create">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 text-white/90 shrink-0" />
                <span>Create Community</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {communities.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 w-full max-w-full sm:max-w-2xl mx-auto px-4 py-8 sm:p-10 lg:p-12 text-center my-1">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <CompassIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#458B9E]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
            No Communities Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed font-medium">
            Be the pioneer to launch a professional community on Compass. Connect with like-minded software engineers and creators.
          </p>

          {user?.isPartner && (
            <div className="flex justify-center">
              <Link href="/compass/create">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-white/90 shrink-0" />
                  <span>Create the First Community</span>
                </button>
              </Link>
            </div>
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
