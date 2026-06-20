'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Compass, Users, TrendingUp, Search, Globe, X } from 'lucide-react';
import { getPendingRequests } from '@/features/connections/actions';
import { getUserStats } from '@/features/auth/actions';

export default function MainSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState({ verifiedOrosCount: 0, compassMembershipsCount: 0, isPartner: false });

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    getPendingRequests(session.user.id).then((result) => {
      if (active && result.success) setPendingCount(result.requests?.length || 0);
    });
    getUserStats(session.user.id).then((result) => {
      if (active && result.success) {
        setStats({
          verifiedOrosCount: result.verifiedOrosCount ?? 0,
          compassMembershipsCount: result.compassMembershipsCount ?? 0,
          isPartner: result.isPartner ?? false,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [session?.user?.id, pathname]);

  const menuItems = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/global', label: 'Global', icon: Globe },
    { href: '/collab', label: 'Collab', icon: MessageSquare },
    { href: '/compass', label: 'Compass', icon: Compass },
    { href: '/oro', label: 'My Oros', icon: Users, badge: pendingCount },
    { href: '/explore', label: 'Explore', icon: Search },
  ];

  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 bottom-0 w-64 bg-[#458B9E] text-white overflow-y-auto z-50 transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={closeMobileSidebar}
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* User Stats */}
          {session?.user && (
            <div className="mb-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-sm opacity-90 mb-2">Verified Oros</div>
              <div className="text-2xl font-bold">{stats.verifiedOrosCount}</div>
              <div className="text-sm opacity-75 mt-1">
                Goal: 1,000 for Partner status
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-white text-[#458B9E] shadow-lg'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {!!item.badge && (
                    <span
                      className={`min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${
                        isActive ? 'bg-[#458B9E] text-white' : 'bg-[#FFC93C] text-[#333333]'
                      }`}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Partner Status */}
          {stats.isPartner && (
            <div className="mt-6 p-4 bg-[#FFC93C] text-[#333333] rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Orochat Partner</span>
              </div>
              <div className="text-sm">
                You're eligible for ad revenue share!
              </div>
            </div>
          )}

          {/* Qualification Progress */}
          {session?.user && !stats.isPartner && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-sm mb-2">Qualification Progress</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Oros</span>
                    <span>{stats.verifiedOrosCount} / 1,000</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-[#FFC93C] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.verifiedOrosCount / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Compass</span>
                    <span>{stats.compassMembershipsCount} / 10</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-[#FFC93C] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.compassMembershipsCount / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Toggle Button - Export for use in header */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-20 right-4 z-50 w-12 h-12 bg-[#458B9E] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#3a7585] transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
