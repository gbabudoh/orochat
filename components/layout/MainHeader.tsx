'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Search, User, LogOut, Settings } from 'lucide-react';
import NovuInbox from '../feature/Notifications/NovuInbox';
import { useState } from 'react';

export default function MainHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { href: '/feed', label: 'Feed' },
    { href: '/collab', label: 'Collab' },
    { href: '/compass', label: 'Compass' },
    { href: '/explore', label: 'Explore' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/feed" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Orochat Logo" 
              width={120} 
              height={40} 
              className="h-10 w-auto" 
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-[#458B9E] text-white'
                    : 'text-[#333333] hover:bg-[#F0F3F7]'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Link href="/explore" className="p-2 rounded-lg hover:bg-[#F0F3F7] transition-colors">
              <Search className="w-5 h-5 text-[#333333]" />
            </Link>

            {/* Notifications */}
            {session?.user?.id && (
              <NovuInbox subscriberId={session.user.id} />
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#F0F3F7] transition-colors cursor-pointer"
              >
                {session?.user?.avatar ? (
                  <Image
                    src={session.user.avatar}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#458B9E] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {session?.user?.name?.charAt(0).toUpperCase() ?? <User className="w-4 h-4" />}
                    </span>
                  </div>
                )}
                {session?.user?.isPartner && (
                  <span className="px-2 py-0.5 bg-[#FFC93C] text-[#333333] text-xs font-semibold rounded-full">
                    Partner
                  </span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    href={`/oro/${session?.user?.id}`}
                    className="flex px-4 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] items-center space-x-2"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    href="/settings/profile"
                    className="flex px-4 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] items-center space-x-2 font-medium"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#D32F2F] hover:bg-[#F0F3F7] flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

