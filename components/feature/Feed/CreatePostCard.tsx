'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/features/feed/actions';
import Button from '@/components/ui/Button';

interface Props {
  userName: string;
  userAvatar?: string | null;
}

export default function CreatePostCard({ userName, userAvatar }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOpen = () => {
    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleCancel = () => {
    setExpanded(false);
    setContent('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      const result = await createPost(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setContent('');
        setExpanded(false);
        router.refresh();
      }
    } catch {
      setError('Failed to post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initials = userName?.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#458B9E] to-[#5BA3B8] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-base md:text-lg">{initials}</span>
          )}
        </div>

        {!expanded ? (
          <button
            onClick={handleOpen}
            className="flex-1 text-left px-3 md:px-4 py-2 md:py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors text-sm md:text-base"
          >
            Share an update...
          </button>
        ) : (
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                maxLength={3000}
                className="w-full px-3 py-2 text-sm md:text-base text-[#333333] bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all"
              />

              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{content.length} / 3,000</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isLoading}
                    disabled={!content.trim()}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
