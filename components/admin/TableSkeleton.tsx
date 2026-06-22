export default function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div>
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 flex gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-6">
              {Array.from({ length: columns }).map((_, j) => (
                <div key={j} className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
