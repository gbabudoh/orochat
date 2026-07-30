import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserConnections, getPendingRequests } from '@/features/connections/actions';
import { getPresenceMap } from '@/lib/presence.server';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { Users, MessageSquare, User, Clock, UserPlus, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import PendingRequestActions from '@/components/feature/Connections/PendingRequestActions';

export default async function MyOrosPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const connectionsResult = await getUserConnections(session.user.id);
  const connections = connectionsResult.success ? connectionsResult.connections || [] : [];
  const presenceByUserId = await getPresenceMap(connections.map((c) => c.oro.id));

  const pendingResult = await getPendingRequests(session.user.id);
  const pendingRequests = pendingResult.success ? pendingResult.requests || [] : [];

  interface PendingRequest {
    id: string;
    sender: {
      id: string;
      name: string;
      avatar: string | null;
      title: string | null;
    };
  }

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1">My Oros</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {connections.length} verified {connections.length === 1 ? 'connection' : 'connections'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            href="/oro/consults"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-colors shrink-0 whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find a consult</span>
          </Link>
          <Link href="/oro/discover" className="shrink-0">
            <Button size="sm" className="sm:text-base sm:px-4 sm:py-2 whitespace-nowrap rounded-full">
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Find People</span>
            </Button>
          </Link>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center space-x-2 mb-4 text-[#458B9E]">
            <Clock className="w-5 h-5" />
            <h2 className="text-xl font-bold">Pending Requests</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((request: PendingRequest) => (
              <Card key={request.id} className="p-4 border-[#458B9E]/30 bg-[#458B9E]/5 rounded-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <UserAvatar
                    userId={request.sender.id}
                    name={request.sender.name}
                    avatarUrl={request.sender.avatar}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#333333] truncate text-sm">{request.sender.name}</p>
                    <p className="text-xs text-gray-500 truncate">{request.sender.title || 'Professional'}</p>
                  </div>
                </div>
                <PendingRequestActions connectionId={request.id} userId={session.user.id} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {connections.length === 0 ? (
        <Card className="rounded-2xl border border-gray-200/90 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#458B9E]" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">No Oros yet</p>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
            Start connecting with professionals to build your verified Oro network.
          </p>
          <Link href="/oro/discover">
            <Button className="rounded-full px-6">
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Find People</span>
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {connections.map((connection) => {
            const oro = connection.oro;
            const isOnline = presenceByUserId[oro.id] === 'online';
            return (
              <Card key={connection.id} hover className="p-4 sm:p-5 border border-gray-200/90 rounded-2xl transition-all duration-300">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Link href={`/oro/${oro.id}?from=oro`} className="shrink-0">
                    <UserAvatar
                      userId={oro.id}
                      name={oro.name}
                      avatarUrl={oro.avatar}
                      size="lg"
                      presence={isOnline ? 'online' : 'offline'}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <Link href={`/oro/${oro.id}?from=oro`} className="min-w-0">
                        <h3 className="font-bold text-gray-900 hover:text-[#458B9E] transition-colors truncate text-sm sm:text-base">
                          {oro.name}
                        </h3>
                      </Link>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 ${
                        isOnline
                          ? 'bg-green-50 text-green-700 border border-green-200/60'
                          : 'bg-gray-50 text-gray-500 border border-gray-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                      </span>
                    </div>

                    {oro.title && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{oro.title}</p>
                    )}
                    {oro.company && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{oro.company}</p>
                    )}

                    {oro.consultEnabled && (
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[#458B9E]/10 text-[#458B9E] text-[10px] sm:text-xs font-semibold rounded-full border border-[#458B9E]/20">
                        Bookable Consult
                      </span>
                    )}

                    <div className="mt-4 flex items-center gap-2 flex-wrap sm:flex-nowrap pt-2 border-t border-gray-100">
                      <Link href={`/collab/${oro.id}`} className="flex-1 min-w-0">
                        <Button size="sm" className="w-full text-xs py-1.5 rounded-xl bg-[#458B9E] text-white hover:bg-[#3a7585] shadow-xs">
                          <MessageSquare className="w-3.5 h-3.5 mr-1 shrink-0" />
                          <span>Message</span>
                        </Button>
                      </Link>

                      <Link href={`/oro/${oro.id}?from=oro`} className="flex-1 min-w-0">
                        <Button size="sm" variant="ghost" className="w-full text-xs py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:border-[#458B9E] hover:text-[#458B9E]">
                          <User className="w-3.5 h-3.5 mr-1 shrink-0" />
                          <span>Profile</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


