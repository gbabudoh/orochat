import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import Link from 'next/link';
import { Users, MessageSquare, Calendar, ArrowLeft } from 'lucide-react';
import CommunityActions from '@/components/feature/Compass/CommunityActions';
import CommunityMembersButton from '@/components/feature/Compass/CommunityMembersButton';
import CommunityTabs from '@/components/feature/Compass/CommunityTabs';
import CommunityDiscussion from '@/components/feature/Compass/CommunityDiscussion';
import CreatePostCard from '@/components/feature/Feed/CreatePostCard';
import PostCard from '@/components/feature/Feed/PostCard';
import SponsoredPostCard from '@/components/feature/Feed/SponsoredPostCard';
import UserAvatar from '@/components/ui/UserAvatar';
import { getPostMeta } from '@/lib/feed/postMeta';
import { getPresenceMap } from '@/lib/presence.server';
import { formatDate } from '@/lib/utils/formatters';
import { selectAd } from '@/lib/ads/selectAd';
import { interleaveSponsored, AD_INTERVAL } from '@/lib/feed/interleaveSponsored';

export default async function CompassCommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const community = await db.compass.findUnique({
    where: { slug },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          memberships: true,
          posts: true,
        },
      },
    },
  });

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">Community not found</p>
          </div>
        </Card>
      </div>
    );
  }

  // Check if user is a member
  const membership = await db.compassMembership.findUnique({
    where: {
      userId_compassId: {
        userId: session.user.id,
        compassId: community.id,
      },
    },
  });

  const isMember = !!membership;

  // Get posts
  const posts = await db.feedPost.findMany({
    where: { compassId: community.id, archived: false, author: { isPaused: false } },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
          username: true,
          countryCode: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const postIds = posts.map((p) => p.id);
  const { likedPostIds, commentsByPostId } = await getPostMeta(postIds, session.user.id);
  const presenceByUserId = await getPresenceMap(posts.map((p) => p.author.id));
  const postsWithPresence = posts.map((post) => ({
    ...post,
    author: { ...post.author, presence: presenceByUserId[post.author.id] },
  }));

  const ad = await selectAd({ surface: 'COMPASS', compassId: community.id });
  const entries = interleaveSponsored(postsWithPresence, ad, AD_INTERVAL, 0);

  const postsPanel = (
    <div>
      {isMember && (
        <CreatePostCard
          userName={session.user.name ?? ''}
          userAvatar={`/api/user/${session.user.id}/avatar`}
          compassId={community.id}
        />
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No posts yet</p>
              {isMember && <p className="text-sm text-gray-400 mt-2">Be the first to share something with this community</p>}
            </div>
          </Card>
        ) : (
          entries.map((entry, index) =>
            entry.kind === 'post' ? (
              <PostCard
                key={entry.post.id}
                post={entry.post}
                index={index}
                isLiked={likedPostIds.has(entry.post.id)}
                comments={commentsByPostId[entry.post.id] || []}
                currentUserId={session.user.id}
              />
            ) : (
              <SponsoredPostCard key={`ad-${entry.ad.id}-${index}`} ad={entry.ad} index={index} compassId={community.id} />
            )
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0 px-2.5 sm:px-6 py-4 sm:py-6 space-y-4">
      <div>
        <Link
          href="/compass"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
          <span>Back to Compass</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 lg:p-8 mb-6 overflow-hidden">
        {community.image && (
          <div className="relative w-full h-44 sm:h-52 -mx-4 -mt-4 mb-5 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
            <Image src={community.image} alt={community.name} fill className="object-cover" />
          </div>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 mb-2 leading-tight tracking-tight">
          {community.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mb-4 leading-relaxed">{community.description}</p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 font-medium mb-4">
          <div className="flex items-center gap-2">
            <UserAvatar userId={community.creator.id} name={community.creator.name} avatarUrl={community.creator.avatar} size="sm" />
            <span>
              Created by <span className="font-bold text-slate-800">{community.creator.name}</span>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-400 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(community.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-600">
          <div className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-bold">
            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{community._count.memberships} members</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-bold">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{community._count.posts} posts</span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {!isMember && <CommunityActions compassId={community.id} isMember={false} />}
          {isMember && (
            <CommunityMembersButton
              compassId={community.id}
              currentUserId={session.user.id}
              memberCount={community._count.memberships}
            />
          )}
        </div>
      </div>

      {isMember ? (
        <CommunityTabs
          postsPanel={postsPanel}
          discussionPanel={<CommunityDiscussion compassId={community.id} currentUserId={session.user.id} />}
        />
      ) : (
        postsPanel
      )}
    </div>
  );
}
