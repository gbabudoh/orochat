import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserConnections, getPendingRequests } from '@/features/connections/actions';
import { getPresenceMap } from '@/lib/presence.server';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { Users, Clock, UserPlus, Search, Sparkles, Video, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import PendingRequestActions from '@/components/feature/Connections/PendingRequestActions';
import MyOrosClient from '@/components/feature/Connections/MyOrosClient';
import OroHeaderGuide from '@/components/feature/Connections/OroHeaderGuide';
import HelpTooltip from '@/components/ui/HelpTooltip';

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
    note: string | null;
    sender: {
      id: string;
      name: string;
      avatar: string | null;
      title: string | null;
    };
  }

  const onlineCount = connections.filter((c) => presenceByUserId[c.oro.id] === 'online').length;
  const consultsCount = connections.filter((c) => c.oro.consultEnabled).length;
  const partnerGoalRatio = Math.min((connections.length / 1000) * 100, 100).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Oros Network</h1>
            <HelpTooltip
              title="My Oros Network Guide"
              description="Manage verified connections, track Partner status, and book consultation sessions."
              tips={[
                'Track progress towards 1,000 verified connections for Partner status.',
                'Accept or decline pending invitations with custom notes.',
                'Use search and filter tabs to find online or bookable connections.',
              ]}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage your verified professional connections, book consults, and track Partner qualification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <OroHeaderGuide />
          <Link
            href="/oro/consults"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#458B9E] bg-[#458B9E]/10 hover:bg-[#458B9E]/20 transition-colors shrink-0 whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find a Consult</span>
          </Link>
          <Link href="/oro/discover" className="shrink-0">
            <Button size="sm" className="text-xs sm:text-sm px-4 py-2 whitespace-nowrap rounded-full bg-[#458B9E] hover:bg-[#387383]">
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Find People</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Network KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verified Oros Network */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified Oros</p>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{connections.length.toLocaleString()}</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-gray-500 font-medium">
              <span>Goal: 1,000 for Partner</span>
              <span>{partnerGoalRatio}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#458B9E] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${partnerGoalRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Invites</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{pendingRequests.length}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">
              {pendingRequests.length === 1 ? '1 invitation waiting' : `${pendingRequests.length} invitations waiting`}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Online Now */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Online Now</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{onlineCount}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Available for messaging</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Bookable Consults */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bookable Consults</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{consultsCount}</h3>
            <p className="text-xs text-purple-600 font-medium mt-1">Video consults active</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Video className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pending Requests Banner & Cards */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 text-amber-900">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="text-base font-bold">Pending Connection Invitations ({pendingRequests.length})</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((request: PendingRequest) => (
              <Card key={request.id} className="p-4 border-amber-200/90 bg-white rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    userId={request.sender.id}
                    name={request.sender.name}
                    avatarUrl={request.sender.avatar}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate text-sm">{request.sender.name}</p>
                    <p className="text-xs text-gray-500 truncate">{request.sender.title || 'Professional'}</p>
                  </div>
                </div>

                {request.note && (
                  <p className="text-xs text-gray-600 italic bg-gray-50 rounded-xl p-2.5 leading-relaxed border border-gray-100">
                    &ldquo;{request.note}&rdquo;
                  </p>
                )}

                <div className="pt-1">
                  <PendingRequestActions connectionId={request.id} userId={session.user.id} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Connections Directory */}
      <MyOrosClient
        connections={connections}
        presenceByUserId={presenceByUserId}
        sessionUserId={session.user.id}
      />
    </div>
  );
}
