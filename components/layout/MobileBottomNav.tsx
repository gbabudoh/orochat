'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Globe, MessageSquare, Compass, Users } from 'lucide-react';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/global', label: 'Global', icon: Globe },
  { href: '/collab', label: 'Collab', icon: MessageSquare },
  { href: '/compass', label: 'Compass', icon: Compass },
  { href: '/oro', label: 'Oros', icon: Users },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 ${
                isActive ? 'text-[#458B9E]' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-[#458B9E]/10' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[11px] leading-none truncate max-w-full ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
