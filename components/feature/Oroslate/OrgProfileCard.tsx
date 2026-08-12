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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Company Page</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/org/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#458B9E] hover:text-[#397484] bg-[#458B9E]/10 hover:bg-[#458B9E]/15 border border-[#458B9E]/20 transition-all active:scale-[0.98]"
          >
            <span>View Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          {isAdmin && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              aria-label="Edit company page"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Industry</label>
            <input
              value={industryInput}
              onChange={(e) => setIndustryInput(e.target.value)}
              placeholder="e.g., Software Development"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 outline-none transition-all"
            />
          </div>
          <Input
            label="Website"
            value={websiteInput}
            onChange={(e) => setWebsiteInput(e.target.value)}
            placeholder="e.g., example.com"
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">About</label>
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="What does your company do?"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 outline-none transition-all min-h-[80px]"
            />
          </div>
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} isLoading={isSaving}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-xs sm:text-sm text-slate-600 font-medium">
          {industry && <p className="font-bold text-slate-800 mb-1">{industry}</p>}
          {description ? (
            <p className="leading-relaxed line-clamp-3 text-slate-600 font-medium">{description}</p>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 text-xs font-medium flex items-center justify-between gap-2">
              <span>
                {isAdmin ? 'Add a description so your public company page isn’t empty.' : 'No description yet.'}
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-[#458B9E] hover:underline cursor-pointer shrink-0"
                >
                  + Add Description
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
