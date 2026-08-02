'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createCampaign, updateCampaign } from '@/features/admin/ad-campaign-actions';
import {
  Building2,
  Calendar,
  Megaphone,
  Target,
  Compass,
  Eye,
  ExternalLink,
  Check,
  Search,
  ArrowLeft,
  Globe,
  Tag,
  AlertCircle,
  Clock,
  Image as ImageIcon
} from 'lucide-react';

interface CompassOption {
  id: string;
  name: string;
}

interface CampaignFormProps {
  compassOptions: CompassOption[];
  campaign?: {
    id: string;
    advertiserName: string;
    headline: string;
    body: string;
    imageUrl: string | null;
    ctaLabel: string;
    ctaUrl: string;
    startAt: Date;
    endAt: Date;
    targetGlobal: boolean;
    targetCompassIds: string[];
    targetKeywords: string | null;
  };
}

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export default function CampaignForm({ compassOptions, campaign }: CampaignFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Controlled form state for live preview synchronization
  const [advertiserName, setAdvertiserName] = useState(campaign?.advertiserName ?? '');
  const [headline, setHeadline] = useState(campaign?.headline ?? '');
  const [body, setBody] = useState(campaign?.body ?? '');
  const [imageUrl, setImageUrl] = useState(campaign?.imageUrl ?? '');
  const [ctaLabel, setCtaLabel] = useState(campaign?.ctaLabel ?? 'Learn More');
  const [ctaUrl, setCtaUrl] = useState(campaign?.ctaUrl ?? '');
  const [startAt, setStartAt] = useState(campaign ? toDateInputValue(campaign.startAt) : toDateInputValue(new Date()));
  const [endAt, setEndAt] = useState(
    campaign
      ? toDateInputValue(campaign.endAt)
      : toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [targetGlobal, setTargetGlobal] = useState<boolean>(campaign?.targetGlobal ?? true);
  const [targetCompassIds, setTargetCompassIds] = useState<string[]>(campaign?.targetCompassIds ?? []);
  const [targetKeywords, setTargetKeywords] = useState(campaign?.targetKeywords ?? '');

  // Community search filter
  const [compassSearch, setCompassSearch] = useState('');

  const filteredCompassOptions = compassOptions.filter((c) =>
    c.name.toLowerCase().includes(compassSearch.toLowerCase())
  );

  const toggleCompass = (id: string) => {
    setTargetCompassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSelectAllCompass = () => {
    setTargetCompassIds(compassOptions.map((c) => c.id));
  };

  const handleClearAllCompass = () => {
    setTargetCompassIds([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.delete('targetCompassIds');
    targetCompassIds.forEach((id) => formData.append('targetCompassIds', id));

    const result = campaign ? await updateCampaign(campaign.id, formData) : await createCampaign(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      toast.success(campaign ? 'Campaign updated successfully' : 'Campaign created successfully');
      router.push('/admin/ads');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/ads"
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            title="Back to Campaigns"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#458B9E]/10 text-[#458B9E]">
                {campaign ? 'Edit Mode' : 'New Campaign'}
              </span>
              {campaign && (
                <span className="text-xs text-gray-400">ID: {campaign.id.slice(0, 8)}…</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5">
              {campaign ? `Edit "${campaign.headline || 'Campaign'}"` : 'Create Ad Campaign'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/ads"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form="campaign-form"
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-[#458B9E] hover:bg-[#3a7585] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-[#458B9E]/20 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{campaign ? 'Save Changes' : 'Publish Campaign'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold">Unable to save campaign</h4>
            <p className="mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form Sections (Left) vs Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          <form id="campaign-form" onSubmit={handleSubmit} className="space-y-6">
            {/* CARD 1: Advertiser & Schedule */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Campaign Details & Schedule</h3>
                  <p className="text-xs text-gray-500">Configure advertiser branding and deployment dates</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Advertiser Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="advertiserName"
                  value={advertiserName}
                  onChange={(e) => setAdvertiserName(e.target.value)}
                  placeholder="e.g. Acme Cloud Corp"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startAt"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endAt"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
                  />
                </div>
              </div>

              {/* Global Feed Toggle Card */}
              <div className="pt-2">
                <label className="flex items-start gap-3.5 p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    name="targetGlobal"
                    id="targetGlobal"
                    checked={targetGlobal}
                    onChange={(e) => setTargetGlobal(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#458B9E] rounded focus:ring-[#458B9E]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#458B9E]" />
                      Display in Main Global Feed
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      When enabled, this ad interleaves into the primary community-wide global activity feed.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* CARD 2: Ad Creative & CTA */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Ad Creative Content</h3>
                  <p className="text-xs text-gray-500">Draft copy, visuals, and destination link</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Build faster with our developer tools"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm font-medium text-gray-900 transition-all outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Body Text <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400 font-mono">{body.length} characters</span>
                </div>
                <textarea
                  name="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Describe your offer or product announcement..."
                  required
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm leading-relaxed transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                  Image URL <span className="text-gray-400 text-xs lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    CTA Button Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ctaLabel"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="e.g. Visit Website, Claim Offer"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    CTA Target URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="ctaUrl"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://acme.com/promo"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: Target Audience & Communities */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Community Targeting</h3>
                  <p className="text-xs text-gray-500">
                    Filter placement to specific Compass communities or topic keywords
                  </p>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#458B9E]" />
                    Target Compass Communities
                    {targetCompassIds.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#458B9E] text-white">
                        {targetCompassIds.length} Selected
                      </span>
                    )}
                  </label>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllCompass}
                      className="text-[#458B9E] hover:underline font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearAllCompass}
                      className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  Leave completely unselected to allow targeting across all communities automatically.
                </p>

                {/* Filter Search Input */}
                {compassOptions.length > 5 && (
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={compassSearch}
                      onChange={(e) => setCompassSearch(e.target.value)}
                      placeholder="Filter communities..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-[#458B9E] outline-none"
                    />
                  </div>
                )}

                {/* Community Pill List */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50/70 border border-gray-200/70 rounded-xl">
                  {filteredCompassOptions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">No communities match your search filter.</p>
                  ) : (
                    filteredCompassOptions.map((compass) => {
                      const isSelected = targetCompassIds.includes(compass.id);
                      return (
                        <button
                          key={compass.id}
                          type="button"
                          onClick={() => toggleCompass(compass.id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#458B9E] text-white border-[#458B9E] shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100/80'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 shrink-0" />}
                          <span>{compass.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Relevance Keywords */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  Relevance Keywords <span className="text-gray-400 text-xs lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="targetKeywords"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  placeholder="e.g. software engineering, AI, machine learning"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-sm transition-all outline-none"
                />
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  💡 <strong>Keyword matching rule:</strong> Used primarily when no specific communities are selected above. The campaign will automatically target communities whose topic content aligns with these comma-separated keywords.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column - Sticky Live Feed Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Live Preview Header */}
            <div className="bg-gray-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#458B9E]" />
                <span className="font-bold text-sm">Live Feed Preview</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#458B9E]/30 text-[#458B9E] border border-[#458B9E]/40">
                Real-Time
              </span>
            </div>

            {/* Preview Card Shell */}
            <div className="p-5 bg-[#F0F3F7]">
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider border border-amber-200/60">
                    Sponsored
                  </span>
                  <span className="text-xs text-gray-500 font-medium truncate max-w-[180px]">
                    {advertiserName.trim() || 'Advertiser Name'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug">
                    {headline.trim() || 'Your Ad Headline Here'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap leading-relaxed">
                    {body.trim() || 'Your advertisement copy will appear here. Explain your product, special promotion, or community announcement.'}
                  </p>
                </div>

                {imageUrl.trim() && (
                  <div className="overflow-hidden rounded-xl bg-gray-100 max-h-56">
                    <img
                      src={imageUrl}
                      alt="Ad Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#458B9E]">
                    {ctaLabel.trim() || 'Learn More'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[160px]">
                    {ctaUrl ? ctaUrl.replace(/^https?:\/\//, '') : 'example.com'}
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Summary & Audit */}
            <div className="p-5 border-t border-gray-100 space-y-3 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                  <Globe className="w-3.5 h-3.5 text-gray-400" /> Placement Scope:
                </span>
                <span className="font-semibold text-gray-800">
                  {targetGlobal ? 'Global Feed Enabled' : 'Communities Only'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                  <Compass className="w-3.5 h-3.5 text-gray-400" /> Targeted Communities:
                </span>
                <span className="font-semibold text-gray-800">
                  {targetCompassIds.length > 0 ? `${targetCompassIds.length} Selected` : 'All (Unrestricted)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> Active Period:
                </span>
                <span className="font-semibold text-gray-800">
                  {startAt || '---'} to {endAt || '---'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
