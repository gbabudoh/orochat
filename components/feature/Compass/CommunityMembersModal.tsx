'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { getCompassMembers, removeMember, updateMemberRole, leaveCommunity } from '@/features/compass/actions';
import { UserMinus, LogOut } from 'lucide-react';

type Role = 'MEMBER' | 'MODERATOR' | 'ADMIN';

interface Member {
  userId: string;
  role: Role;
  joinedAt: Date | string;
  user: { id: string; name: string; avatar: string | null; title: string | null };
}

interface CommunityMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  compassId: string;
  currentUserId: string;
}

const ROLE_OPTIONS: Role[] = ['MEMBER', 'MODERATOR', 'ADMIN'];

export default function CommunityMembersModal({ isOpen, onClose, compassId, currentUserId }: CommunityMembersModalProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [callerRole, setCallerRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const result = await getCompassMembers(compassId, currentUserId);
    if (result.success && result.members) {
      setMembers(result.members as Member[]);
      setCallerRole(result.callerRole as Role);
    } else {
      setError(result.error || 'Failed to load members');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setConfirmLeave(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, compassId, currentUserId]);

  const canModerate = callerRole === 'ADMIN' || callerRole === 'MODERATOR';
  const isAdmin = callerRole === 'ADMIN';

  const handleRemove = async (targetUserId: string) => {
    setError('');
    const result = await removeMember(compassId, currentUserId, targetUserId);
    if (result.success) load();
    else setError(result.error || 'Failed to remove member');
  };

  const handleRoleChange = async (targetUserId: string, newRole: Role) => {
    setError('');
    const result = await updateMemberRole(compassId, currentUserId, targetUserId, newRole);
    if (result.success) load();
    else setError(result.error || 'Failed to update role');
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    setError('');
    const result = await leaveCommunity(compassId, currentUserId);
    if (result.success) {
      onClose();
      router.push('/compass');
      router.refresh();
    } else {
      setError(result.error || 'Failed to leave community');
      setIsLeaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Members" size="md">
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading members…</p>
      ) : confirmLeave ? (
        <div className="py-2">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to leave this community? You can rejoin later, but you&apos;ll lose any Moderator/Admin role you held.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmLeave(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleLeave} isLoading={isLeaving}>
              Leave Community
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.map((member) => (
              <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <UserAvatar userId={member.user.id} name={member.user.name} avatarUrl={member.user.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#333333] truncate">
                    {member.user.name}
                    {member.userId === currentUserId && <span className="text-gray-400"> (you)</span>}
                  </p>
                  {member.user.title && <p className="text-xs text-gray-500 truncate">{member.user.title}</p>}
                </div>

                {isAdmin && member.userId !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as Role)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[#333333] focus:border-[#458B9E] focus:ring-1 focus:ring-[#458B9E]/20"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                      member.role === 'ADMIN'
                        ? 'bg-[#FFC93C]/20 text-[#8a6d00]'
                        : member.role === 'MODERATOR'
                          ? 'bg-[#458B9E]/10 text-[#458B9E]'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {member.role}
                  </span>
                )}

                {canModerate && member.userId !== currentUserId && (!isAdmin ? member.role !== 'ADMIN' : true) && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.userId)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    aria-label="Remove member"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave Community
            </button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
