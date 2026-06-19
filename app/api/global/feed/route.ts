import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPostMeta } from '@/lib/feed/postMeta';

const PAGE_SIZE = 15;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get('cursor') || undefined;

  const posts = await db.feedPost.findMany({
    where: { visibility: 'PUBLIC' },
    include: {
      author: {
        select: { id: true, name: true, avatar: true, title: true, username: true, countryCode: true },
      },
      compass: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const postIds = posts.map((p) => p.id);
  const { likedPostIds, commentsByPostId } = await getPostMeta(postIds, session.user.id);

  const items = posts.map((post) => ({
    post,
    isLiked: likedPostIds.has(post.id),
    comments: commentsByPostId[post.id] || [],
  }));

  const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null;

  return NextResponse.json({ success: true, items, nextCursor });
}
