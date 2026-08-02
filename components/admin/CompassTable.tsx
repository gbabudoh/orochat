'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import CompassSponsorToggle from './CompassSponsorToggle';
import CompassFlagModal from './CompassFlagModal';
import DeleteCompassModal from './DeleteCompassModal';
import SortableHeader from './SortableHeader';
import { setCompassSuspended } from '@/features/admin/compass-actions';
import {
  Compass as CompassIcon,
  Users,
  MessageSquare,
  ExternalLink,
  Ban,
  RotateCcw,
  Flag,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  isSponsored: boolean;
  isSuspended: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  creator: {
    name: string;
    email: string;
  };
  _count: {
    memberships: number;
    posts: number;
  };
}

interface Props {
  communities: CommunityRow[];
  currentSort?: string;
  currentDir?: string;
  searchParams: Record<string, string | undefined>;
}

function getInitials(name: string) {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const EMBLEM_COLORS = [
  'bg-blue-50 text-blue-600 border-blue-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-teal-50 text-teal-600 border-teal-100',
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-emerald-50 text-emerald-600 border-emerald-100',
];

function getEmblemColor(id: string) {
  let charSum = 0;
  for (let i = 0; i < id.length; i++) charSum += id.charCodeAt(i);
  return EMBLEM_COLORS[charSum % EMBLEM_COLORS.length];
}

const ICON_BUTTON_BASE =
  'inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all border border-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export default function CompassTable({ communities, currentSort, currentDir, searchParams }: Props) {
  const router = useRouter();

  // Modals state
  const [flagModal, setFlagModal] = useState<{ isOpen: boolean; compass?: CommunityRow }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; compass?: CommunityRow }>({ isOpen: false });
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const headerProps = { currentSort, currentDir, searchParams };

  const handleToggleSuspend = async (community: CommunityRow) => {
    setTogglingId(community.id);
    const res = await setCompassSuspended(community.id, !community.isSuspended);
    setTogglingId(null);

    if (res?.success) {
      toast.success(community.isSuspended ? 'Community reactivated' : 'Community suspended');
      router.refresh();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Community & Slug</th>
              <th className="px-5 py-3.5">Creator Operator</th>
              <th className="px-5 py-3.5">
                <SortableHeader label="Members" sortKey="members" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">
                <SortableHeader label="Posts" sortKey="posts" {...headerProps} />
              </th>
              <th className="px-5 py-3.5">Sponsorship</th>
              <th className="px-5 py-3.5 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {communities.map((community) => {
              const emblemStyle = getEmblemColor(community.id);

              return (
                <tr
                  key={community.id}
                  className={`transition-colors ${
                    community.isSuspended ? 'bg-red-50/20 hover:bg-red-50/40' : 'hover:bg-gray-50/80'
                  }`}
                >
                  {/* Community Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${emblemStyle}`}
                      >
                        <CompassIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/compass/${community.slug}`}
                            target="_blank"
                            className="font-bold text-gray-900 hover:text-[#458B9E] transition-colors leading-snug flex items-center gap-1"
                          >
                            {community.name}
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </Link>

                          {community.isSuspended && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-red-100 text-red-700 border border-red-200">
                              Suspended
                            </span>
                          )}

                          {community.isFlagged && (
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1"
                              title={community.flagReason || 'Flagged for moderation'}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Flagged
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono mt-0.5 block">
                          /{community.slug}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Creator Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(community.creator.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 leading-snug text-xs sm:text-sm">
                          {community.creator.name}
                        </p>
                        <p className="text-xs text-gray-500">{community.creator.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Members Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <Users className="w-4 h-4 text-[#458B9E]" />
                      <span>{community._count.memberships.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Posts Column */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      <span>{community._count.posts.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Sponsorship Toggle Column */}
                  <td className="px-5 py-4">
                    <CompassSponsorToggle compassId={community.id} isSponsored={community.isSponsored} />
                  </td>

                  {/* Moderation Actions Column */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Suspend / Reactivate Action */}
                      <button
                        type="button"
                        onClick={() => handleToggleSuspend(community)}
                        disabled={togglingId === community.id}
                        title={community.isSuspended ? 'Reactivate Community' : 'Suspend Community'}
                        className={`${ICON_BUTTON_BASE} ${
                          community.isSuspended
                            ? 'text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
                            : 'text-amber-700 hover:bg-amber-50 hover:border-amber-200'
                        }`}
                      >
                        {community.isSuspended ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>

                      {/* Flag Action */}
                      <button
                        type="button"
                        onClick={() => setFlagModal({ isOpen: true, compass: community })}
                        title={community.isFlagged ? 'Edit Flag / Clear Flag' : 'Flag Community'}
                        className={`${ICON_BUTTON_BASE} ${
                          community.isFlagged
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            : 'text-gray-500 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200'
                        }`}
                      >
                        <Flag className="w-4 h-4" />
                      </button>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => setDeleteModal({ isOpen: true, compass: community })}
                        title="Remove / Delete Community"
                        className={`${ICON_BUTTON_BASE} text-red-600 hover:bg-red-50 hover:border-red-200`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {communities.length === 0 && (
        <div className="text-center py-16 px-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <CompassIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">No communities found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No Compass communities match your search query or filter selection.
            </p>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {flagModal.isOpen && flagModal.compass && (
        <CompassFlagModal
          isOpen={flagModal.isOpen}
          onClose={() => setFlagModal({ isOpen: false })}
          compassId={flagModal.compass.id}
          compassName={flagModal.compass.name}
          isFlagged={flagModal.compass.isFlagged}
          currentReason={flagModal.compass.flagReason}
        />
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && deleteModal.compass && (
        <DeleteCompassModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false })}
          compassId={deleteModal.compass.id}
          compassName={deleteModal.compass.name}
        />
      )}
    </div>
  );
}
