import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import CreatePostCard from '@/components/feature/Feed/CreatePostCard';
import PostCard from '@/components/feature/Feed/PostCard';
import { Globe, MessageCircle, Compass as CompassIcon, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { CompassMembership, Connection } from '.prisma/client';
import { getPostMeta } from '@/lib/feed/postMeta';

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

  const [posts, suggestedCompasses, suggestedOros] = await Promise.all([
    db.feedPost.findMany({
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
            username: true,
            countryCode: true,
          },
        },
        compass: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.compass.findMany({
      where: { id: { notIn: compassIds } },
      orderBy: { memberships: { _count: 'desc' } },
      take: 3,
      select: { id: true, slug: true, name: true, image: true, _count: { select: { memberships: true } } },
    }),
    db.user.findMany({
      where: {
        id: { notIn: [session.user.id, ...oroIds] },
      },
      orderBy: { verifiedOrosCount: 'desc' },
      take: 3,
      select: { id: true, name: true, avatar: true, title: true, company: true },
    }),
  ]);

  const postIds = posts.map(p => p.id);
  const { likedPostIds, commentsByPostId } = await getPostMeta(postIds, session.user.id);

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1 md:mb-2">Feed</h1>
          <p className="text-sm sm:text-base text-gray-600">Stay updated with your professional network</p>
        </div>
        <Link
          href="/global"
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-colors shrink-0"
        >
          <Globe className="w-4 h-4" />
          Global Feed
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
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
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  isLiked={likedPostIds.has(post.id)}
                  comments={commentsByPostId[post.id] || []}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:block space-y-4">
          <Card padding="sm">
            <h3 className="font-semibold text-[#333333] mb-3 flex items-center gap-2 text-sm">
              <CompassIcon className="w-4 h-4 text-[#458B9E]" />
              Suggested Compass Communities
            </h3>
            {suggestedCompasses.length === 0 ? (
              <p className="text-xs text-gray-400">You&apos;ve joined all available communities</p>
            ) : (
              <div className="space-y-3">
                {suggestedCompasses.map((c) => (
                  <Link key={c.id} href={`/compass/${c.slug}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-linear-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center overflow-hidden shrink-0">
                      {c.image ? (
                        <Image src={c.image} alt={c.name} width={36} height={36} className="w-full h-full object-cover" />
                      ) : (
                        <CompassIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#333333] group-hover:text-[#458B9E] truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c._count.memberships} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card padding="sm">
            <h3 className="font-semibold text-[#333333] mb-3 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-[#458B9E]" />
              People You May Know
            </h3>
            {suggestedOros.length === 0 ? (
              <p className="text-xs text-gray-400">No suggestions right now</p>
            ) : (
              <div className="space-y-3">
                {suggestedOros.map((o) => (
                  <Link key={o.id} href={`/oro/${o.id}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center overflow-hidden shrink-0">
                      {o.avatar ? (
                        <Image src={`/api/user/${o.id}/avatar`} alt={o.name} width={36} height={36} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-semibold">{o.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#333333] group-hover:text-[#458B9E] truncate">{o.name}</p>
                      {o.title && <p className="text-xs text-gray-400 truncate">{o.title}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Link
            href="/global"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-white bg-linear-to-r from-[#458B9E] to-[#3a7585] hover:opacity-90 transition-opacity"
          >
            <Globe className="w-4 h-4" />
            Explore Global Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
