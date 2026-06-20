'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PostActions from '@/components/feature/Feed/PostActions';
import HandleBadge from '@/components/feature/Feed/HandleBadge';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/formatters';

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
      <Card padding="none" className="hover:shadow-lg transition-shadow p-3.5 sm:p-6 overflow-hidden">
        <div className="flex items-start gap-2.5 sm:gap-4">
          <Link href={`/oro/${post.author.id}`} className="shrink-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center overflow-hidden">
              {post.author.avatar ? (
                <Image
                  src={`/api/user/${post.author.id}/avatar`}
                  alt={post.author.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm sm:text-lg">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <Link href={`/oro/${post.author.id}`} className="font-semibold text-[#333333] text-sm sm:text-lg hover:text-[#458B9E] transition-colors wrap-break-word">
                  {post.author.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs sm:text-sm text-gray-500">
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
              <div className="flex items-center gap-1.5 shrink-0">
                <Image src="/icon.png" alt="Orochat" width={24} height={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                <span
                  className="text-[11px] sm:text-sm text-gray-400 whitespace-nowrap"
                  title={formatDateTime(post.createdAt)}
                >
                  {formatRelativeTime(post.createdAt)}
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
