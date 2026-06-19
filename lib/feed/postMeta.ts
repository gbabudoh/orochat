import { db } from '@/lib/db';

export interface FeedCommentMeta {
  id: string;
  postId: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string; avatar: string | null };
}

// Likes/comments were added after the initial Prisma migration on this project,
// so the generated client types lag behind — bypass with a narrow extended type.
type ExtendedPrisma = typeof db & {
  postLike: {
    findMany: (args: {
      where: { userId: string; postId: { in: string[] } };
      select: { postId: true };
    }) => Promise<{ postId: string }[]>;
  };
  postComment: {
    findMany: (args: unknown) => Promise<unknown[]>;
  };
};

export async function getPostMeta(postIds: string[], userId: string) {
  const xdb = db as unknown as ExtendedPrisma;
  const likedPostIds = new Set<string>();
  let commentsByPostId: Record<string, FeedCommentMeta[]> = {};

  if (postIds.length === 0) {
    return { likedPostIds, commentsByPostId };
  }

  try {
    const likes = await xdb.postLike.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    likes.forEach((l) => likedPostIds.add(l.postId));
  } catch (err) {
    console.error('Error fetching likes:', err);
  }

  try {
    const allComments = (await xdb.postComment.findMany({
      where: { postId: { in: postIds } },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    })) as FeedCommentMeta[];

    commentsByPostId = allComments.reduce((acc, comment) => {
      if (!acc[comment.postId]) acc[comment.postId] = [];
      acc[comment.postId].push(comment);
      return acc;
    }, {} as Record<string, FeedCommentMeta[]>);
  } catch (err) {
    console.error('Error fetching comments:', err);
  }

  return { likedPostIds, commentsByPostId };
}
