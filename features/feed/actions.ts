'use server';

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { triggerNotification } from '@/lib/novu';

// Define a type-safe extended Prisma client to bypass stale types without using 'any'
type ExtendedPrisma = typeof db & {
  postLike: {
    findUnique: (args: { where: { postId_userId: { postId: string; userId: string } } }) => Promise<{ id: string } | null>;
    create: (args: { data: { postId: string; userId: string } }) => Promise<{ id: string }>;
    delete: (args: { where: { id: string } }) => Promise<void>;
  };
  postComment: {
    create: (args: { data: { postId: string; userId: string; content: string }; include?: { user: boolean } }) => Promise<unknown>;
  };
};

const xdb = db as unknown as ExtendedPrisma;

export async function createPost(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated.' };

  const content = (formData.get('content') as string)?.trim();
  if (!content) return { error: 'Post content cannot be empty.' };
  if (content.length > 3000) return { error: 'Post must be under 3,000 characters.' };

  const post = await db.feedPost.create({
    data: {
      authorId: session.user.id,
      content,
    },
  });

  revalidatePath('/feed');

  return { success: true, postId: post.id };
}

export async function toggleLike(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  try {
    const existingLike = await xdb.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    });

    if (existingLike) {
      await db.$transaction(async (tx) => {
        const xtx = tx as unknown as ExtendedPrisma;
        await xtx.postLike.delete({ 
          where: { id: existingLike.id } 
        });
        await tx.feedPost.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } }
        });
      });
      revalidatePath('/feed');
      return { success: true, liked: false };
    } else {
      await db.$transaction(async (tx) => {
        const xtx = tx as unknown as ExtendedPrisma;
        await xtx.postLike.create({
          data: { postId, userId: session.user.id }
        });
        await tx.feedPost.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } }
        });
      });

      // Notify post author
      const post = await db.feedPost.findUnique({ 
        where: { id: postId },
        include: { author: true }
      });

      if (post && post.authorId !== session.user.id) {
        await triggerNotification('post-like', post.authorId, {
          message: `${session.user.name || 'Someone'} liked your post`,
          userName: session.user.name || 'Someone',
          postId: post.id
        }, session.user.id);
      }

      revalidatePath('/feed');
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('Like error:', error);
    return { error: 'Failed to update like' };
  }
}

export async function addComment(postId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  if (!content.trim()) return { error: 'Comment cannot be empty' };

  try {
    const comment = await db.$transaction(async (tx) => {
      const xtx = tx as unknown as ExtendedPrisma;
      const c = await xtx.postComment.create({
        data: {
          postId,
          userId: session.user.id,
          content: content.trim()
        },
        include: { user: true }
      });

      await tx.feedPost.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } }
      });

      return c;
    });

    // Notify post author
    const post = await db.feedPost.findUnique({ 
      where: { id: postId },
      include: { author: true }
    });

    if (post && post.authorId !== session.user.id) {
      await triggerNotification('post-comment', post.authorId, {
        message: `${session.user.name || 'Someone'} commented on your post`,
        userName: session.user.name || 'Someone',
        postId: post.id,
        commentContent: content.trim()
      }, session.user.id);
    }

    revalidatePath('/feed');
    return { success: true, comment };
  } catch (error) {
    console.error('Comment error:', error);
    return { error: 'Failed to add comment' };
  }
}
