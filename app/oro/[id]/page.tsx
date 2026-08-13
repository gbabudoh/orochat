import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { User, Building, MapPin, Users, TrendingUp, Award, Briefcase, AtSign, Calendar, Edit, FileText, GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProfileActions from '@/components/feature/Profile/ProfileActions';
import ProfileAvatar from '@/components/feature/Profile/ProfileAvatar';
import BookConsultButton from '@/components/feature/Booking/BookConsultButton';
import { getCountryName } from '@/lib/constants/countries';
import { COUNTRY_COORDINATES } from '@/lib/constants/countryCoords';
import { logProfileView } from '@/lib/profileViews';
import ScrollToTop from '@/components/ui/ScrollToTop';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { name: true, title: true, company: true, bio: true, location: true, avatar: true, isPaused: true },
  });

  if (!user || user.isPaused) {
    return { title: 'Profile not found' };
  }

  const title = [user.name, user.title].filter(Boolean).join(' — ');
  const description = user.bio || [user.title, user.company, user.location].filter(Boolean).join(' at ') || `${user.name}'s profile on Orochat`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: user.avatar ? [{ url: `/api/user/${id}/avatar` }] : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function OroProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const origin = resolvedSearchParams.from;
  const session = await getServerSession(authOptions);

  let backHref = '/feed';
  let backLabel = '← Back to Feed';

  if (origin === 'explore') {
    backHref = '/explore';
    backLabel = '← Back to Explore';
  } else if (origin === 'consults') {
    backHref = '/oro/consults';
    backLabel = '← Back to Consults';
  } else if (origin === 'oro' || origin === 'connections') {
    backHref = '/oro';
    backLabel = '← Back to My Oros';
  }

  // Fetch user profile, post count, connection status, and block status in parallel
  const [user, postsCount, connection, block] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.feedPost.count({ where: { authorId: id } }),
    session?.user?.id
      ? db.connection.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: id },
              { senderId: id, receiverId: session.user.id },
            ],
          },
        })
      : Promise.resolve(null),
    session?.user?.id
      ? db.block.findFirst({
          where: {
            OR: [
              { blockerId: session.user.id, blockedId: id },
              { blockerId: id, blockedId: session.user.id },
            ],
          },
        })
      : Promise.resolve(null),
  ]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-16">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">Profile not found</p>
          </div>
        </Card>
      </div>
    );
  }

  // Parse qualifications, work history, and education
  let qualifications: string[] = [];
  let workHistory: Array<{
    company: string;
    position: string;
    city?: string;
    country?: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }> = [];
  let education: Array<{
    institution: string;
    city: string;
    country: string;
    yearCompleted: string;
  }> = [];

  try {
    if (user.qualifications) {
      const parsed = JSON.parse(user.qualifications);
      qualifications = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}

  try {
    if (user.workHistory) {
      const parsed = JSON.parse(user.workHistory);
      workHistory = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}

  try {
    if (user.education) {
      const parsed = JSON.parse(user.education);
      education = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}

  const isOwnProfile = session?.user?.id === id;
  const isConnected = connection?.status === 'ACCEPTED';
  const hasPendingRequest = connection?.status === 'PENDING';
  const isBlocked = !!block;

  // Log profile view asynchronously without blocking page rendering
  if (!isOwnProfile) {
    logProfileView(id, session?.user?.id ?? null).catch(() => {});
  }

  // Geo-aware structured data: country-level coordinates so search/AI
  // engines can surface this profile in location-relevant queries
  // (e.g. "software engineers in Nigeria") without exposing a precise
  // address — Orochat only stores country-level location data.
  const countryName = getCountryName(user.countryCode);
  const coords = user.countryCode ? COUNTRY_COORDINATES[user.countryCode.toUpperCase()] : undefined;
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.name,
    ...(user.title ? { jobTitle: user.title } : {}),
    ...(user.company ? { worksFor: { '@type': 'Organization', name: user.company } } : {}),
    ...(user.bio ? { description: user.bio } : {}),
    ...(countryName
      ? {
          address: { '@type': 'PostalAddress', addressCountry: countryName },
          ...(coords ? { homeLocation: { '@type': 'Place', geo: { '@type': 'GeoCoordinates', latitude: coords[0], longitude: coords[1] } } } : {}),
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <ScrollToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="w-full md:max-w-7xl md:mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-6">
        {/* Top Bar with Actions */}
        <div className="flex flex-row justify-between items-center mb-4 md:mb-6 px-2.5 md:px-0 py-1 md:py-0">
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all shrink-0 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4 text-[#458B9E]" />
              <span>{backLabel.replace('← ', '')}</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {session && isOwnProfile && (
              <Link href="/settings/profile">
                <Button variant="ghost" size="sm" className="rounded-xl border border-slate-200/90 text-xs font-semibold">
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit Profile
                </Button>
              </Link>
            )}
            {session && !isOwnProfile && (
              <ProfileActions
                userId={id}
                userName={user.name}
                currentUserId={session.user.id}
                isConnected={isConnected}
                hasPendingRequest={hasPendingRequest}
                isBlocked={isBlocked}
              />
            )}
            {session && !isOwnProfile && !isBlocked && user.consultEnabled && user.consultPriceCents && user.consultTopic && (
              <BookConsultButton
                oroId={id}
                customerId={session.user.id}
                priceCents={user.consultPriceCents}
                topic={user.consultTopic}
                description={user.consultDescription}
                outcomes={user.consultOutcomes}
              />
            )}
            {!session && (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <Card padding="none" className="mb-4 md:mb-6 shadow-xs border border-slate-200/80 bg-white overflow-hidden rounded-2xl mx-1 md:mx-0">
          {/* Cover Background */}
          <div className="h-28 md:h-48 bg-gradient-to-r from-[#458B9E] via-[#366f7e] to-[#2a5662] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
          </div>
          
          {/* Mobile Layout */}
          <div className="md:hidden px-3.5 pb-6">
            {/* Avatar */}
            <div className="flex justify-center -mt-14 mb-3">
              <ProfileAvatar
                userId={user.id}
                name={user.name}
                hasAvatar={!!user.avatar}
                isPartner={user.isPartner}
                size="md"
              />
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
                {user.isPartner && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-amber-300 shadow-2xs">
                    <Award className="w-3 h-3 text-amber-950" />
                    <span>Partner</span>
                  </span>
                )}
              </div>
              {user.title && <p className="text-xs sm:text-sm text-slate-600 font-semibold">{user.title}</p>}
              {user.company && (
                <div className="inline-flex items-center justify-center gap-1.5 text-[#458B9E] font-bold text-xs mt-1.5 px-2.5 py-0.5 rounded-lg bg-[#458B9E]/10 border border-[#458B9E]/20">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span>{user.company}</span>
                </div>
              )}
            </div>

            {/* Balanced Mobile Stats Grid */}
            <div className={`grid gap-2 mb-4 ${
              (user.isPartner && workHistory.length > 0)
                ? 'grid-cols-2 sm:grid-cols-4'
                : (user.isPartner || workHistory.length > 0)
                ? 'grid-cols-3'
                : 'grid-cols-2'
            }`}>
              <div className="text-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-lg sm:text-xl font-extrabold text-[#458B9E]">{user.verifiedOrosCount}</div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-600">Connections</div>
              </div>
              <div className="text-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-lg sm:text-xl font-extrabold text-[#458B9E]">{postsCount}</div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-600">Oro Posts</div>
              </div>
              {user.isPartner && (
                <div className="text-center p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 shadow-2xs">
                  <div className="text-lg sm:text-xl font-extrabold text-amber-900">{user.currentTES.toFixed(0)}</div>
                  <div className="text-[10px] sm:text-xs font-bold text-amber-800">TES Score</div>
                </div>
              )}
              {workHistory.length > 0 && (
                <div className="text-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-lg sm:text-xl font-extrabold text-slate-700">{workHistory.length}</div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-600">Positions</div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {user.location && (
                <div className="flex items-center p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 shadow-2xs">
                  <MapPin className="w-4 h-4 text-[#458B9E] mr-2.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Location</p>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{user.location}</p>
                  </div>
                </div>
              )}
              {user.username && (
                <div className="flex items-center p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 shadow-2xs">
                  <AtSign className="w-4 h-4 text-[#458B9E] mr-2.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Handle</p>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">@{user.username}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 shadow-2xs">
                <Calendar className="w-4 h-4 text-[#458B9E] mr-2.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Joined</p>
                  <p className="font-bold text-xs sm:text-sm text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block px-8 pb-8">
            <div className="flex gap-8 -mt-20">
              {/* Avatar */}
              <div className="shrink-0">
                <ProfileAvatar
                  userId={user.id}
                  name={user.name}
                  hasAvatar={!!user.avatar}
                  isPartner={user.isPartner}
                  size="lg"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 mt-20">
                <div className="mb-6">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">{user.name}</h1>
                    {user.isPartner && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#FFC93C] to-[#FFD700] text-[#333333] text-xs font-bold rounded-full border border-amber-300 shadow-xs">
                        <Award className="w-4 h-4 text-[#333333]" />
                        <span>Partner</span>
                      </span>
                    )}
                  </div>
                  {user.title && <p className="text-xl text-gray-700 mb-1 font-medium">{user.title}</p>}
                  {user.company && (
                    <div className="flex items-center text-[#458B9E] font-semibold text-lg mt-2">
                      <Building className="w-5 h-5 mr-2" />
                      {user.company}
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {user.isPartner && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-[#FFC93C]/20 to-[#FFD700]/20 border border-[#FFC93C] text-[#333333] text-xs font-bold rounded-full flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>Orochat Partner</span>
                    </span>
                  )}
                  {user.verifiedOrosCount >= 50 && (
                    <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Super Connector</span>
                    </span>
                  )}
                  {user.verifiedOrosCount >= 100 && (
                    <span className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Network Leader</span>
                    </span>
                  )}
                  {qualifications.length >= 3 && (
                    <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-full flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>Certified Professional</span>
                    </span>
                  )}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {user.location && (
                    <div className="flex items-start p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mr-4 flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#458B9E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                        <p className="font-bold text-gray-900 text-base break-words">{user.location}</p>
                      </div>
                    </div>
                  )}
                  {user.username && (
                    <div className="flex items-start p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mr-4 flex-shrink-0">
                        <AtSign className="w-5 h-5 text-[#458B9E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Handle</p>
                        <p className="font-bold text-gray-900 text-base break-all">@{user.username}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mr-4 flex-shrink-0">
                      <Calendar className="w-5 h-5 text-[#458B9E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Joined</p>
                      <p className="font-bold text-gray-900 text-base">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-br from-[#458B9E]/10 to-transparent rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-[#458B9E] flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#458B9E]">{user.verifiedOrosCount}</div>
                      <div className="text-xs text-gray-600 font-medium">Connections</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-br from-[#458B9E]/10 to-transparent rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-[#458B9E] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#458B9E]">{postsCount}</div>
                      <div className="text-xs text-gray-600 font-medium">Oro Posts</div>
                    </div>
                  </div>
                  {user.isPartner && (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-br from-[#FFC93C]/10 to-transparent rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC93C] to-[#FFD700] flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-[#333333]" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#FFC93C]">{user.currentTES.toFixed(0)}</div>
                        <div className="text-xs text-gray-600 font-medium">TES Score</div>
                      </div>
                    </div>
                  )}
                  {workHistory.length > 0 && (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-br from-gray-100 to-transparent rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-700">{workHistory.length}</div>
                        <div className="text-xs text-gray-600 font-medium">Positions</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content - Full Width Stacked Layout */}
        <div className="space-y-4 md:space-y-6 px-2.5 md:px-0">
          {/* Network Statistics - Full Width */}
          <Card padding="lg" className="shadow-md border-t-4 border-[#458B9E]">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#458B9E]/10 flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-[#458B9E]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Network Statistics</h3>
                <p className="text-sm text-gray-600">Professional network metrics</p>
              </div>
            </div>
            <div className={`grid gap-6 ${user.isPartner ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div className="p-6 bg-gradient-to-br from-[#458B9E]/10 via-[#458B9E]/5 to-transparent rounded-xl border border-[#458B9E]/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">Verified Connections</span>
                  <div className="w-10 h-10 rounded-lg bg-[#458B9E] flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-[#458B9E] mb-3">{user.verifiedOrosCount}</div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#458B9E] to-[#5BA3B8]" 
                    style={{ width: `${Math.min((user.verifiedOrosCount / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-[#458B9E]/10 via-[#458B9E]/5 to-transparent rounded-xl border border-[#458B9E]/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">Oro Posts</span>
                  <div className="w-10 h-10 rounded-lg bg-[#458B9E] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold text-[#458B9E] mb-3">{postsCount}</div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#458B9E] to-[#5BA3B8]" 
                    style={{ width: `${Math.min((postsCount / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              {user.isPartner && (
                <div className="p-6 bg-gradient-to-br from-[#FFC93C]/10 via-[#FFD700]/5 to-transparent rounded-xl border border-[#FFC93C]/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700">Total Engagement Score</span>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFC93C] to-[#FFD700] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#333333]" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-[#FFC93C] mb-2">{user.currentTES.toFixed(0)}</div>
                  <div className="text-xs text-gray-600 font-medium">Partner Revenue Share Active</div>
                </div>
              )}
              
              <div className="p-6 bg-gradient-to-br from-gray-100 to-transparent rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">Member Since</span>
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </Card>

          {/* About */}
          {user.bio && (
              <Card padding="lg" className="shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                </div>
              </Card>
            )}

          {/* Work Experience */}
          {workHistory.length > 0 && (
              <Card padding="lg" className="shadow-md border-l-4 border-[#458B9E]">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center mr-4 shadow-md">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                    <p className="text-sm text-gray-600">Professional career history</p>
                  </div>
                </div>
                <div className="space-y-8">
                  {workHistory.map((work, index) => (
                    <div key={index} className="relative pl-8 pb-8 border-l-2 border-gray-200 last:border-0 last:pb-0">
                      <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#458B9E] border-4 border-white shadow-md" />
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-[#458B9E] hover:shadow-lg transition-all">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{work.position}</h3>
                            <div className="flex items-center text-[#458B9E] font-semibold text-lg mb-3">
                              <Building className="w-5 h-5 mr-2" />
                              {work.company}
                            </div>
                            {(work.city || work.country) && (
                              <div className="flex items-center text-gray-600 text-sm mb-1">
                                <MapPin className="w-4 h-4 mr-2" />
                                {[work.city, work.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-600 font-medium">
                            <Calendar className="w-4 h-4 text-[#458B9E]" />
                            <div>
                              {work.startDate && (
                                <>
                                  {new Date(work.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                  {' - '}
                                  {work.current ? (
                                    <span className="text-[#458B9E] font-bold">Present</span>
                                  ) : work.endDate ? (
                                    new Date(work.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                  ) : (
                                    'Present'
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {work.description && (
                          <p className="text-gray-700 leading-relaxed">{work.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Qualifications */}
          {qualifications.length > 0 && (
              <Card padding="lg" className="shadow-md border-l-4 border-[#FFC93C]">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC93C] to-[#FFD700] flex items-center justify-center mr-4 shadow-md">
                    <Award className="w-6 h-6 text-[#333333]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Qualifications & Certifications</h2>
                    <p className="text-sm text-gray-600">Professional credentials and achievements</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {qualifications.map((qual, index) => (
                    <div
                      key={index}
                      className="group p-5 bg-gradient-to-br from-white via-gray-50 to-white border-2 border-gray-200 rounded-xl hover:border-[#FFC93C] hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC93C]/20 to-[#FFD700]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Award className="w-6 h-6 text-[#FFC93C]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 leading-snug">{qual}</p>
                          <div className="mt-2 inline-flex items-center px-2 py-1 bg-[#FFC93C]/10 rounded-full">
                            <span className="text-xs font-semibold text-[#333333]">Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Education */}
          {education.length > 0 && (
              <Card padding="lg" className="shadow-md border-l-4 border-[#458B9E]">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center mr-4 shadow-md">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                    <p className="text-sm text-gray-600">Academic background</p>
                  </div>
                </div>
                <div className="space-y-8">
                  {education.map((edu, index) => (
                    <div key={index} className="relative pl-8 pb-8 border-l-2 border-gray-200 last:border-0 last:pb-0">
                      <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#458B9E] border-4 border-white shadow-md" />
                      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 hover:border-[#458B9E] hover:shadow-lg transition-all">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{edu.institution}</h3>
                            {(edu.city || edu.country) && (
                              <div className="flex items-center text-gray-600 text-sm">
                                <MapPin className="w-4 h-4 mr-2" />
                                {[edu.city, edu.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                          {edu.yearCompleted && (
                            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-600 font-medium">
                              <Calendar className="w-4 h-4 text-[#458B9E]" />
                              <span>{edu.yearCompleted}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
