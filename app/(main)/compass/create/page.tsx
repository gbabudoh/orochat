'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCommunity } from '@/features/compass/actions';
import { Info, Link as LinkIcon, ArrowLeft, Plus, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateCommunityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);

    try {
      const result = await createCommunity(formData);
      if (result.success && result.slug) {
        router.push(`/compass/${result.slug}`);
      } else {
        setError(result.error || 'Failed to create community');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full min-w-0 px-2.5 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/compass"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
          <span>Back to Communities</span>
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Create a New Community</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Establish a professional space for specialized collaboration</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Partner Notice Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/80 p-4 rounded-2xl flex items-start gap-3.5 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-bold text-slate-900">Partner Exclusive Perk</p>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                As an Orochat Partner, you can launch and moderate specialized technical communities. 
                Focus each community on a distinct industry, language, or interest group.
              </p>
            </div>
          </div>

          {/* Community Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Community Name
            </label>
            <input
              type="text"
              placeholder="e.g., Software Engineering, Product Design"
              value={name}
              onChange={handleNameChange}
              required
              minLength={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200/90 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 bg-white"
            />
          </div>

          {/* URL Slug Input Container */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#458B9E]" />
                <span>Community URL</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500 truncate">
                orochat.com/compass/<span className="text-[#458B9E] font-bold">{slug || 'community-slug'}</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center rounded-xl border border-slate-200/90 focus-within:border-[#458B9E] focus-within:ring-2 focus-within:ring-[#458B9E]/20 transition-all bg-white shadow-2xs overflow-hidden">
              <span className="w-full sm:w-auto px-3.5 py-2 sm:py-2.5 bg-slate-100/90 border-b sm:border-b-0 sm:border-r border-slate-200/80 text-xs font-bold text-slate-600 shrink-0 select-none text-left sm:text-center">
                orochat.com/compass/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                placeholder="community-slug"
                className="w-full flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none bg-transparent placeholder:text-slate-400"
                required
              />
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose, rules, and value of this community..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200/90 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 min-h-[140px] outline-none bg-white"
              required
              minLength={10}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200/80 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Action Dock */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Link href="/compass">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-white/90 animate-spin shrink-0" />
                  <span>Creating…</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white/90 shrink-0" />
                  <span>Create Community</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
