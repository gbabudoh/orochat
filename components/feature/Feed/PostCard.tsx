'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PostActions from '@/components/feature/Feed/PostActions';
import HandleBadge from '@/components/feature/Feed/HandleBadge';
import { formatRelativeTime, formatDateTime, formatPostDateTime } from '@/lib/utils/formatters';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string; avatar: string | null };
}

export interface FeedPostCardData {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  likesCount: number;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    title?: string | null;
    username?: string | null;
    countryCode?: string | null;
    presence?: 'online' | 'offline';
  };
  compass?: { id: string; name: string; slug: string } | null;
}

interface PostCardProps {
  post: FeedPostCardData;
  isLiked: boolean;
  comments: Comment[];
  index?: number;
  currentUserId?: string;
  isArchived?: boolean;
}

export default function PostCard({ post, isLiked, comments, index = 0, currentUserId, isArchived = false }: PostCardProps) {
  const [isRemoved, setIsRemoved] = useState(false);
  const isAuthor = currentUserId === post.author.id;

  if (isRemoved) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05 }}
    >
      <Card padding="none" className="hover:shadow-lg transition-shadow p-2 sm:p-6 overflow-hidden">
        <div className="flex items-start gap-2 sm:gap-4">
          <Link href={`/oro/${post.author.id}`} className="shrink-0 relative">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center overflow-hidden">
              {post.author.avatar ? (
                <img
                  src={`/api/user/${post.author.id}/avatar`}
                  alt={post.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm sm:text-lg">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {post.author.presence && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white ${
                  post.author.presence === 'online' ? 'bg-green-500' : 'bg-gray-300'
                }`}
                aria-label={post.author.presence}
              />
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <Link href={`/oro/${post.author.id}`} className="font-semibold text-[#333333] text-sm sm:text-lg hover:text-[#458B9E] transition-colors wrap-break-word">
                  {post.author.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs sm:text-sm text-gray-500">
                  {post.author.presence && (
                    <span className={post.author.presence === 'online' ? 'text-green-600' : 'text-gray-400'}>
                      {post.author.presence === 'online' ? 'Online' : 'Offline'}
                    </span>
                  )}
                  {post.author.presence && (post.author.title || post.compass) && <span>•</span>}
                  {post.author.title && <span className="wrap-break-word">{post.author.title}</span>}
                  {post.author.title && post.compass && <span>•</span>}
                  {post.compass && (
                    <Link
                      href={`/compass/${post.compass.slug}`}
                      className="text-[#458B9E] hover:underline wrap-break-word"
                    >
                      {post.compass.name}
                    </Link>
                  )}
                  {(post.author.username || post.author.countryCode) && (
                    <>
                      <span>•</span>
                      <HandleBadge username={post.author.username} countryCode={post.author.countryCode} />
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#458B9E]/10 text-[#458B9E] text-[9px] sm:text-[10px] font-bold rounded-md uppercase tracking-wider">
                    Oro Post
                  </span>
                  <Image src="/icon.png" alt="Orochat" width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span
                  className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap min-w-0"
                  title={formatDateTime(post.createdAt)}
                  suppressHydrationWarning
                >
                  {/* Full "<date> - <weekday> - <time> (<relative>)" string is too
                      wide for mobile next to the badge, so only show the compact
                      relative time there; the full string still appears on sm+. */}
                  <span className="sm:hidden">{formatRelativeTime(post.createdAt)}</span>
                  <span className="hidden sm:inline">
                    {(() => {
                      const relative = formatRelativeTime(post.createdAt);
                      const isRelative = !relative.includes(',');
                      return isRelative
                        ? `${formatPostDateTime(post.createdAt)} (${relative})`
                        : formatPostDateTime(post.createdAt);
                    })()}
                  </span>
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#333333] mb-3 sm:mb-4 whitespace-pre-wrap wrap-break-word leading-relaxed">
              {post.content}
            </p>

            {post.imageUrl && (
              <Image
                src={post.imageUrl}
                alt="Post image"
                width={800}
                height={450}
                className="w-full rounded-xl mb-3 sm:mb-4 max-h-96 object-cover"
              />
            )}

            <PostActions
              postId={post.id}
              initialLikes={post.likesCount}
              isLikedInitially={isLiked}
              isAuthor={isAuthor}
              isArchived={isArchived}
              onRemoved={() => setIsRemoved(true)}
              comments={comments}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
