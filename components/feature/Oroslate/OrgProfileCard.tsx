'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, Pencil } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { updateOrganizationProfile } from '@/features/oroslate/actions';

interface OrgProfileCardProps {
  organizationId: string;
  slug: string;
  currentUserId: string;
  isAdmin: boolean;
  description: string | null;
  industry: string | null;
  website: string | null;
}

export default function OrgProfileCard({
  organizationId,
  slug,
  currentUserId,
  isAdmin,
  description,
  industry,
  website,
}: OrgProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState(description ?? '');
  const [industryInput, setIndustryInput] = useState(industry ?? '');
  const [websiteInput, setWebsiteInput] = useState(website ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    try {
      const result = await updateOrganizationProfile(organizationId, currentUserId, {
        description: descriptionInput,
        industry: industryInput,
        website: websiteInput,
      });
      if (result.success) {
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to save');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card padding="sm" className="border border-gray-200/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[#458B9E]">
          <Building2 className="w-4 h-4" />
          <h3 className="font-bold text-gray-900 text-sm">Company Page</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/org/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#458B9E] hover:underline"
          >
            View Public Page
            <ExternalLink className="w-3 h-3" />
          </Link>
          {isAdmin && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-[#458B9E] hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Edit company page"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
            <input
              value={industryInput}
              onChange={(e) => setIndustryInput(e.target.value)}
              placeholder="e.g., Software Development"
              className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 outline-none transition-all"
            />
          </div>
          <Input
            label="Website"
            value={websiteInput}
            onChange={(e) => setWebsiteInput(e.target.value)}
            placeholder="e.g., example.com"
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">About</label>
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="What does your company do?"
              className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 outline-none transition-all min-h-[80px]"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} isLoading={isSaving}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          {industry && <p className="font-medium text-gray-800 mb-1">{industry}</p>}
          {description ? (
            <p className="leading-relaxed line-clamp-3">{description}</p>
          ) : (
            <p className="text-gray-400 italic">
              {isAdmin ? 'Add a description so your public company page isn’t empty.' : 'No description yet.'}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
