'use client';

import { useEffect, useRef, useState } from 'react';
import { File as FileIcon, Image as ImageIcon, Upload, Loader2, Trash2, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import UserAvatar from '@/components/ui/UserAvatar';
import { getNestFiles, saveNestFile, deleteNestFile } from '@/features/nest/actions';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface NestFileItem {
  id: string;
  fileName: string;
  url: string;
  contentType: string;
  size: number;
  createdAt: Date | string;
  uploadedById: string;
  uploadedBy: { id: string; name: string; avatar: string | null };
}

interface FileListProps {
  nestId: string;
  currentUserId: string;
  nestOwnerId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FileList({ nestId, currentUserId, nestOwnerId }: FileListProps) {
  const [files, setFiles] = useState<NestFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    getNestFiles(nestId, currentUserId).then((result) => {
      if (!active) return;
      if (result.success && result.files) setFiles(result.files);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [nestId, currentUserId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 25MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload/nest-file', { method: 'POST', body: formData });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to upload file');
        return;
      }

      const result = await saveNestFile(nestId, currentUserId, {
        fileName: data.fileName,
        objectName: data.objectName,
        url: data.url,
        contentType: data.contentType,
        size: data.size,
      });

      if (result.success && result.file) {
        setFiles((prev) => [result.file, ...prev]);
      } else {
        setError(result.error || 'Failed to save file');
      }
    } catch {
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    const result = await deleteNestFile(fileId, currentUserId);
    if (!result.success) setError(result.error || 'Failed to delete file');
  };

  if (isLoading) {
    return <p className="text-xs text-slate-400 font-medium py-12 text-center animate-pulse">Loading files…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Shared Files</h2>
          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-200/80 text-slate-700">
            {files.length}
          </span>
        </div>

        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" id="nest-file-upload" />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#458B9E] hover:bg-[#397484] shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 active:scale-[0.98]"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 text-white/90 animate-spin shrink-0" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-white/90 shrink-0" />
              <span>Upload File</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200/80 text-xs font-semibold">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center my-2 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center mx-auto mb-3">
            <FileIcon className="w-6 h-6 text-[#458B9E]" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
            No files shared yet — click &quot;Upload File&quot; to share documents.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {files.map((file) => {
            const canDelete = file.uploadedById === currentUserId || nestOwnerId === currentUserId;
            const Icon = file.contentType.startsWith('image/') ? ImageIcon : FileIcon;
            return (
              <div
                key={file.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-xs transition-all hover:border-slate-300 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#458B9E]/10 border border-[#458B9E]/20 text-[#458B9E] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#458B9E]" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate tracking-tight">
                    {file.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserAvatar
                        userId={file.uploadedBy.id}
                        name={file.uploadedBy.name}
                        avatarUrl={file.uploadedBy.avatar}
                        size="sm"
                      />
                      <span className="truncate font-bold text-slate-700">{file.uploadedBy.name}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="shrink-0">{formatFileSize(file.size)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="shrink-0">{formatRelativeTime(file.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={file.url}
                    download={file.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-[#458B9E] hover:bg-[#458B9E]/10 border border-transparent hover:border-[#458B9E]/20 transition-all cursor-pointer active:scale-[0.98]"
                    aria-label={`Download ${file.fileName}`}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(file.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200/60 transition-all cursor-pointer active:scale-[0.98]"
                      aria-label={`Delete ${file.fileName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
