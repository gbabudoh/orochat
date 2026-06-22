import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import Card from '@/components/ui/Card';
import CompassSponsorToggle from '@/components/admin/CompassSponsorToggle';
import SortableHeader from '@/components/admin/SortableHeader';

export default async function AdminCompassPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string }>;
}) {
  const { q, sort, dir } = await searchParams;
  const sortDir = dir === 'asc' ? 'asc' : 'desc';

  const where: Prisma.CompassWhereInput | undefined = q ? { name: { contains: q, mode: 'insensitive' } } : undefined;

  const orderBy: Prisma.CompassOrderByWithRelationInput =
    sort === 'members'
      ? { memberships: { _count: sortDir } }
      : sort === 'posts'
        ? { posts: { _count: sortDir } }
        : { createdAt: 'desc' };

  const communities = await db.compass.findMany({
    where,
    include: {
      creator: { select: { name: true, email: true } },
      _count: { select: { memberships: true, posts: true } },
    },
    orderBy,
  });

  const searchParamsObj = { q, sort, dir };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Compass Communities</h1>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by community name…"
          className="w-full max-w-sm px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#458B9E] text-sm"
        />
      </form>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Community</th>
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader label="Members" sortKey="members" currentSort={sort} currentDir={dir} searchParams={searchParamsObj} />
              </th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader label="Posts" sortKey="posts" currentSort={sort} currentDir={dir} searchParams={searchParamsObj} />
              </th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {communities.map((community) => (
              <tr key={community.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#333333]">{community.name}</p>
                  <p className="text-gray-500 text-xs">/{community.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{community.creator.name}</p>
                  <p className="text-gray-500 text-xs">{community.creator.email}</p>
                </td>
                <td className="px-4 py-3">{community._count.memberships}</td>
                <td className="px-4 py-3">{community._count.posts}</td>
                <td className="px-4 py-3">
                  <CompassSponsorToggle compassId={community.id} isSponsored={community.isSponsored} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {communities.length === 0 && <p className="text-center text-gray-500 py-12">No communities yet</p>}
      </Card>
    </div>
  );
}
