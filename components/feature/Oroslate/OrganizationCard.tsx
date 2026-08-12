'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Kanban, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import { TIER_LIMITS } from '@/lib/oroslate/tiers';
import type { getOrganizationsForUser } from '@/features/oroslate/actions';

type OrgListItem = Awaited<ReturnType<typeof getOrganizationsForUser>>[number];

export default function OrganizationCard({ organization }: { organization: OrgListItem }) {
  const tier = organization.subscription?.tier ?? 'STARTER';
  const isTrialing = organization.subscription?.status === 'TRIALING';

  return (
    <Link href={`/oroslate/org/${organization.id}`} className="group block h-full">
      <Card hover className="h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all hover:border-[#458B9E]/40 p-4">
        <div>
          {/* Card Banner */}
          <div className="relative overflow-hidden w-full h-24 bg-gradient-to-br from-[#458B9E] via-[#366f7e] to-[#2a5662] rounded-xl mb-4 flex items-center justify-center p-4 shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
              <Building2 className="w-5.5 h-5.5 text-white" />
            </div>
          </div>

          {/* Title & Status Badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#458B9E] transition-colors truncate tracking-tight">
              {organization.name}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                isTrialing
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs'
                  : 'bg-[#458B9E]/15 text-[#458B9E] border border-[#458B9E]/20 shadow-2xs'
              }`}
            >
              {isTrialing ? 'Trial' : TIER_LIMITS[tier].label}
            </span>
          </div>
        </div>

        {/* Footer / Stats */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-bold">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {organization._count.members}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-bold">
              <Kanban className="w-3.5 h-3.5 text-slate-500" />
              {organization._count.slates} {organization._count.slates === 1 ? 'Slate' : 'Slates'}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[#458B9E] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Open <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

