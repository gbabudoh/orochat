import Link from 'next/link';

interface Props {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({ page, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, value);
    });
    params.set('page', String(targetPage));
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-4 text-sm">
      {page > 1 && (
        <Link href={buildHref(page - 1)} className="text-[#458B9E] hover:underline">
          ← Previous
        </Link>
      )}
      <span className="text-gray-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={buildHref(page + 1)} className="text-[#458B9E] hover:underline">
          Next →
        </Link>
      )}
    </div>
  );
}
