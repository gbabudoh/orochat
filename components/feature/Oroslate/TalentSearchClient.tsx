'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Building, MapPin, UserPlus, Check, ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { searchTalentForOrg, inviteToOrganization } from '@/features/oroslate/actions';

interface TalentResult {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  verifiedOrosCount: number;
  currentTES: number;
}

interface TalentSearchClientProps {
  organizationId: string;
  organizationName: string;
  currentUserId: string;
}

export default function TalentSearchClient({ organizationId, organizationName, currentUserId }: TalentSearchClientProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TalentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError('');
    try {
      const result = await searchTalentForOrg(organizationId, currentUserId, query);
      if (result.success && result.results) {
        setResults(result.results);
      } else {
        setError(result.error || 'Search failed');
      }
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleInvite = async (userId: string) => {
    setInvitingId(userId);
    setError('');
    try {
      const result = await inviteToOrganization(organizationId, currentUserId, userId);
      if (result.success) {
        setInvitedIds((prev) => new Set(prev).add(userId));
      } else {
        setError(result.error || 'Failed to invite');
      }
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-5 sm:py-8">
      <Link
        href={`/oroslate/org/${organizationId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#458B9E] transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {organizationName}
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Find Talent</h1>
      <p className="text-sm sm:text-base text-gray-500 mb-6">
        Search verified Oros by title, company, or skills and invite them into {organizationName}.
      </p>

      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="e.g., React developer, product designer, fintech…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" isLoading={isSearching} className="sm:w-auto w-full">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>
      </Card>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {results.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((user) => {
            const isInvited = invitedIds.has(user.id);
            return (
              <Card key={user.id} className="p-5">
                <div className="flex items-start gap-3">
                  <Link href={`/oro/${user.id}`} className="shrink-0">
                    <UserAvatar userId={user.id} name={user.name} avatarUrl={user.avatar} size="lg" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/oro/${user.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-[#458B9E] transition-colors truncate">
                        {user.name}
                      </h3>
                    </Link>
                    {user.title && <p className="text-xs text-gray-600 truncate mt-0.5">{user.title}</p>}
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
                  </div>
                </div>

                <div className="mt-4">
                  {isInvited ? (
                    <Button size="sm" variant="secondary" disabled className="w-full">
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Invited
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleInvite(user.id)}
                      isLoading={invitingId === user.id}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Invite
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {hasSearched && !isSearching && results.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No matching Oros found</p>
            <p className="text-sm text-gray-400 mt-2">Try a different name, title, or company</p>
          </div>
        </Card>
      )}
    </div>
  );
}
