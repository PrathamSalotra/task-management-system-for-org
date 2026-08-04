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
import {
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  Download,
  Trash2,
  FileText,
  ImageIcon,
  Archive,
} from 'lucide-react';

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
    if (mimeType?.startsWith('image/'))
      return <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />;
    if (mimeType?.includes('pdf') || fileName?.endsWith('.pdf'))
      return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    if (
      mimeType?.includes('zip') ||
      mimeType?.includes('compressed') ||
      fileName?.endsWith('.zip')
    )
      return <Archive className="w-5 h-5 text-amber-500 shrink-0" />;
    return <FileText className="w-5 h-5 text-indigo-500 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-card border border-border-subtle rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-border-subtle space-y-3 bg-surface-muted">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-text-primary leading-tight">
                {task.title}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
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
                  <Trash2 className="w-4 h-4 inline mr-1" /> Delete Task
                </Button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 hover:text-red-600 dark:text-red-400 flex items-center justify-center transition-all font-bold text-sm shadow-sm"
                aria-label="Close modal"
                title="Close"
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
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold text-indigo-600 dark:text-indigo-300 shadow-sm">
              <User className="w-3.5 h-3.5" />
              <span>{task.assignee?.name || 'Unassigned'}</span>
            </div>

            {/* Due Date Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-600 dark:text-purple-300 shadow-sm">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
          </div>

          {task.description && (
            <div className="p-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-text-primary">
              {task.description}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border-subtle bg-surface-muted px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-4 min-h-[44px] text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discussion</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] border border-indigo-500/20">
              {comments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-4 min-h-[44px] text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'attachments'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Attachments</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] border border-indigo-500/20">
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
                    icon={<MessageSquare className="w-6 h-6 text-indigo-500" />}
                    title="No comments yet"
                    description="Be the first to start the discussion below."
                  />
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-surface-muted border border-border-subtle space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.author?.name} size="sm" />
                          <div>
                            <span className="text-xs font-bold text-text-primary block">
                              {c.author?.name || 'Anonymous User'}
                            </span>
                            <span className="text-[10px] text-text-secondary block">
                              {c.author?.role || 'MEMBER'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-text-secondary">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed pl-9">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form
                onSubmit={handlePostComment}
                className="pt-4 border-t border-border-subtle space-y-3"
              >
                {commentError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs">
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
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs">
                    Failed to load attachments for this task.
                  </div>
                ) : attachments.length === 0 ? (
                  <EmptyState
                    icon={<Paperclip className="w-6 h-6 text-indigo-500" />}
                    title="No files attached yet"
                    description="Upload specifications, screenshots, or code logs below."
                  />
                ) : (
                  attachments.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 rounded-xl bg-surface-muted border border-border-subtle flex items-center justify-between gap-4 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">
                          {getFileIcon(file.mimeType, file.fileName)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-text-secondary">
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
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                      >
                        <span><Download className="w-3.5 h-3.5" /></span>
                        <span>Download</span>
                      </a>
                    </div>
                  ))
                )}
              </div>

              {/* Upload Attachment Box */}
              <form
                onSubmit={handleFileUpload}
                className="p-4 rounded-2xl bg-surface-muted border border-dashed border-border-subtle space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <input
                    id="attachment-file-input"
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files ? e.target.files[0] : null)
                    }
                    disabled={uploadAttachmentMutation.isPending}
                    className="text-xs text-text-primary file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-600 hover:file:bg-indigo-500/20 cursor-pointer"
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
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs">
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
