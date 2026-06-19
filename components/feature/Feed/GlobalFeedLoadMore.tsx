'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import PostCard, { FeedPostCardData } from '@/components/feature/Feed/PostCard';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

interface FeedItem {
  post: FeedPostCardData;
  isLiked: boolean;
  comments: Comment[];
}

interface Props {
  initialCursor: string | null;
}

export default function GlobalFeedLoadMore({ initialCursor }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/global/feed?cursor=${cursor}`);
      const data = await res.json();
      if (data.success) {
        setItems((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
      }
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 mt-4 md:mt-6">
        {items.map(({ post, isLiked, comments }, index) => (
          <PostCard
            key={post.id}
            post={{ ...post, createdAt: new Date(post.createdAt) }}
            index={index}
            isLiked={isLiked}
            comments={comments.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }))}
          />
        ))}
      </div>

      {cursor && (
        <div className="flex justify-center mt-6">
          <Button variant="ghost" onClick={loadMore} isLoading={isLoading}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
