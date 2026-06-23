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
    <div className="max-w-4xl mx-auto">
      <Link
        href="/compass"
        className="flex sm:hidden items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#458B9E] mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Compass
      </Link>

      <Card padding="lg" className="mb-6 overflow-hidden">
        {community.image && (
          <div className="relative w-full h-40 -mx-6 -mt-6 mb-4 sm:-mx-8 sm:-mt-8">
            <Image src={community.image} alt={community.name} fill className="object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-[#333333] mb-2">{community.name}</h1>
        <p className="text-gray-600 mb-4">{community.description}</p>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <UserAvatar userId={community.creator.id} name={community.creator.name} avatarUrl={community.creator.avatar} size="sm" />
          <span>
            Created by <span className="font-medium text-[#333333]">{community.creator.name}</span>
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(community.createdAt)}
          </span>
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{community._count.memberships} members</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
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
      </Card>

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
