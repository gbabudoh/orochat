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
    return <p className="text-sm text-gray-500 py-8 text-center">Loading files…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{files.length} file{files.length === 1 ? '' : 's'}</p>
        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" id="nest-file-upload" />
        <Button type="button" size="sm" isLoading={isUploading} onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1.5" />
          Upload File
        </Button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {files.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
          <FileIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No files shared yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => {
            const canDelete = file.uploadedById === currentUserId || nestOwnerId === currentUserId;
            const Icon = file.contentType.startsWith('image/') ? ImageIcon : FileIcon;
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#458B9E]/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#458B9E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <UserAvatar userId={file.uploadedBy.id} name={file.uploadedBy.name} avatarUrl={file.uploadedBy.avatar} size="sm" />
                    <span className="truncate">{file.uploadedBy.name}</span>
                    <span>·</span>
                    <span className="shrink-0">{formatFileSize(file.size)}</span>
                    <span>·</span>
                    <span className="shrink-0">{formatRelativeTime(file.createdAt)}</span>
                  </div>
                </div>
                <a
                  href={file.url}
                  download={file.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-[#458B9E] hover:bg-white rounded-lg transition-colors shrink-0"
                  aria-label={`Download ${file.fileName}`}
                >
                  <Download className="w-4 h-4" />
                </a>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors shrink-0"
                    aria-label={`Delete ${file.fileName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Uploading…
        </div>
      )}
    </div>
  );
}
