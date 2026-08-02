import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      if (value !== undefined && value !== null) params.set(key, value);
    });
    params.set('page', String(targetPage));
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-sm text-xs font-medium text-gray-600">
      <div>
        Showing page <span className="font-bold text-gray-900">{page}</span> of{' '}
        <span className="font-bold text-gray-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-100 text-gray-300 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </span>
        )}

        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-100 text-gray-300 cursor-not-allowed">
            Next
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
