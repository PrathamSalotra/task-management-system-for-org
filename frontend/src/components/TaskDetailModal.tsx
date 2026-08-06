'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useTaskComments,
  useCreateComment,
  useDeleteTask,
} from '../hooks/useTasks';
import {
  formatDate,
  getAvatarInitials,
} from '../lib/utils';
import { Task } from '../lib/api/types';
import { StatusPill } from './StatusPill';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';
import {
  Button,
  TextArea,
  EmptyState,
  LoadingState,
} from './index';
import {
  User,
  Calendar,
  MessageSquare,
  Trash2,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { user } = useAuth();
  const isPmOrAdmin =
    user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const deleteTaskMutation = useDeleteTask(task.projectId);

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
  } = useTaskComments(task.id);
  const createCommentMutation = useCreateComment(task.id);

  const comments = Array.isArray(commentsData) ? commentsData : [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteTask = async () => {
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY delete task "${task.title}" along with its comments?\n\nThis action cannot be undone.`
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

        {/* Discussion Header */}
        <div className="flex items-center border-b border-border-subtle bg-surface-muted px-4 sm:px-6">
          <div className="py-3 px-4 min-h-[44px] text-xs font-bold border-b-2 border-accent text-accent flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Discussion</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] border border-indigo-500/20">
              {comments.length}
            </span>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="mx-6 mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fadeIn">
            ✓ {toast}
          </div>
        )}

        {/* Comments Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
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
        </div>
      </div>
    </div>
  );
}
