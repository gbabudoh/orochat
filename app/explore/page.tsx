'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, User, Building, MapPin, Users, Briefcase, LogOut, Home, AtSign, Globe } from 'lucide-react';
import Link from 'next/link';
import { COUNTRIES, countryCodeToFlag, getCountryName, getFlagImageUrl } from '@/lib/constants/countries';
import { PROFESSIONAL_CATEGORIES } from '@/lib/constants/categories';

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

  const runSearch = async (overrides?: { category?: string | null; country?: string }) => {
    const category = overrides?.category !== undefined ? overrides.category : selectedCategory;
    const country = overrides?.country !== undefined ? overrides.country : selectedCountry;

    setHasSearched(true);

    if (!searchQuery.trim() && !category && !country) {
      setUsers([]);
      return;
    }

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
              <img src="/logo.png" alt="Orochat Logo" className="h-9 sm:h-14 w-auto" />
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
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-[#458B9E] rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#333333] mb-3 sm:mb-4">
            Explore Professionals
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Discover and connect with professionals across industries. Search by name, company, or browse by category.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Search by name, company, title, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" isLoading={isSearching} className="sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Country Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Filter by Country
            </h3>
            <div className="relative max-w-xs">
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
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

          {/* Professional Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Browse by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {professionalCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
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
        </Card>

        {/* Loading skeleton */}
        {isSearching && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-3 w-1/3 bg-gray-100 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!isSearching && users.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[#333333]">
                {selectedCategory ? `${selectedCategory} Professionals` : 'Search Results'}
              </h2>
              <span className="text-sm text-gray-600">{users.length} {users.length === 1 ? 'result' : 'results'}</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {users.map((user) => (
                <Card key={user.id} hover className="p-5 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Link href={`/oro/${user.id}`} className="shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#458B9E] flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity">
                        {user.avatar ? (
                          <img
                            src={`/api/user/${user.id}/avatar`}
                            alt={user.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/oro/${user.id}`} className="min-w-0">
                          <h3 className="font-semibold text-[#333333] hover:text-[#458B9E] transition-colors truncate">
                            {user.name}
                          </h3>
                        </Link>
                        {user.isPartner && (
                          <span className="shrink-0 px-2 py-0.5 bg-[#FFC93C] text-[#333333] text-[10px] font-semibold rounded-full">
                            Partner
                          </span>
                        )}
                      </div>
                      {user.username && (
                        <div className="flex items-center text-xs text-gray-400 mt-0.5">
                          <AtSign className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{user.username}</span>
                        </div>
                      )}
                      {user.title && (
                        <p className="text-sm text-gray-600 truncate mt-1">{user.title}</p>
                      )}
                      {user.company && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Building className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{user.company}</span>
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{user.location}</span>
                        </div>
                      )}
                      {user.countryCode && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
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
                      <div className="flex items-center mt-3 text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        <span>{user.verifiedOrosCount || 0} Oros</span>
                      </div>
                      <div className="mt-4">
                        <Link href={`/oro/${user.id}`}>
                          <Button size="sm" variant="ghost" className="w-full">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && !hasSearched && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#458B9E]/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#458B9E]" />
              </div>
              <p className="text-gray-500 mb-2">Start exploring</p>
              <p className="text-sm text-gray-400">
                Search for professionals or browse by category to discover people on Orochat
              </p>
            </div>
          </Card>
        )}

        {/* No Results */}
        {!isSearching && hasSearched && users.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No results found</p>
              <p className="text-sm text-gray-400">Try a different search term or category</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
