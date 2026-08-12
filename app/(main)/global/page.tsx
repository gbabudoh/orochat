import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import PostCard from '@/components/feature/Feed/PostCard';
import SponsoredPostCard from '@/components/feature/Feed/SponsoredPostCard';
import GlobalFeedLoadMore from '@/components/feature/Feed/GlobalFeedLoadMore';
import GlobalFeedFilters from '@/components/feature/Feed/GlobalFeedFilters';
import GlobalPostComposer from '@/components/feature/Feed/GlobalPostComposer';
import GlobalHeaderGuide from '@/components/feature/Feed/GlobalHeaderGuide';
import { getPostMeta } from '@/lib/feed/postMeta';
import { getPresenceMap } from '@/lib/presence.server';
import { selectAd } from '@/lib/ads/selectAd';
import { interleaveSponsored, AD_INTERVAL } from '@/lib/feed/interleaveSponsored';
import { filterPostsByCategory } from '@/lib/feed/filterByCategory';
import { Globe, Compass, UserPlus } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 15;
const CATEGORY_CANDIDATE_WINDOW = 200;

export default async function GlobalFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; category?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { country, category } = await searchParams;

  const authorWhere: Prisma.UserWhereInput = { isPaused: false };
  if (country) authorWhere.countryCode = country.toUpperCase();

  const posts = await db.feedPost.findMany({
    where: { visibility: 'PUBLIC', archived: false, author: authorWhere },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
          username: true,
          countryCode: true,
          ...(category ? { embedding: true } : {}),
        },
      },
      compass: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: category ? CATEGORY_CANDIDATE_WINDOW : PAGE_SIZE,
  });

  const matchedPosts = category
    ? (
        await filterPostsByCategory(
          posts as Array<(typeof posts)[number] & { author: { embedding: number[] } }>,
          category
        )
      ).slice(0, PAGE_SIZE)
    : posts;

  const filteredPosts = matchedPosts.map((post) => {
    const { embedding: _embedding, ...author } = post.author as typeof post.author & {
      embedding?: number[];
    };
    return { ...post, author };
  });

  const postIds = filteredPosts.map((p) => p.id);
  const { likedPostIds, commentsByPostId } = await getPostMeta(postIds, session.user.id);
  const nextCursor =
    posts.length === (category ? CATEGORY_CANDIDATE_WINDOW : PAGE_SIZE)
      ? posts[posts.length - 1].id
      : null;

  const presenceByUserId = await getPresenceMap(filteredPosts.map((p) => p.author.id));
  const postsWithPresence = filteredPosts.map((post) => ({
    ...post,
    author: { ...post.author, presence: presenceByUserId[post.author.id] },
  }));

  const ad = await selectAd({ surface: 'GLOBAL' });
  const entries = interleaveSponsored(postsWithPresence, ad, AD_INTERVAL, 0);

  return (
    <div className="max-w-3xl mx-auto w-full min-w-0">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 shadow-2xs">
              <Globe className="w-5 h-5 text-[#458B9E]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Global Activity</h1>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Public activity, professional updates, and discussions from every Oro on the platform.
          </p>
        </div>

        <GlobalHeaderGuide />
      </div>

      {/* Global Post Composer */}
      <GlobalPostComposer
        user={{
          id: session.user.id,
          name: session.user.name,
          avatar: session.user.avatar,
        }}
      />

      {/* Global Feed Filters */}
      <GlobalFeedFilters />

      {/* Feed Posts */}
      {filteredPosts.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center bg-white shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 flex items-center justify-center mx-auto mb-4 text-[#458B9E] border border-[#458B9E]/20">
            <Globe className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1 tracking-tight">
            {country || category ? 'No matching global posts' : 'No public posts yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed font-medium">
            {country || category
              ? 'Try a different country or category filter above.'
              : 'Be the first to share a public update with the global network!'}
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/compass">
              <Button size="sm" variant="secondary" className="rounded-xl text-xs px-4 py-2 font-semibold shadow-2xs border border-slate-200">
                <Compass className="w-4 h-4 mr-1.5 text-[#458B9E]" />
                <span>Explore Compass</span>
              </Button>
            </Link>
            <Link href="/oro/discover">
              <Button size="sm" className="rounded-xl text-xs px-4 py-2 bg-[#458B9E] hover:bg-[#387383] font-semibold text-white shadow-2xs">
                <UserPlus className="w-4 h-4 mr-1.5" />
                <span>Discover Oros</span>
              </Button>
            </Link>
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

      {/* Infinite Load More */}
      <GlobalFeedLoadMore
        initialCursor={nextCursor}
        currentUserId={session.user.id}
        initialSeenCount={filteredPosts.length}
        country={country}
        category={category}
      />
    </div>
  );
}
