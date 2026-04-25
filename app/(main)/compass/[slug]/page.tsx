import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import { Users, MessageSquare } from 'lucide-react';
import CommunityActions from '@/components/feature/Compass/CommunityActions';
import type { FeedPost } from '.prisma/client';

export default async function CompassCommunityPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const community = await db.compass.findUnique({
    where: { slug: params.slug },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
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

  // Get posts
  const posts = await db.feedPost.findMany({
    where: { compassId: community.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="max-w-4xl mx-auto">
      <Card padding="lg" className="mb-6">
        <h1 className="text-3xl font-bold text-[#333333] mb-2">{community.name}</h1>
        <p className="text-gray-600 mb-4">{community.description}</p>
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
        {!membership && (
          <div className="mt-6">
            <CommunityActions compassId={community.id} isMember={false} />
          </div>
        )}
      </Card>

      <div className="space-y-4">
        {posts.map((post: FeedPost & { author: { id: string; name: string; avatar: string | null; title: string | null } }) => (
          <Card key={post.id}>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-[#458B9E] flex items-center justify-center flex-shrink-0">
                {post.author.avatar ? (
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    width={40}
                    height={40}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {post.author.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-[#333333]">{post.author.name}</h3>
                  {post.author.title && (
                    <span className="text-sm text-gray-500">• {post.author.title}</span>
                  )}
                </div>
                <p className="text-[#333333] whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

