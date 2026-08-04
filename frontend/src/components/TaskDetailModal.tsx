'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useTaskComments,
  useCreateComment,
  useTaskAttachments,
  useUploadAttachment,
  useDeleteTask,
} from '../hooks/useTasks';
import {
  formatDate,
  formatFileSize,
  getAvatarInitials,
} from '../lib/utils';
import { Task } from '../lib/api/types';
import { StatusPill } from './StatusPill';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';
import {
  Button,
  Input,
  TextArea,
  EmptyState,
  LoadingState,
} from './index';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

function getAttachmentUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { user } = useAuth();
  const isPmOrAdmin =
    user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const deleteTaskMutation = useDeleteTask(task.projectId);

  const [activeTab, setActiveTab] = useState<'comments' | 'attachments'>(
    'comments'
  );
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
  } = useTaskComments(task.id);
  const createCommentMutation = useCreateComment(task.id);

  const {
    data: attachmentsData,
    isLoading: isAttachmentsLoading,
    isError: isAttachmentsError,
  } = useTaskAttachments(task.id);
  const uploadAttachmentMutation = useUploadAttachment(task.id);

  const comments = Array.isArray(commentsData) ? commentsData : [];
  const attachments = Array.isArray(attachmentsData) ? attachmentsData : [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteTask = async () => {
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY delete task "${task.title}" along with its comments and attachments?\n\nThis action cannot be undone.`
      )
    ) {
      try {
        await deleteTaskMutation.mutateAsync(task.id);
        onClose();
      } catch (err: any) {
        alert(err.message || 'Failed to delete task.');
      }
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    try {
      await createCommentMutation.mutateAsync(commentText.trim());
      setCommentText('');
      showToast('Comment posted successfully!');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment.');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!selectedFile) {
      setUploadError('Please choose a file to upload.');
      return;
    }

    try {
      await uploadAttachmentMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      // Reset file input value
      const fileInput = document.getElementById(
        'attachment-file-input'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      showToast('File uploaded successfully!');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachment.');
    }
  };

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.includes('pdf') || fileName?.endsWith('.pdf')) return '📕';
    if (
      mimeType?.includes('zip') ||
      mimeType?.includes('compressed') ||
      fileName?.endsWith('.zip')
    )
      return '📦';
    return '📄';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 space-y-3 bg-slate-950/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                {task.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ID: {task.id.substring(0, 8)}...
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPmOrAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteTask}
                  isLoading={deleteTaskMutation.isPending}
                  title="Permanently Delete Task"
                >
                  🗑️ Delete Task
                </Button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusPill status={task.status} />
            <PriorityBadge priority={task.priority} />

            {/* Assignee Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span className="text-[10px] font-bold text-indigo-400">👤</span>
              <span>{task.assignee?.name || 'Unassigned'}</span>
            </div>

            {/* Due Date Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400">
              <span>📅</span>
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
          </div>

          {task.description && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              {task.description}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-4 min-h-[44px] text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>💬 Discussion</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">
              {comments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-4 min-h-[44px] text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'attachments'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>📎 Attachments</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">
              {attachments.length}
            </span>
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="mx-6 mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fadeIn">
            ✓ {toast}
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'comments' ? (
            /* Comments Section */
            <div className="space-y-6">
              {/* Existing Comments List */}
              <div className="space-y-3">
                {isCommentsLoading ? (
                  <LoadingState message="Loading comment thread..." className="py-8" />
                ) : isCommentsError ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    Failed to load comments for this task.
                  </div>
                ) : comments.length === 0 ? (
                  <EmptyState
                    icon="💬"
                    title="No comments yet"
                    description="Be the first to start the discussion below."
                  />
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.author?.name} size="sm" />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {c.author?.name || 'Anonymous User'}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {c.author?.role || 'MEMBER'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed pl-9">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form
                onSubmit={handlePostComment}
                className="pt-4 border-t border-slate-800 space-y-3"
              >
                {commentError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {commentError}
                  </div>
                )}
                <TextArea
                  rows={3}
                  placeholder="Write your comment here..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={createCommentMutation.isPending}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={createCommentMutation.isPending}
                    disabled={
                      !commentText.trim() || createCommentMutation.isPending
                    }
                  >
                    Post Comment
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* Attachments Section */
            <div className="space-y-6">
              {/* Existing Attachments List */}
              <div className="space-y-3">
                {isAttachmentsLoading ? (
                  <LoadingState message="Loading attached files..." className="py-8" />
                ) : isAttachmentsError ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    Failed to load attachments for this task.
                  </div>
                ) : attachments.length === 0 ? (
                  <EmptyState
                    icon="📎"
                    title="No files attached yet"
                    description="Upload specifications, screenshots, or code logs below."
                  />
                ) : (
                  attachments.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">
                          {getFileIcon(file.mimeType, file.fileName)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {formatFileSize(
                              file.fileSize ?? (file as any).fileSizeBytes
                            )}{' '}
                            • Uploaded by{' '}
                            {file.uploader?.name ||
                              (file as any).uploadedBy?.name ||
                              'User'}{' '}
                            on {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={getAttachmentUrl(file.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold text-xs transition-colors shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  ))
                )}
              </div>

              {/* Upload Attachment Box */}
              <form
                onSubmit={handleFileUpload}
                className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-700/80 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    id="attachment-file-input"
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files ? e.target.files[0] : null)
                    }
                    disabled={uploadAttachmentMutation.isPending}
                    className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={uploadAttachmentMutation.isPending}
                    disabled={
                      !selectedFile || uploadAttachmentMutation.isPending
                    }
                    className="shrink-0"
                  >
                    Upload File
                  </Button>
                </div>
                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {uploadError}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
