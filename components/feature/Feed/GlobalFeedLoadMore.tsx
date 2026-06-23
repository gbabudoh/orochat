'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import PostCard, { FeedPostCardData } from '@/components/feature/Feed/PostCard';
import SponsoredPostCard from '@/components/feature/Feed/SponsoredPostCard';
import type { SponsoredAd } from '@/lib/ads/selectAd';

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

type FeedEntry = { kind: 'post'; post: FeedItem } | { kind: 'ad'; ad: SponsoredAd };

interface Props {
  initialCursor: string | null;
  currentUserId: string;
  initialSeenCount: number;
  country?: string;
  category?: string;
}

export default function GlobalFeedLoadMore({ initialCursor, currentUserId, initialSeenCount, country, category }: Props) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [seenCount, setSeenCount] = useState(initialSeenCount);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || isLoading) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ cursor, seenCount: String(seenCount) });
      if (country) params.set('country', country);
      if (category) params.set('category', category);
      const res = await fetch(`/api/global/feed?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => [...prev, ...data.entries]);
        setCursor(data.nextCursor);
        setSeenCount((prev) => prev + data.newPostCount);
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
        {entries.map((entry, index) =>
          entry.kind === 'post' ? (
            <PostCard
              key={entry.post.post.id}
              post={{ ...entry.post.post, createdAt: new Date(entry.post.post.createdAt) }}
              index={index}
              isLiked={entry.post.isLiked}
              comments={entry.post.comments.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }))}
              currentUserId={currentUserId}
            />
          ) : (
            <SponsoredPostCard key={`ad-${entry.ad.id}-${index}`} ad={entry.ad} index={index} />
          )
        )}
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
