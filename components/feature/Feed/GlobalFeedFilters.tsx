'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Globe, Briefcase, X, SlidersHorizontal, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { COUNTRIES, countryCodeToFlag } from '@/lib/constants/countries';
import { PROFESSIONAL_CATEGORIES } from '@/lib/constants/categories';
import HelpTooltip from '@/components/ui/HelpTooltip';

const professionalCategories = PROFESSIONAL_CATEGORIES.map((c) => c.label);

export default function GlobalFeedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showAllCategories, setShowAllCategories] = useState(false);

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

  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const filteredCategories = professionalCategories.filter((cat) =>
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())
  );

  const visibleCategories = showAllCategories || categorySearchQuery.trim() !== ''
    ? filteredCategories
    : filteredCategories.slice(0, 9);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs space-y-5 transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#458B9E]/10 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#458B9E]" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider shrink-0">
            Global Activity Filters
          </h3>
          <HelpTooltip
            title="Country & Category Filters"
            description="Filter public posts worldwide by registered country or industry category domain."
            tips={[
              'Filter by 240+ countries to see local professional activity.',
              'Click any category to use AI semantic matching.',
              'Click Clear Filters to return to the full worldwide feed.',
            ]}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          {activeFiltersCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-[#458B9E]/15 text-[#458B9E] text-xs font-extrabold shrink-0 border border-[#458B9E]/20">
              {activeFiltersCount} active
            </span>
          )}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0 border border-rose-200/60"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Country Filter Selector */}
      <div>
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#458B9E]" />
          <span>Filter by Country</span>
        </label>
        <div className="relative max-w-sm">
          <select
            value={selectedCountry}
            onChange={(e) => updateFilters({ country: e.target.value })}
            className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all font-semibold cursor-pointer shadow-2xs"
          >
            <option value="">🌐 All Countries Worldwide</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryCodeToFlag(c.code)} {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Category Section Header & Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-purple-600" />
            <span>Browse Professional Categories ({professionalCategories.length})</span>
          </label>

          <div className="flex items-center gap-2">
            {/* Quick Micro-Search Filter Input */}
            <input
              type="text"
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#458B9E] focus:bg-white placeholder:text-slate-400 font-medium max-w-[170px]"
            />

            {!categorySearchQuery && (
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#458B9E] hover:text-[#387383] transition-colors cursor-pointer bg-[#458B9E]/10 hover:bg-[#458B9E]/15 px-2.5 py-1 rounded-lg shrink-0"
              >
                <span>{showAllCategories ? 'Show Less' : 'View All'}</span>
                {showAllCategories ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Selected Category Highlight Chip */}
        {selectedCategory && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#458B9E] text-white shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Category: {selectedCategory}</span>
            <button
              type="button"
              onClick={() => updateFilters({ category: null })}
              className="ml-1 text-white/80 hover:text-white"
              title="Clear category filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Uniform Equal-Width 2/3-Column CSS Grid Layout */}
        {visibleCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {visibleCategories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => updateFilters({ category: isSelected ? null : category })}
                  className={`
                    w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center justify-between gap-2 text-left truncate select-none shadow-2xs
                    ${
                      isSelected
                        ? 'bg-[#458B9E] text-white border-[#458B9E] font-bold shadow-xs'
                        : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900'
                    }
                  `}
                >
                  <span className="truncate">{category}</span>
                  {isSelected ? (
                    <X className="w-3.5 h-3.5 text-white/90 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#458B9E] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2 text-center">
            No categories matching &quot;{categorySearchQuery}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
