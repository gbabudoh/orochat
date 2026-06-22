'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Megaphone, DollarSign, Globe2, Settings, LogOut, ScrollText, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/ads', label: 'Ads', icon: Megaphone },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/compass', label: 'Compass', icon: Globe2 },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const SUPER_ADMIN_NAV_ITEM = { href: '/admin/admins', label: 'Admins', icon: ShieldCheck };

interface Props {
  role: 'ADMIN' | 'SUPER_ADMIN';
}

async function adminSignOut() {
  const csrfRes = await fetch('/api/admin-auth/csrf');
  const { csrfToken } = await csrfRes.json();
  await fetch('/api/admin-auth/signout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrfToken, json: 'true' }),
  });
}

export default function AdminNav({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await adminSignOut();
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = role === 'SUPER_ADMIN' ? [...NAV_ITEMS, SUPER_ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <nav className="w-56 shrink-0 bg-[#1a1f2b] min-h-screen flex flex-col py-6 px-3">
      <p className="text-white font-bold text-lg px-3 mb-6">Orochat Admin</p>
      <div className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-[#458B9E] text-white' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </nav>
  );
}
