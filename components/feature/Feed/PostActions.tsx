'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { toggleLike, addComment } from '@/features/feed/actions';

import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils/formatters';

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
}

export default function PostActions({ 
  postId, 
  initialLikes, 
  isLikedInitially,
  comments: initialCommentsList
}: PostActionsProps) {
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedInitially);
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentsList, setCommentsList] = useState<Comment[]>(initialCommentsList);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

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

  const handleShare = () => {
    const url = `${window.location.origin}/feed?post=${postId}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 md:space-x-8 pt-3 border-t border-gray-100">
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-1 md:space-x-2 transition-colors group ${
            isLiked ? 'text-[#D32F2F]' : 'text-gray-600 hover:text-[#458B9E]'
          }`}
        >
          <Heart 
            className={`w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform ${
              isLiked ? 'fill-current' : ''
            }`} 
          />
          <span className="font-medium text-sm md:text-base">{likesCount}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center space-x-1 md:space-x-2 transition-colors group ${
            showComments ? 'text-[#458B9E]' : 'text-gray-600 hover:text-[#458B9E]'
          }`}
        >
          <MessageCircle className={`w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform ${showComments ? 'fill-[#458B9E]/10' : ''}`} />
          <span className="font-medium text-sm md:text-base">{commentsList.length}</span>
        </button>

        <button 
          onClick={handleShare}
          className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-[#458B9E] transition-colors group"
        >
          <Share2 className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-sm md:text-base hidden sm:inline">Share</span>
        </button>
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
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#458B9E] text-white text-xs font-bold">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#333333]">{comment.user.name}</span>
                    <span className="text-[10px] text-gray-400">{formatRelativeTime(new Date(comment.createdAt))}</span>
                  </div>
                  <p className="text-gray-700 leading-snug">{comment.content}</p>
                </div>
              </div>
            ))}
            {commentsList.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#458B9E] focus:ring-1 focus:ring-[#458B9E]/20"
            />
            <button
              type="submit"
              disabled={!commentContent.trim() || isCommenting}
              className="p-2 text-[#458B9E] hover:bg-[#458B9E]/10 rounded-full disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

