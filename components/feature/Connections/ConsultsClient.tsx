'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building, Video, ArrowRight, Search, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';

interface ConsultOro {
  id: string;
  name: string;
  avatar: string | null;
  title: string | null;
  company: string | null;
  consultTopic: string | null;
  consultPriceCents: number | null;
}

export default function ConsultsClient({ oros }: { oros: ConsultOro[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  if (oros.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto my-4 bg-white shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-[#458B9E]/10 border border-[#458B9E]/20 flex items-center justify-center mx-auto mb-4 text-[#458B9E] shadow-2xs">
          <Video className="w-7 h-7 text-[#458B9E]" />
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1.5 tracking-tight">No Consultations Available Yet</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed font-medium">
          No Oros are currently offering bookable consult slots. Check back soon or explore verified connections.
        </p>
        <Link href="/explore">
          <Button className="rounded-xl px-5 py-2.5 text-xs font-semibold bg-[#458B9E] text-white hover:bg-[#397484] shadow-xs active:scale-[0.98]">
            Explore Members & Experts
          </Button>
        </Link>
      </Card>
    );
  }

  const query = searchQuery.toLowerCase().trim();
  const filteredOros = oros.filter((oro) => {
    if (!query) return true;
    return (
      oro.name.toLowerCase().includes(query) ||
      (oro.title && oro.title.toLowerCase().includes(query)) ||
      (oro.company && oro.company.toLowerCase().includes(query)) ||
      (oro.consultTopic && oro.consultTopic.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-5">
      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search consults by name, company, or topic…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200/90 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {filteredOros.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredOros.map((oro) => (
            <Link key={oro.id} href={`/oro/${oro.id}?from=consults`} className="block h-full group">
              <Card hover className="p-4 sm:p-5 border border-slate-200/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs hover:border-slate-300 h-full flex flex-col justify-between transition-all duration-300">
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
                      <h3 className="font-extrabold text-slate-900 group-hover:text-[#458B9E] transition-colors truncate text-base sm:text-lg tracking-tight">
                        {oro.name}
                      </h3>
                      {oro.title && <p className="text-xs sm:text-sm text-slate-600 font-semibold truncate mt-0.5">{oro.title}</p>}
                      {oro.company && (
                        <div className="flex items-center text-xs text-slate-500 font-medium mt-1">
                          <Building className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{oro.company}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {oro.consultTopic && (
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#458B9E] mb-1">
                        <Video className="w-3.5 h-3.5 shrink-0" />
                        <span>1-on-1 Video Session</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                        {oro.consultTopic}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {oro.consultPriceCents && (
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-500">Session Rate</span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#458B9E]/10 text-[#458B9E] font-extrabold text-xs sm:text-sm rounded-full border border-[#458B9E]/20">
                        ${(oro.consultPriceCents / 100).toFixed(2)} <span className="text-[10px] font-semibold text-slate-500">/ consult</span>
                      </span>
                    </div>
                  )}

                  <Button size="sm" className="w-full text-xs sm:text-sm py-2 rounded-xl bg-[#458B9E] text-white hover:bg-[#397484] shadow-xs active:scale-[0.98] cursor-pointer transition-all">
                    <span>Book Consult</span>
                    <ArrowRight className="w-4 h-4 ml-1.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto my-4 bg-white shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#458B9E]/10 border border-[#458B9E]/20 flex items-center justify-center mx-auto mb-4 text-[#458B9E] shadow-2xs">
            <Search className="w-7 h-7 text-[#458B9E]" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1 tracking-tight">No Matching Consults</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
            Try a different name, company, or topic.
          </p>
        </Card>
      )}
    </div>
  );
}
