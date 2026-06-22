'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createCampaign, updateCampaign } from '@/features/admin/ad-campaign-actions';

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
  const [targetCompassIds, setTargetCompassIds] = useState<string[]>(campaign?.targetCompassIds ?? []);

  const toggleCompass = (id: string) => {
    setTargetCompassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
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
      toast.success(campaign ? 'Campaign updated' : 'Campaign created');
      router.push('/admin/ads');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser Name</label>
        <input
          type="text"
          name="advertiserName"
          defaultValue={campaign?.advertiserName}
          required
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
        <input
          type="text"
          name="headline"
          defaultValue={campaign?.headline}
          required
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
        <textarea
          name="body"
          defaultValue={campaign?.body}
          required
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm min-h-[100px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
        <input
          type="text"
          name="imageUrl"
          defaultValue={campaign?.imageUrl ?? ''}
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CTA Label</label>
          <input
            type="text"
            name="ctaLabel"
            defaultValue={campaign?.ctaLabel}
            required
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL</label>
          <input
            type="url"
            name="ctaUrl"
            defaultValue={campaign?.ctaUrl}
            required
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            name="startAt"
            defaultValue={campaign ? toDateInputValue(campaign.startAt) : undefined}
            required
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="endAt"
            defaultValue={campaign ? toDateInputValue(campaign.endAt) : undefined}
            required
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="targetGlobal"
          id="targetGlobal"
          defaultChecked={campaign?.targetGlobal ?? true}
          className="w-4 h-4"
        />
        <label htmlFor="targetGlobal" className="text-sm text-gray-700">
          Show in Global feed
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Compass communities (leave empty to allow all)
        </label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {compassOptions.map((compass) => (
            <button
              key={compass.id}
              type="button"
              onClick={() => toggleCompass(compass.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                targetCompassIds.includes(compass.id)
                  ? 'bg-[#458B9E] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {compass.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Relevance keywords (optional)
        </label>
        <input
          type="text"
          name="targetKeywords"
          defaultValue={campaign?.targetKeywords ?? ''}
          placeholder="e.g. software engineering, AI, machine learning"
          className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Only used when no specific communities are selected above — the campaign will only show in
          communities whose topic matches these keywords, instead of every community.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border-l-4 border-red-400 rounded-lg p-3">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-[#458B9E] hover:bg-[#3a7585] disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {isLoading ? 'Saving…' : campaign ? 'Save Changes' : 'Create Campaign'}
      </button>
    </form>
  );
}
