import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import PostCard from '@/components/feature/Feed/PostCard';
import { Archive, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getPostMeta } from '@/lib/feed/postMeta';

export default async function ArchivedPostsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const posts = await db.feedPost.findMany({
    where: { authorId: session.user.id, archived: true },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
          company: true,
          username: true,
          countryCode: true,
        },
      },
      compass: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const postIds = posts.map((p) => p.id);
  const { likedPostIds, commentsByPostId } = await getPostMeta(postIds, session.user.id);

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-0">
      <div className="mb-6 md:mb-8">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-[#458B9E] hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>
        <div className="flex items-center gap-2 mb-1 md:mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#458B9E]/10">
            <Archive className="w-4 h-4 text-[#458B9E]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333]">Archived Posts</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Posts you&apos;ve archived are hidden from your Feed, the Global feed, and Compass communities.
        </p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#333333] mb-2">No archived posts</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Posts you archive from your Feed will show up here
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              isLiked={likedPostIds.has(post.id)}
              comments={commentsByPostId[post.id] || []}
              currentUserId={session.user.id}
              isArchived
            />
          ))}
        </div>
      )}
    </div>
  );
}
