'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, User, Building, MapPin, Users, Briefcase, LogOut, Home, AtSign, Globe, Map, ArrowLeft, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { COUNTRIES, countryCodeToFlag, getCountryName, getFlagImageUrl } from '@/lib/constants/countries';
import { PROFESSIONAL_CATEGORIES } from '@/lib/constants/categories';
import UserAvatar from '@/components/ui/UserAvatar';
import dynamic from 'next/dynamic';

const MapExplore = dynamic(
  () => import('@/components/feature/Profile/MapExplore'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center bg-white border border-gray-200 rounded-xl shadow-xs">
        <p className="text-gray-500 animate-pulse">Loading map interface...</p>
      </div>
    ),
  }
);

const professionalCategories = PROFESSIONAL_CATEGORIES.map((c) => c.label);

interface ExploreUser {
  id: string;
  name: string;
  username: string | null;
  avatar: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  countryCode: string | null;
  isPartner: boolean;
  verifiedOrosCount: number;
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const runSearch = async (overrides?: { category?: string | null; country?: string }) => {
    const category = overrides?.category !== undefined ? overrides.category : selectedCategory;
    const country = overrides?.country !== undefined ? overrides.country : selectedCountry;

    setHasSearched(true);
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (category) params.set('category', category);
      if (country) params.set('country', country);

      const response = await fetch(`/api/explore/search?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    runSearch();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  const handleCategoryClick = (category: string) => {
    const next = category === selectedCategory ? null : category;
    setSelectedCategory(next);
    runSearch({ category: next });
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    runSearch({ country });
  };

  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center min-w-0">
              <img src="/logo.png" alt="Orochat Logo" className="h-12 sm:h-14 w-auto" />
            </Link>

            {session ? (
              <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                <Link href="/feed">
                  <Button variant="ghost" size="sm">
                    <Home className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#F0F3F7] transition-colors"
                  >
                    <UserAvatar
                      userId={session.user.id}
                      name={session.user.name || 'User'}
                      avatarUrl={session.user.image}
                      size="sm"
                    />
                    {session.user?.isPartner && (
                      <span className="hidden sm:inline px-2 py-0.5 bg-[#FFC93C] text-[#333333] text-xs font-semibold rounded-full">
                        Partner
                      </span>
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-[#333333] truncate">{session.user?.name}</p>
                      </div>
                      <Link
                        href={`/oro/${session.user?.id}`}
                        className="block px-4 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        View Profile
                      </Link>
                      <Link
                        href="/settings/profile"
                        className="block px-4 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7]"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Settings
                      </Link>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/explore' });
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#D32F2F] hover:bg-[#F0F3F7] flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <Link href="/login" className="text-sm sm:text-base text-[#333333] hover:text-[#458B9E] transition-colors">
                  Login
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {session && (
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#458B9E] hover:underline mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
        )}

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#333333] mb-2 sm:mb-3">
            Explore Professionals
          </h1>
          <p className="text-xs sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Discover and connect with professionals across industries. Search by name, company, or browse by category.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6 border border-gray-200/90 rounded-2xl shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Search name, company, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" isLoading={isSearching} className="sm:w-auto rounded-xl bg-[#458B9E] hover:bg-[#3a7585] text-white">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Country Filter */}
          <div className="mb-6">
            <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center">
              <Globe className="w-4 h-4 mr-1.5 text-[#458B9E]" />
              Filter by Country
            </h3>
            <div className="relative max-w-xs">
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50/70 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 transition-all cursor-pointer"
              >
                <option value="">All countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {countryCodeToFlag(c.code)} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Professional Categories */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-3 flex items-center">
              <Briefcase className="w-4 h-4 mr-1.5 text-[#458B9E]" />
              Browse by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {professionalCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border
                    ${selectedCategory === category
                      ? 'bg-[#458B9E] text-white border-[#458B9E] shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Loading skeleton */}
        {isSearching && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-3 sm:p-6 rounded-2xl animate-pulse">
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-2 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 w-full space-y-2 pt-1">
                    <div className="h-4 w-2/3 mx-auto sm:mx-0 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 mx-auto sm:mx-0 bg-gray-100 rounded" />
                    <div className="h-3 w-1/3 mx-auto sm:mx-0 bg-gray-100 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!isSearching && users.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {selectedCategory ? `${selectedCategory} Professionals` : 'Search Results'}
                </h2>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">{users.length} {users.length === 1 ? 'result' : 'results'}</span>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-xs self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                    ${viewMode === 'list'
                      ? 'bg-[#458B9E] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-[#F0F3F7] hover:text-[#333333]'
                    }
                  `}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                    ${viewMode === 'map'
                      ? 'bg-[#458B9E] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-[#F0F3F7] hover:text-[#333333]'
                    }
                  `}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Map View</span>
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {users.map((user) => (
                  <Card key={user.id} hover className="p-4 sm:p-5 rounded-2xl border border-gray-200/90 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-3 sm:gap-4 mb-3">
                        <Link href={`/oro/${user.id}?from=explore`} className="shrink-0">
                          <UserAvatar
                            userId={user.id}
                            name={user.name}
                            avatarUrl={user.avatar}
                            size="lg"
                            className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
                          />
                        </Link>
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                            <Link href={`/oro/${user.id}?from=explore`} className="min-w-0">
                              <h3 className="font-bold text-sm sm:text-base text-gray-900 hover:text-[#458B9E] transition-colors truncate">
                                {user.name}
                              </h3>
                            </Link>
                            {user.isPartner && (
                              <span className="shrink-0 px-2 py-0.5 bg-[#FFC93C] text-[#333333] text-[10px] font-bold rounded-full">
                                Partner
                              </span>
                            )}
                          </div>
                          {user.username && (
                            <div className="flex items-center justify-center sm:justify-start text-xs text-gray-400 mt-0.5">
                              <AtSign className="w-3 h-3 mr-1 shrink-0" />
                              <span className="truncate">{user.username}</span>
                            </div>
                          )}
                          {user.title && (
                            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate mt-1">{user.title}</p>
                          )}
                          {user.company && (
                            <div className="flex items-center justify-center sm:justify-start text-xs text-gray-500 mt-1">
                              <Building className="w-3.5 h-3.5 mr-1 shrink-0 text-gray-400" />
                              <span className="truncate">{user.company}</span>
                            </div>
                          )}
                          {user.location && (
                            <div className="flex items-center justify-center sm:justify-start text-xs text-gray-500 mt-1">
                              <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-gray-400" />
                              <span className="truncate">{user.location}</span>
                            </div>
                          )}
                          {user.countryCode && (
                            <div className="hidden sm:flex items-center text-xs text-gray-500 mt-1">
                              {getFlagImageUrl(user.countryCode) && (
                                <img
                                  src={getFlagImageUrl(user.countryCode)!}
                                  alt={getCountryName(user.countryCode) ?? ''}
                                  width={16}
                                  height={12}
                                  className="mr-1 shrink-0 rounded-xs"
                                />
                              )}
                              <span className="truncate">{getCountryName(user.countryCode)}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-center sm:justify-start mt-2.5 text-xs text-gray-500 font-medium">
                            <Users className="w-3.5 h-3.5 mr-1 text-[#458B9E]" />
                            <span>{user.verifiedOrosCount || 0} Oros</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Link href={`/oro/${user.id}?from=explore`} className="block w-full">
                        <Button size="sm" className="w-full text-xs font-semibold py-2 rounded-xl bg-[#458B9E] text-white hover:bg-[#3a7585] shadow-xs">
                          <span>View Profile</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1 shrink-0" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <MapExplore users={users} />
            )}
          </div>
        )}

        {/* Empty State */}
        {!isSearching && !hasSearched && (
          <Card className="rounded-2xl border border-gray-200/90 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#458B9E]" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Start exploring</p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              Search for professionals or browse by category to discover people on Orochat
            </p>
          </Card>
        )}

        {/* No Results */}
        {!isSearching && hasSearched && users.length === 0 && (
          <Card className="rounded-2xl border border-gray-200/90 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">No results found</p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">Try a different search term or category</p>
          </Card>
        )}
      </div>
    </div>
  );
}

