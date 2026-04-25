'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { createCommunity } from '@/features/compass/actions';
import { Info, Link as LinkIcon } from 'lucide-react';
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
    // Auto-generate slug if not manually edited
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/compass" className="text-sm text-[#458B9E] hover:underline mb-2 inline-block">
          ← Back to Communities
        </Link>
        <h1 className="text-2xl font-bold text-[#333333]">Create a New Community</h1>
        <p className="text-gray-600">Establish a professional space for specialized collaboration</p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <p className="text-sm text-blue-700">
              As an Orochat Partner, you can create and moderate professional communities. 
              Each community should focus on a specific industry, skill, or interest.
            </p>
          </div>

          <Input
            label="Community Name"
            placeholder="e.g., Software Engineering, Product Design"
            value={name}
            onChange={handleNameChange}
            required
            minLength={3}
          />

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5 flex items-center">
              <LinkIcon className="w-4 h-4 mr-1.5" />
              URL Slug
            </label>
            <div className="flex items-center">
              <span className="bg-gray-50 border-2 border-r-0 border-gray-200 px-3 py-2.5 rounded-l-lg text-gray-500 text-sm">
                orochat.com/compass/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                placeholder="community-slug"
                className="flex-1 px-4 py-2.5 rounded-r-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all text-sm"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose, rules, and value of this community..."
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all text-[#333333] placeholder:text-gray-400 min-h-[150px]"
              required
              minLength={10}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-4">
            <Link href="/compass">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
