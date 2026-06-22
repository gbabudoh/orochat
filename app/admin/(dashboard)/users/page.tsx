import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import UsersTable from '@/components/admin/UsersTable';
import Pagination from '@/components/admin/Pagination';
import { PAGE_SIZE, parsePage, parseDir } from '@/lib/admin/pagination';

const SORT_FIELD: Record<string, keyof Prisma.UserOrderByWithRelationInput> = {
  name: 'name',
  tes: 'currentTES',
  oros: 'verifiedOrosCount',
  communities: 'compassMembershipsCount',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const { q, sort, dir, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const sortDir = parseDir(dir);
  const sortField = sort && SORT_FIELD[sort] ? SORT_FIELD[sort] : null;

  const where: Prisma.UserWhereInput | undefined = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }
    : undefined;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        isPartner: true,
        isPaused: true,
        currentTES: true,
        verifiedOrosCount: true,
        compassMembershipsCount: true,
        fraudFlags: { where: { resolved: false }, select: { id: true, reason: true, riskScore: true } },
      },
      orderBy: sortField ? { [sortField]: sortDir } : { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const searchParamsObj = { q, sort, dir, page: pageParam };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Users</h1>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="w-full max-w-sm px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
      </form>

      <UsersTable users={users} currentSort={sort} currentDir={dir} searchParams={searchParamsObj} />
      <Pagination page={page} totalPages={totalPages} searchParams={searchParamsObj} />
    </div>
  );
}
