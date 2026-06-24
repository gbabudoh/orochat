'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Trash2, Archive, ArchiveRestore, Link2, Facebook, Twitter } from 'lucide-react';
import { toggleLike, addComment, deletePost, archivePost, unarchivePost } from '@/features/feed/actions';

import Image from 'next/image';
import { formatPostDateTime, formatRelativeTime, formatDateTime } from '@/lib/utils/formatters';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface PostActionsProps {
  postId: string;
  initialLikes: number;
  isLikedInitially: boolean;
  comments: Comment[];
  isAuthor?: boolean;
  isArchived?: boolean;
  onRemoved?: () => void;
}

export default function PostActions({
  postId,
  initialLikes,
  isLikedInitially,
  comments: initialCommentsList,
  isAuthor = false,
  isArchived = false,
  onRemoved,
}: PostActionsProps) {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedInitially);
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentsList, setCommentsList] = useState<Comment[]>(initialCommentsList);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isShareMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isShareMenuOpen]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      const result = await toggleLike(postId);
      if (!result.success) {
        setIsLiked(!newLikedState);
        setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
        alert(result.error || 'Failed to update like');
      }
    } catch {
      setIsLiked(!newLikedState);
      setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const result = await addComment(postId, commentContent);
      if (result.success && result.comment) {
        setCommentsList(prev => [...prev, result.comment as Comment]);
        setCommentContent('');
      } else {
        alert(result.error || 'Failed to add comment');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setIsCommenting(false);
    }
  };

  const getShareUrl = () => `${window.location.origin}/feed?post=${postId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setIsShareMenuOpen(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
    setIsShareMenuOpen(false);
  };

  const handleShareToX = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
    setIsShareMenuOpen(false);
  };

  const handleDelete = async () => {
    if (isDeleting || !confirm('Delete this post? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const result = await deletePost(postId);
      if (result.success) {
        onRemoved?.();
      } else {
        alert(result.error || 'Failed to delete post');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (isArchiving) return;
    setIsArchiving(true);
    try {
      const result = isArchived ? await unarchivePost(postId) : await archivePost(postId);
      if (result.success) {
        onRemoved?.();
      } else {
        alert(result.error || `Failed to ${isArchived ? 'unarchive' : 'archive'} post`);
      }
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1 sm:gap-2 transition-colors group shrink-0 ${
              isLiked ? 'text-[#D32F2F]' : 'text-gray-600 hover:text-[#458B9E]'
            }`}
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform ${
                isLiked ? 'fill-current' : ''
              }`}
            />
            <span className="font-medium text-sm sm:text-base">{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1 sm:gap-2 transition-colors group shrink-0 ${
              showComments ? 'text-[#458B9E]' : 'text-gray-600 hover:text-[#458B9E]'
            }`}
          >
            <MessageCircle className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform ${showComments ? 'fill-[#458B9E]/10' : ''}`} />
            <span className="font-medium text-sm sm:text-base">{commentsList.length}</span>
          </button>

          <div className="relative shrink-0" ref={shareMenuRef}>
            <button
              onClick={() => setIsShareMenuOpen((v) => !v)}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-[#458B9E] transition-colors group"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm sm:text-base hidden sm:inline">
                {copied ? 'Copied!' : 'Share'}
              </span>
            </button>

            {isShareMenuOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] transition-colors"
                >
                  <Link2 className="w-4 h-4 text-gray-500" />
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={handleShareToFacebook}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] transition-colors"
                >
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={handleShareToX}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#333333] hover:bg-[#F0F3F7] transition-colors"
                >
                  <Twitter className="w-4 h-4 text-[#333333]" />
                  X (Twitter)
                </button>
              </div>
            )}
          </div>
        </div>

        {isAuthor && (
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={handleArchive}
              disabled={isArchiving}
              title={isArchived ? 'Unarchive' : 'Archive'}
              className="flex items-center text-gray-600 hover:text-[#458B9E] transition-colors group disabled:opacity-50"
            >
              {isArchived ? (
                <ArchiveRestore className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              ) : (
                <Archive className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete"
              className="flex items-center text-gray-600 hover:text-[#D32F2F] transition-colors group disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {showComments && (
        <div className="pt-4 space-y-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {commentsList.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                    {comment.user.avatar ? (
                      <img
                        src={`/api/user/${comment.user.id}/avatar`}
                        alt={comment.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#458B9E] text-white text-xs font-bold">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 bg-gray-50 rounded-2xl px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#333333] truncate min-w-0">{comment.user.name}</span>
                    <span
                      className="text-[10px] text-gray-400 whitespace-nowrap shrink-0"
                      title={formatDateTime(new Date(comment.createdAt))}
                    >
                      <span className="sm:hidden">{formatRelativeTime(new Date(comment.createdAt))}</span>
                      <span className="hidden sm:inline">{formatPostDateTime(new Date(comment.createdAt))}</span>
                    </span>
                  </div>
                  <p className="text-gray-700 leading-snug wrap-break-word">{comment.content}</p>
                </div>
              </div>
            ))}
            {commentsList.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleComment} className="pt-2">
            <div className="relative">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:border-[#458B9E] focus:ring-1 focus:ring-[#458B9E]/20"
              />
              <button
                type="submit"
                disabled={!commentContent.trim() || isCommenting}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#458B9E] hover:bg-[#458B9E]/10 rounded-full disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

