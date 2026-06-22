import { db } from '@/lib/db';
import Card from '@/components/ui/Card';
import Pagination from '@/components/admin/Pagination';
import { parsePage } from '@/lib/admin/pagination';

const PAGE_SIZE = 30;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const [logs, total] = await Promise.all([
    db.adminAuditLog.findMany({
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.adminAuditLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Audit Log</h1>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#333333]">{log.admin.name}</p>
                  <p className="text-gray-500 text-xs">{log.admin.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#458B9E]">{log.action}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {log.targetType ? `${log.targetType}${log.targetId ? ` · ${log.targetId}` : ''}` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center text-gray-500 py-12">No admin actions logged yet</p>}
      </Card>

      <Pagination page={page} totalPages={totalPages} searchParams={{ page: pageParam }} />
    </div>
  );
}
