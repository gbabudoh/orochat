'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PostActions from '@/components/feature/Feed/PostActions';
import HandleBadge from '@/components/feature/Feed/HandleBadge';
import { formatRelativeTime } from '@/lib/utils/formatters';

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
}

export default function PostCard({ post, isLiked, comments, index = 0 }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex items-start space-x-3 md:space-x-4">
          <Link href={`/oro/${post.author.id}`} className="shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center overflow-hidden">
              {post.author.avatar ? (
                <Image
                  src={`/api/user/${post.author.id}/avatar`}
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
                  {post.author.title && <span className="truncate">{post.author.title}</span>}
                  {post.author.title && post.compass && <span>•</span>}
                  {post.compass && (
                    <Link
                      href={`/compass/${post.compass.slug}`}
                      className="text-[#458B9E] hover:underline truncate"
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
              <div className="flex items-center space-x-2 ml-2 md:ml-4 shrink-0">
                <Image src="/icon.png" alt="Orochat" width={24} height={24} className="w-6 h-6" />
                <span className="text-xs md:text-sm text-gray-400">{formatRelativeTime(post.createdAt)}</span>
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
              isLikedInitially={isLiked}
              comments={comments}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
