import { countryCodeToFlag, getCountryName } from '@/lib/constants/countries';

interface HandleBadgeProps {
  username?: string | null;
  countryCode?: string | null;
}

export default function HandleBadge({ username, countryCode }: HandleBadgeProps) {
  const flag = countryCodeToFlag(countryCode);
  const countryName = getCountryName(countryCode);

  if (!username && !flag) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs md:text-sm text-gray-400">
      {username && <span className="truncate">@{username}</span>}
      {flag && (
        <span title={countryName ?? undefined} className="text-sm leading-none">
          {flag}
        </span>
      )}
    </span>
  );
}
