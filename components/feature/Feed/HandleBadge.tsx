import { getCountryName, getFlagImageUrl } from '@/lib/constants/countries';

interface HandleBadgeProps {
  username?: string | null;
  countryCode?: string | null;
}

export default function HandleBadge({ username, countryCode }: HandleBadgeProps) {
  const flagUrl = getFlagImageUrl(countryCode);
  const countryName = getCountryName(countryCode);

  if (!username && !flagUrl) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-xs md:text-sm text-gray-400">
      {username && <span className="wrap-break-word">@{username}</span>}
      {flagUrl && countryName && (
        <span className="inline-flex items-center gap-1">
          <img
            src={flagUrl}
            alt={countryName}
            width={16}
            height={12}
            className="inline-block shrink-0 rounded-xs align-middle"
          />
          <span className="whitespace-nowrap">{countryName}</span>
        </span>
      )}
    </span>
  );
}
