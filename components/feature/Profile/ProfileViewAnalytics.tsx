import Link from 'next/link';
import { Eye, Globe, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import UserAvatar from '@/components/ui/UserAvatar';
import HelpTooltip from '@/components/ui/HelpTooltip';
import { getCountryName, getFlagImageUrl } from '@/lib/constants/countries';
import type { ProfileViewStats } from '@/lib/profileViews';

function formatRelativeTime(dateInput: Date | string) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProfileViewAnalytics({ stats }: { stats: ProfileViewStats }) {
  const totalViews = stats.totalCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Quick Stats & Country Demographics */}
      <div className="lg:col-span-5 space-y-6">
        {/* Total Views Card */}
        <Card padding="none" className="p-5 border border-slate-200/80 rounded-2xl shadow-2xs bg-white hover:border-slate-300 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Eye className="w-5 h-5 text-[#458B9E]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Total Profile Views</h2>
              <p className="text-[11px] text-slate-500 font-medium">Only visible to you</p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mt-5">
            <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">{totalViews}</span>
            <span className="text-xs sm:text-sm text-slate-500 font-bold">views logged</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-[#458B9E] font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> Live Traffic
            </span>
            <span className="font-semibold text-slate-500">Last 30 visits active</span>
          </div>
        </Card>

        {/* Demographics Card */}
        <Card padding="none" className="p-4 sm:p-5 border border-slate-200/80 rounded-2xl shadow-2xs bg-white">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">By Country</h3>
            <p className="text-[11px] text-slate-500 font-medium">Geographical view breakdown</p>
          </div>

          {stats.countryBreakdown.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto overflow-x-hidden pr-1">
              {stats.countryBreakdown.map((c) => {
                const flag = getFlagImageUrl(c.countryCode);
                const percentage = totalViews > 0 ? Math.round((c.count / totalViews) * 100) : 0;

                return (
                  <div
                    key={c.countryCode}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 transition-all hover:bg-slate-100/70"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {flag && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={flag} alt={c.countryCode} className="w-5 h-3.5 object-cover rounded-xs border border-slate-200/90 shrink-0 shadow-2xs" />
                        )}
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {getCountryName(c.countryCode)}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-[#458B9E] shrink-0">
                        {c.count} <span className="text-[10px] font-semibold text-slate-400">({percentage}%)</span>
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#458B9E] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium italic py-6 text-center">No location details recorded yet.</p>
          )}
        </Card>
      </div>

      {/* Right Column: Recent Activity Feed */}
      <div className="lg:col-span-7">
        <Card padding="none" className="p-4 sm:p-6 border border-slate-200/80 rounded-2xl shadow-2xs bg-white h-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Activity</h3>
              <p className="text-[11px] text-slate-500 font-medium">Timeline of the last 30 visits</p>
            </div>
            <div className="text-xs font-bold bg-[#458B9E]/10 text-[#458B9E] px-3 py-1 rounded-full border border-[#458B9E]/20">
              {stats.recentViewers.length} logged
            </div>
          </div>

          {stats.recentViewers.length > 0 ? (
            <div className="space-y-2 max-h-[480px] overflow-y-auto overflow-x-hidden pr-1">
              {stats.recentViewers.map((v, i) => {
                const flag = getFlagImageUrl(v.countryCode);
                const isAnonymous = !v.id;

                const itemContent = (
                  <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200/80 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      {isAnonymous ? (
                        <div className="w-10 h-10 rounded-full bg-[#458B9E]/10 border border-[#458B9E]/20 flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5 text-[#458B9E]" />
                        </div>
                      ) : (
                        <UserAvatar
                          userId={v.id!}
                          name={v.name || 'Oro Member'}
                          avatarUrl={v.avatar}
                          size="md"
                        />
                      )}

                      {/* Details */}
                      <div className="min-w-0">
                        <p className={`text-xs sm:text-sm font-bold truncate ${isAnonymous ? 'text-slate-500 italic' : 'text-slate-900'}`}>
                          {v.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {v.title || (isAnonymous && v.countryCode ? `Visitor from ${getCountryName(v.countryCode)}` : 'Orochat member')}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      {flag && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={flag}
                          alt={v.countryCode ?? ''}
                          className="w-5 h-3.5 object-cover rounded-xs border border-slate-200/90 shadow-2xs"
                        />
                      )}
                      <span className="text-xs font-semibold text-slate-400">
                        {formatRelativeTime(v.viewedAt)}
                      </span>
                    </div>
                  </div>
                );

                return v.id ? (
                  <Link key={i} href={`/oro/${v.id}`} className="block">
                    {itemContent}
                  </Link>
                ) : (
                  <div key={i}>{itemContent}</div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium italic">No visits logged yet.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

