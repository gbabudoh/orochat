'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, User, Building, MapPin, Users, Briefcase, LogOut, Home } from 'lucide-react';
import Link from 'next/link';

const professionalCategories = [
  'Software Engineering',
  'Product Management',
  'Marketing',
  'Sales',
  'Design',
  'Finance',
  'Consulting',
  'Healthcare',
  'Education',
  'Legal',
  'Real Estate',
  'Entrepreneurship',
];

export default function ExplorePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/explore/search?q=${encodeURIComponent(searchQuery)}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`);
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

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setSearchQuery('');
    setIsSearching(true);
    try {
      const response = await fetch(`/api/explore/search?category=${encodeURIComponent(category)}`);
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

  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <img src="/logo.png" alt="Orochat Logo" className="h-20 w-auto" />
            </Link>
            
            {/* User Menu for Logged In Users */}
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/feed">
                  <Button variant="ghost" size="sm">
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
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
                      <span className="px-2 py-0.5 bg-[#FFC93C] text-[#333333] text-xs font-semibold rounded-full">
                        Partner
                      </span>
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-[#333333]">{session.user?.name}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
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
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-[#333333] hover:text-[#458B9E] transition-colors">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#333333] mb-4">
            Explore Professionals
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover and connect with professionals across industries. Search by name, company, or browse by category.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 p-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name, company, title, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" isLoading={isSearching}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>

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
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
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

        {/* Results */}
        {users.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#333333]">
                {selectedCategory ? `${selectedCategory} Professionals` : 'Search Results'}
              </h2>
              <span className="text-sm text-gray-600">{users.length} {users.length === 1 ? 'result' : 'results'}</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <Card key={user.id} hover className="p-6">
                  <div className="flex items-start space-x-4">
                    <Link href={`/oro/${user.id}`} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-[#458B9E] flex items-center justify-center hover:opacity-80 transition-opacity">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          <User className="w-8 h-8 text-white" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/oro/${user.id}`}>
                        <h3 className="font-semibold text-[#333333] hover:text-[#458B9E] transition-colors truncate">
                          {user.name}
                        </h3>
                      </Link>
                      {user.title && (
                        <p className="text-sm text-gray-600 truncate mt-1">{user.title}</p>
                      )}
                      {user.company && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          <span className="truncate">{user.company}</span>
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center mt-3 space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{user.verifiedOrosCount || 0} Oros</span>
                        </div>
                        {user.isPartner && (
                          <span className="px-2 py-0.5 bg-[#FFC93C] text-[#333333] font-semibold rounded-full">
                            Partner
                          </span>
                        )}
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
        {!isSearching && users.length === 0 && !selectedCategory && (
          <Card>
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Start exploring</p>
              <p className="text-sm text-gray-400">
                Search for professionals or browse by category to discover people on Orochat
              </p>
            </div>
          </Card>
        )}

        {/* No Results */}
        {!isSearching && users.length === 0 && (searchQuery || selectedCategory) && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">No results found</p>
              <p className="text-sm text-gray-400">Try a different search term or category</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

