import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import PostCard from '@/components/feature/Feed/PostCard';
import SponsoredPostCard from '@/components/feature/Feed/SponsoredPostCard';
import GlobalFeedLoadMore from '@/components/feature/Feed/GlobalFeedLoadMore';
import { getPostMeta } from '@/lib/feed/postMeta';
import { getPresenceMap } from '@/lib/presence.server';
import { selectAd } from '@/lib/ads/selectAd';
import { interleaveSponsored, AD_INTERVAL } from '@/lib/feed/interleaveSponsored';
import { Globe } from 'lucide-react';

const PAGE_SIZE = 15;

export default async function GlobalFeedPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const posts = await db.feedPost.findMany({
    where: { visibility: 'PUBLIC', archived: false, author: { isPaused: false } },
    include: {
      author: {
        select: { id: true, name: true, avatar: true, title: true, username: true, countryCode: true },
      },
      compass: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
  });

  const postIds = posts.map((p) => p.id);
  const { likedPostIds, commentsByPostId } = await getPostMeta(postIds, session.user.id);
  const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null;

  const presenceByUserId = await getPresenceMap(posts.map((p) => p.author.id));
  const postsWithPresence = posts.map((post) => ({
    ...post,
    author: { ...post.author, presence: presenceByUserId[post.author.id] },
  }));

  const ad = await selectAd({ surface: 'GLOBAL' });
  const entries = interleaveSponsored(postsWithPresence, ad, AD_INTERVAL, 0);

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-0">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-1 md:mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#458B9E]/10">
            <Globe className="w-4 h-4 text-[#458B9E]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">Global</h1>
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Public activity from every Oro on the platform, wherever they are
        </p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#333333] mb-2">No public posts yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Posts marked &quot;Public&quot; from anyone on Orochat will show up here
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {entries.map((entry, index) =>
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
              <SponsoredPostCard key={`ad-${entry.ad.id}-${index}`} ad={entry.ad} index={index} />
            )
          )}
        </div>
      )}

      <GlobalFeedLoadMore initialCursor={nextCursor} currentUserId={session.user.id} initialSeenCount={posts.length} />
    </div>
  );
}
