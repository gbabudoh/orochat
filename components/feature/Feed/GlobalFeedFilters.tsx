'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Globe, Briefcase, X, SlidersHorizontal } from 'lucide-react';
import { COUNTRIES, countryCodeToFlag } from '@/lib/constants/countries';
import { PROFESSIONAL_CATEGORIES } from '@/lib/constants/categories';
import HelpTooltip from '@/components/ui/HelpTooltip';

const professionalCategories = PROFESSIONAL_CATEGORIES.map((c) => c.label);

export default function GlobalFeedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCountry = searchParams.get('country') || '';
  const selectedCategory = searchParams.get('category') || '';

  const activeFiltersCount = (selectedCountry ? 1 : 0) + (selectedCategory ? 1 : 0);

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

  const clearAllFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#458B9E]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Global Filters & Categories
          </h3>
          <HelpTooltip
            title="Country & Category Filters"
            description="Filter public posts worldwide by registered country or industry category domain."
            tips={[
              'Filter by 240+ countries to see local professional activity.',
              'Click any of the 22 categories to use AI semantic matching.',
              'Click Clear Filters to return to the full worldwide feed.',
            ]}
          />
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#458B9E]/10 text-[#458B9E] text-[10px] font-bold">
              {activeFiltersCount} active
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Country Filter Selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#458B9E]" />
          <span>Filter by Country</span>
        </label>
        <div className="relative max-w-sm">
          <select
            value={selectedCountry}
            onChange={(e) => updateFilters({ country: e.target.value })}
            className="w-full appearance-none px-3.5 py-2 rounded-xl border border-gray-300 bg-gray-50 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all font-medium"
          >
            <option value="">🌐 All Countries Worldwide</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryCodeToFlag(c.code)} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-purple-600" />
          <span>Browse Professional Category</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {professionalCategories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => updateFilters({ category: isSelected ? null : category })}
                className={`
                  px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border
                  ${isSelected
                    ? 'bg-[#458B9E] text-white border-[#458B9E] shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300'
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
