'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Globe, Briefcase } from 'lucide-react';
import { COUNTRIES, countryCodeToFlag } from '@/lib/constants/countries';
import { PROFESSIONAL_CATEGORIES } from '@/lib/constants/categories';

const professionalCategories = PROFESSIONAL_CATEGORIES.map((c) => c.label);

export default function GlobalFeedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCountry = searchParams.get('country') || '';
  const selectedCategory = searchParams.get('category') || '';

  const updateFilters = (next: { country?: string; category?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.country !== undefined) {
      if (next.country) params.set('country', next.country);
      else params.delete('country');
    }

    if (next.category !== undefined) {
      if (next.category) params.set('category', next.category);
      else params.delete('category');
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 md:mb-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          Filter by Country
        </h3>
        <div className="relative max-w-xs">
          <select
            value={selectedCountry}
            onChange={(e) => updateFilters({ country: e.target.value })}
            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 bg-[#F0F3F7] text-sm text-[#333333] focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all"
          >
            <option value="">All countries</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryCodeToFlag(c.code)} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Briefcase className="w-4 h-4 mr-2" />
          Browse by Category
        </h3>
        <div className="flex flex-wrap gap-2">
          {professionalCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => updateFilters({ category: category === selectedCategory ? null : category })}
              className={`
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors
                ${selectedCategory === category
                  ? 'bg-[#458B9E] text-white'
                  : 'bg-[#F0F3F7] text-[#333333] hover:bg-[#e0e5eb]'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
