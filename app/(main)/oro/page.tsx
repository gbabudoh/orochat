import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserConnections, getPendingRequests } from '@/features/connections/actions';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Image from 'next/image';
import { Users, MessageSquare, User, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import PendingRequestActions from '@/components/feature/Connections/PendingRequestActions';

export default async function MyOrosPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const connectionsResult = await getUserConnections(session.user.id);
  const connections = connectionsResult.success ? connectionsResult.connections || [] : [];

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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#333333] mb-1">My Oros</h1>
          <p className="text-gray-600">
            {connections.length} verified {connections.length === 1 ? 'connection' : 'connections'}
          </p>
        </div>
        <Link href="/oro/discover">
          <Button>
            Find People
          </Button>
        </Link>
      </div>

      {pendingRequests.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center space-x-2 mb-4 text-[#458B9E]">
            <Clock className="w-5 h-5" />
            <h2 className="text-xl font-bold">Pending Requests</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((request: PendingRequest) => (
              <Card key={request.id} className="p-4 border-[#458B9E]/30 bg-[#458B9E]/5">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#458B9E] flex items-center justify-center flex-shrink-0">
                    {request.sender.avatar ? (
                      <Image 
                        src={request.sender.avatar} 
                        alt={request.sender.name} 
                        width={40} 
                        height={40} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#333333] truncate">{request.sender.name}</p>
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
        <Card>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No Oros yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Start connecting with professionals to build your network
            </p>
            <Link href="/oro/discover">
              <Button>Find People</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => {
            const oro = connection.oro;
            return (
              <Card key={connection.id} hover className="p-6">
                <div className="flex items-start space-x-4">
                  <Link href={`/oro/${oro.id}`} className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[#458B9E] flex items-center justify-center hover:opacity-80 transition-opacity">
                      {oro.avatar ? (
                        <Image
                          src={oro.avatar}
                          alt={oro.name}
                          width={64}
                          height={64}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/oro/${oro.id}`}>
                      <h3 className="font-semibold text-[#333333] hover:text-[#458B9E] transition-colors truncate">
                        {oro.name}
                      </h3>
                    </Link>
                    {oro.title && (
                      <p className="text-sm text-gray-600 truncate mt-1">{oro.title}</p>
                    )}
                    {oro.company && (
                      <p className="text-xs text-gray-500 truncate">{oro.company}</p>
                    )}
                    <div className="mt-4 flex items-center space-x-2">
                      <Link href={`/collab/${oro.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Message
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

