import Link from 'next/link';
import { ArrowLeft, User, Building, Video, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';

export default async function ConsultsDirectoryPage() {
  const oros = await db.user.findMany({
    where: { consultEnabled: true, isPaused: false },
    select: {
      id: true,
      name: true,
      avatar: true,
      title: true,
      company: true,
      consultTopic: true,
      consultPriceCents: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <Link
          href="/oro"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#458B9E] hover:text-[#3a7585] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Oros
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] mb-1">Find a consult</h1>
        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
          Oros currently offering paid, scheduled video consults
        </p>
      </div>

      {oros.length === 0 ? (
        <Card className="rounded-2xl border border-gray-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto my-4">
          <div className="w-16 h-16 rounded-2xl bg-[#458B9E]/10 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-[#458B9E]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">No Consultations Available Yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
            No Oros are currently offering bookable consult slots. Check back soon or explore verified connections.
          </p>
          <Link href="/oro">
            <Button variant="secondary" className="rounded-full px-6">
              Back to Connections
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {oros.map((oro) => (
            <Link key={oro.id} href={`/oro/${oro.id}?from=consults`} className="block h-full group">
              <Card hover className="p-4 sm:p-5 border border-gray-200/90 rounded-2xl h-full flex flex-col justify-between transition-all duration-300 group-hover:border-[#458B9E]/50 group-hover:shadow-md">
                <div>
                  <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    <UserAvatar
                      userId={oro.id}
                      name={oro.name}
                      avatarUrl={oro.avatar}
                      size="lg"
                      className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-[#458B9E] transition-colors truncate text-base sm:text-lg">
                        {oro.name}
                      </h3>
                      {oro.title && <p className="text-xs sm:text-sm text-gray-600 truncate mt-0.5">{oro.title}</p>}
                      {oro.company && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Building className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
                          <span className="truncate">{oro.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {oro.consultTopic && (
                    <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#458B9E] mb-1">
                        <Video className="w-3.5 h-3.5 shrink-0" />
                        <span>1-on-1 Video Session</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 leading-relaxed">
                        {oro.consultTopic}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {oro.consultPriceCents && (
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-gray-500">Session Rate</span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#458B9E]/10 text-[#458B9E] font-bold text-sm rounded-full border border-[#458B9E]/20">
                        ${(oro.consultPriceCents / 100).toFixed(2)} <span className="text-[10px] font-normal text-gray-500">/ consult</span>
                      </span>
                    </div>
                  )}

                  <Button size="sm" className="w-full text-xs sm:text-sm py-2 rounded-xl bg-[#458B9E] text-white hover:bg-[#3a7585] shadow-xs group-hover:shadow-md transition-all">
                    <span>Book Consult</span>
                    <ArrowRight className="w-4 h-4 ml-1.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

