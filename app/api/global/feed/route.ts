import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPostMeta } from '@/lib/feed/postMeta';
import { getPresenceMap } from '@/lib/presence.server';
import { selectAd } from '@/lib/ads/selectAd';
import { interleaveSponsored, AD_INTERVAL } from '@/lib/feed/interleaveSponsored';
import { filterPostsByCategory } from '@/lib/feed/filterByCategory';
import { Prisma } from '@prisma/client';

const PAGE_SIZE = 15;
// See app/(main)/global/page.tsx — category filtering is a semantic match in
// app code, so a larger candidate window is fetched up front when it's active.
const CATEGORY_CANDIDATE_WINDOW = 200;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') || undefined;
  const seenCount = Number(request.nextUrl.searchParams.get('seenCount') || 0);
  const country = request.nextUrl.searchParams.get('country') || undefined;
  const category = request.nextUrl.searchParams.get('category') || undefined;

  const authorWhere: Prisma.UserWhereInput = { isPaused: false };
  if (country) authorWhere.countryCode = country.toUpperCase();

  const posts = await db.feedPost.findMany({
    where: { visibility: 'PUBLIC', archived: false, author: authorWhere },
    include: {
      author: {
        select: {
          id: true, name: true, avatar: true, title: true, username: true, countryCode: true,
          ...(category ? { embedding: true } : {}),
        },
      },
      compass: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: category ? CATEGORY_CANDIDATE_WINDOW : PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const matchedPosts = category
    ? (await filterPostsByCategory(posts as Array<typeof posts[number] & { author: { embedding: number[] } }>, category)).slice(0, PAGE_SIZE)
    : posts;
  const filteredPosts = matchedPosts.map((post) => {
    const { embedding: _embedding, ...author } = post.author as typeof post.author & { embedding?: number[] };
    return { ...post, author };
  });

  const postIds = filteredPosts.map((p) => p.id);
  const { likedPostIds, commentsByPostId } = await getPostMeta(postIds, session.user.id);
  const presenceByUserId = await getPresenceMap(filteredPosts.map((p) => p.author.id));

  const postItems = filteredPosts.map((post) => ({
    post: { ...post, author: { ...post.author, presence: presenceByUserId[post.author.id] } },
    isLiked: likedPostIds.has(post.id),
    comments: commentsByPostId[post.id] || [],
  }));

  const ad = await selectAd({ surface: 'GLOBAL' });
  const entries = interleaveSponsored(postItems, ad, AD_INTERVAL, seenCount);

  const nextCursor = posts.length === (category ? CATEGORY_CANDIDATE_WINDOW : PAGE_SIZE) ? posts[posts.length - 1].id : null;

  return NextResponse.json({ success: true, entries, newPostCount: filteredPosts.length, nextCursor });
}
