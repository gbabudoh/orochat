'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import UserAvatar from '@/components/ui/UserAvatar';
import { createPost } from '@/features/feed/actions';
import { Globe, Send, Sparkles, Image as ImageIcon } from 'lucide-react';

import HelpTooltip from '@/components/ui/HelpTooltip';

interface Props {
  user: {
    id: string;
    name?: string | null;
    avatar?: string | null;
  };
}

export default function GlobalPostComposer({ user }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('visibility', 'PUBLIC');
    if (imageUrl.trim()) {
      formData.append('imageUrl', imageUrl.trim());
    }

    const res = await createPost(formData);
    setIsSubmitting(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Public post shared with the Global network!');
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      setIsExpanded(false);
      router.refresh();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm mb-6 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#458B9E]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Share Global Update
          </h3>
          <HelpTooltip
            title="Global Post Composer"
            description="Share a public update, thought, or article with all verified Oros worldwide."
            tips={[
              'Visibility is fixed to Public for global network reach.',
              'Supports up to 3,000 characters and optional image URLs.',
              'Public updates boost your platform activity score.',
            ]}
          />
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Public to All Oros</span>
        </span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-start gap-3">
          <UserAvatar userId={user.id} name={user.name || 'User'} avatarUrl={user.avatar} size="md" />

          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="What's happening on your radar? Share a public update with the global network..."
              rows={isExpanded ? 3 : 2}
              maxLength={3000}
              className="w-full text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none bg-transparent leading-relaxed"
            />
          </div>
        </div>

        {showImageInput && (
          <div className="pt-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL (e.g. https://...)"
              className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:border-[#458B9E] outline-none"
            />
          </div>
        )}

        {isExpanded && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#458B9E] px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{showImageInput ? 'Hide Image URL' : 'Add Image URL'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-mono">
                {content.length}/3000
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="inline-flex items-center gap-1.5 bg-[#458B9E] hover:bg-[#397484] disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting…' : 'Post Publicly'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
