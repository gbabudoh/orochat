import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { User, Building, MapPin, Users, TrendingUp, Award, Briefcase, Mail, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';
import ProfileActions from '@/components/feature/Profile/ProfileActions';

export default async function OroProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Always fetch fresh data from database
  const user = await db.user.findUnique({
    where: { id },
  });

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

  // Parse qualifications and work history
  let qualifications: string[] = [];
  let workHistory: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
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

  // Check connection status (only if authenticated)
  let connection = null;
  let isOwnProfile = false;
  let isConnected = false;
  let hasPendingRequest = false;

  if (session?.user?.id) {
    connection = await db.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: id },
          { senderId: id, receiverId: session.user.id },
        ],
      },
    });

    isOwnProfile = session.user.id === id;
    isConnected = connection?.status === 'ACCEPTED';
    hasPendingRequest = connection?.status === 'PENDING';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="w-full md:max-w-7xl md:mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-6">
        {/* Top Bar with Actions */}
        <div className="flex justify-between items-center mb-4 md:mb-6 px-4 md:px-0 py-3 md:py-0">
          <div className="flex items-center space-x-4">
            <Link href="/feed" className="text-gray-600 hover:text-[#458B9E] transition-colors">
              ← Back to Feed
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {session && isOwnProfile && (
              <Link href="/settings/profile">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            )}
            {session && !isOwnProfile && (
              <ProfileActions 
                userId={id}
                currentUserId={session.user.id}
                isConnected={isConnected}
                hasPendingRequest={hasPendingRequest}
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
        <Card padding="none" className="mb-4 md:mb-6 shadow-xl md:border-0 border-0 overflow-hidden md:rounded-2xl rounded-none">
          {/* Cover Background */}
          <div className="h-20 md:h-48 bg-gradient-to-r from-[#458B9E] via-[#5BA3B8] to-[#458B9E] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          </div>
          
          {/* Mobile Layout */}
          <div className="md:hidden px-4 pb-6">
            {/* Avatar */}
            <div className="flex justify-center -mt-12 mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <Image 
                        src={user.avatar} 
                        alt={user.name} 
                        width={96} 
                        height={96} 
                        className="w-full h-full object-cover rounded-xl" 
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                </div>
                {user.isPartner && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#FFC93C] to-[#FFD700] text-[#333333] text-xs font-bold rounded-full shadow-lg">
                      Partner
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
              {user.title && <p className="text-sm text-gray-700 font-medium">{user.title}</p>}
              {user.company && (
                <div className="flex items-center justify-center text-[#458B9E] font-semibold text-sm mt-2">
                  <Building className="w-4 h-4 mr-1.5" />
                  {user.company}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-3 bg-gradient-to-br from-[#458B9E]/10 to-transparent rounded-lg">
                <div className="text-xl font-bold text-[#458B9E]">{user.verifiedOrosCount}</div>
                <div className="text-xs text-gray-600">Connections</div>
              </div>
              {user.isPartner && (
                <div className="text-center p-3 bg-gradient-to-br from-[#FFC93C]/10 to-transparent rounded-lg">
                  <div className="text-xl font-bold text-[#FFC93C]">{user.currentTES.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">TES</div>
                </div>
              )}
              {workHistory.length > 0 && (
                <div className="text-center p-3 bg-gradient-to-br from-gray-100 to-transparent rounded-lg">
                  <div className="text-xl font-bold text-gray-700">{workHistory.length}</div>
                  <div className="text-xs text-gray-600">Positions</div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {user.location && (
                <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                  <MapPin className="w-4 h-4 text-[#458B9E] mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.location}</p>
                  </div>
                </div>
              )}
              {user.email && (
                <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                  <Mail className="w-4 h-4 text-[#458B9E] mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-4 h-4 text-[#458B9E] mr-2 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="font-semibold text-sm text-gray-900">
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
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-40 h-40 rounded-3xl bg-white p-2 shadow-2xl">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <Image 
                          src={user.avatar} 
                          alt={user.name} 
                          width={160} 
                          height={160} 
                          className="w-full h-full object-cover rounded-2xl" 
                        />
                      ) : (
                        <User className="w-20 h-20 text-white" />
                      )}
                    </div>
                  </div>
                  {user.isPartner && (
                    <div className="absolute -bottom-2 -right-2">
                      <div className="px-3 py-1.5 bg-gradient-to-r from-[#FFC93C] to-[#FFD700] text-[#333333] text-xs font-bold rounded-full shadow-lg flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <span>Partner</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.name}</h1>
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
                  {user.email && (
                    <div className="flex items-start p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mr-4 flex-shrink-0">
                        <Mail className="w-5 h-5 text-[#458B9E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="font-bold text-gray-900 text-base break-all">{user.email}</p>
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
        <div className="space-y-4 md:space-y-6 px-4 md:px-0">
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
            <div className="grid md:grid-cols-3 gap-6">
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
                    <h2 className="text-2xl font-bold text-gray-900">Licenses & Certifications</h2>
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
        </div>
      </div>
    </div>
  );
}
