'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/payouts', label: 'Payouts' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'text-[#458B9E] border-[#458B9E]'
                  : 'text-gray-500 border-transparent hover:text-[#458B9E] hover:border-[#458B9E]/40'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
