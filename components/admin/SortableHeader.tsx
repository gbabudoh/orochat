import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface Props {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentDir?: string;
  searchParams: Record<string, string | undefined>;
}

export default function SortableHeader({ label, sortKey, currentSort, currentDir, searchParams }: Props) {
  const isActive = currentSort === sortKey;
  const dir = currentDir === 'asc' ? 'asc' : 'desc';
  const nextDir = isActive && dir === 'desc' ? 'asc' : 'desc';

  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, value);
  });
  params.set('sort', sortKey);
  params.set('dir', nextDir);
  params.delete('page');

  const Icon = isActive ? (dir === 'desc' ? ArrowDown : ArrowUp) : ArrowUpDown;

  return (
    <Link href={`?${params.toString()}`} className="inline-flex items-center gap-1 hover:text-[#458B9E]">
      {label}
      <Icon className="w-3 h-3" />
    </Link>
  );
}
