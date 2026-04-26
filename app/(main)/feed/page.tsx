import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import CreatePostCard from '@/components/feature/Feed/CreatePostCard';
import PostActions from '@/components/feature/Feed/PostActions';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { CompassMembership, Connection } from '.prisma/client';

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      compassMemberships: {
        include: { compass: true },
      },
    },
  });

  const compassIds = user?.compassMemberships.map((m: CompassMembership) => m.compassId) || [];

  const connections = await db.connection.findMany({
    where: {
      OR: [
        { senderId: session.user.id, status: 'ACCEPTED' },
        { receiverId: session.user.id, status: 'ACCEPTED' },
      ],
    },
  });

  const oroIds = connections.map((conn: Connection) =>
    conn.senderId === session.user.id ? conn.receiverId : conn.senderId
  );

  const posts = await db.feedPost.findMany({
    where: {
      OR: [
        { authorId: session.user.id },
        { authorId: { in: oroIds } },
        { compassId: { in: compassIds } },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
          company: true,
        },
      },
      compass: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const postIds = posts.map(p => p.id);

  const likedPostIds = new Set<string>();
  try {
    const extendedDb = db as unknown as { 
      postLike: { 
        findMany: (args: { 
          where: { userId: string; postId: { in: string[] } }; 
          select: { postId: true } 
        }) => Promise<{ postId: string }[]> 
      } 
    };
    
    const likes = await extendedDb.postLike.findMany({
      where: {
        userId: session.user.id,
        postId: { in: postIds }
      },
      select: { postId: true }
    });
    likes.forEach((l) => likedPostIds.add(l.postId));
  } catch (err) {
    console.error('Error fetching likes:', err);
  }

  // Fetch comments separately to bypass stale types
  let allComments: unknown[] = [];
  try {
    const extendedDb = db as unknown as {
      postComment: {
        findMany: (args: unknown) => Promise<unknown[]>
      }
    };
    allComments = await extendedDb.postComment.findMany({
      where: { postId: { in: postIds } },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
  }

  interface FeedComment {
    id: string;
    postId: string;
    content: string;
    createdAt: Date;
    user: { id: string; name: string; avatar: string | null };
  }

  const commentsByPostId = (allComments as FeedComment[]).reduce((acc, comment) => {
    if (!acc[comment.postId]) acc[comment.postId] = [];
    acc[comment.postId].push(comment);
    return acc;
  }, {} as Record<string, FeedComment[]>);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1 md:mb-2">Feed</h1>
        <p className="text-sm sm:text-base text-gray-600">Stay updated with your professional network</p>
      </div>

      {/* Create Post */}
      <CreatePostCard
        userName={user?.name ?? session.user.name ?? ''}
        userAvatar={`/api/user/${session.user.id}/avatar`}
      />

      {posts.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#333333] mb-2">No posts yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Connect with Oros and join Compass communities to see activity in your feed
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-3 md:space-x-4">
                <Link href={`/oro/${post.author.id}`} className="shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center overflow-hidden">
                    {post.author.avatar ? (
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-base md:text-lg">
                        {post.author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <Link href={`/oro/${post.author.id}`} className="font-semibold text-[#333333] text-base md:text-lg hover:text-[#458B9E] transition-colors">
                        {post.author.name}
                      </Link>
                      <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
                        {post.author.title && (
                          <span className="truncate">{post.author.title}</span>
                        )}
                        {post.author.title && post.compass && <span>•</span>}
                        {post.compass && (
                          <Link
                            href={`/compass/${post.compass.slug}`}
                            className="text-[#458B9E] hover:underline truncate"
                          >
                            {post.compass.name}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 md:ml-4 shrink-0">
                      <Image
                        src="/icon.png"
                        alt="Orochat"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                      <span className="text-xs md:text-sm text-gray-400">
                        {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm md:text-base text-[#333333] mb-3 md:mb-4 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <Image
                      src={post.imageUrl}
                      alt="Post image"
                      width={800}
                      height={450}
                      className="w-full rounded-xl mb-3 md:mb-4 max-h-96 object-cover"
                    />
                  )}

                  <PostActions 
                    postId={post.id}
                    initialLikes={post.likesCount}
                    isLikedInitially={likedPostIds.has(post.id)}
                    comments={commentsByPostId[post.id] || []}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
