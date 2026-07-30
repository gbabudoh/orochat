'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/payouts', label: 'Payment Setup' },
  { href: '/settings/consults', label: 'Flash-Consult' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0">
      <div className="flex items-center gap-4 sm:gap-6 border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none px-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors shrink-0 ${
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
