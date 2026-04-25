'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { searchUsers, sendConnectionRequest } from '@/features/connections/actions';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, User, Building, MapPin, UserPlus, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !session?.user?.id) return;

    setIsSearching(true);
    try {
      const result = await searchUsers(query, session.user.id);
      if (result.success && result.users) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = async (userId: string) => {
    if (!session?.user?.id) return;

    setConnecting(userId);
    try {
      const result = await sendConnectionRequest(session.user.id, userId);
      if (result.success) {
        setConnected(new Set([...connected, userId]));
        router.refresh();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#333333] mb-2">Find People</h1>
        <p className="text-gray-600">Search for professionals to connect with</p>
      </div>

      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, email, title, or company..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" isLoading={isSearching}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>
      </Card>

      {users.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="p-6">
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
                  {user.isPartner && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#FFC93C] text-[#333333] text-xs font-semibold rounded-full">
                      Partner
                    </span>
                  )}
                  <div className="mt-4">
                    {connected.has(user.id) ? (
                      <Button size="sm" disabled>
                        <Check className="w-3 h-3 mr-1" />
                        Request Sent
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(user.id)}
                        isLoading={connecting === user.id}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {query && users.length === 0 && !isSearching && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
            <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
          </div>
        </Card>
      )}
    </div>
  );
}

