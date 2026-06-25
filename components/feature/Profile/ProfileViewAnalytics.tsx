import Link from 'next/link';
import { Eye, User, Globe } from 'lucide-react';
import Card from '@/components/ui/Card';
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
        <Card padding="md" className="relative overflow-hidden border-l-4 border-[#458B9E]">
          {/* Subtle Background Icon Decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#458B9E]/5 rounded-bl-full flex items-center justify-center pointer-events-none">
            <Eye className="w-8 h-8 text-[#458B9E]/20 translate-x-2 -translate-y-2" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#458B9E]/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#458B9E]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Profile Views</h2>
              <p className="text-[10px] text-gray-400">Only visible to you</p>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight">{totalViews}</span>
            <span className="text-xs text-gray-500 font-medium">views logged</span>
          </div>
        </Card>

        {/* Demographics Card */}
        <Card padding="md" className="border-l-4 border-gray-300">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">By Country</h3>
            <p className="text-[10px] text-gray-400">Geographical view breakdown</p>
          </div>

          {stats.countryBreakdown.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1">
              {stats.countryBreakdown.map((c) => {
                const flag = getFlagImageUrl(c.countryCode);
                const percentage = totalViews > 0 ? Math.round((c.count / totalViews) * 100) : 0;
                
                return (
                  <div
                    key={c.countryCode}
                    className="relative flex items-center justify-between px-3 py-2 bg-gray-50/50 rounded-lg overflow-hidden border border-gray-100"
                  >
                    {/* Visual Progress Bar in Background */}
                    <div
                      className="absolute inset-y-0 left-0 bg-[#458B9E]/10 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div className="relative flex items-center gap-2 min-w-0">
                      {flag && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={flag} alt={c.countryCode} className="w-5 h-auto rounded-sm shrink-0 shadow-sm" />
                      )}
                      <span className="text-xs font-semibold text-gray-800 truncate">
                        {getCountryName(c.countryCode)}
                      </span>
                    </div>
                    
                    <span className="relative text-xs font-bold text-[#458B9E]">
                      {c.count} <span className="text-[10px] font-normal text-gray-400">({percentage}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic py-4 text-center">No location details recorded yet.</p>
          )}
        </Card>
      </div>

      {/* Right Column: Recent Activity Feed */}
      <div className="lg:col-span-7">
        <Card padding="md" className="h-full">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Activity</h3>
              <p className="text-[10px] text-gray-400">Timeline of the last 30 visits</p>
            </div>
            <div className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {stats.recentViewers.length} logged
            </div>
          </div>

          {stats.recentViewers.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto overflow-x-hidden pr-1">
              {stats.recentViewers.map((v, i) => {
                const flag = getFlagImageUrl(v.countryCode);
                const isAnonymous = !v.id;
                
                const itemContent = (
                  <div className="flex items-center justify-between py-2.5 px-2 hover:bg-gray-50/50 rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${
                        isAnonymous
                          ? 'bg-gray-100 border border-gray-200'
                          : 'bg-gradient-to-br from-[#458B9E] to-[#3a7585]'
                      }`}>
                        {!isAnonymous && v.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/user/${v.id}/avatar`}
                            alt={v.name ?? ''}
                            className="w-full h-full object-cover"
                          />
                        ) : isAnonymous ? (
                          <Globe className="w-4 h-4 text-gray-400" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isAnonymous ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                          {v.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
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
                          className="w-4.5 h-auto rounded-sm border border-gray-100 shadow-sm"
                        />
                      )}
                      <span className="text-[10px] text-gray-400">
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
              <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 italic">No visits logged yet.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
