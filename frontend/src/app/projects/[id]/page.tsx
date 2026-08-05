'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useAddProjectMember,
  useRemoveProjectMember,
  useUsers,
} from '../../../hooks';
import { AppShell } from '../../../components/AppShell';
import { TaskBoard } from '../../../components/TaskBoard';
import {
  Avatar,
  Button,
  Input,
  Select,
  EmptyState,
  LoadingState,
} from '../../../components';
import {
  Trash2,
  AlertTriangle,
  Users,
} from 'lucide-react';

import {
  formatDate,
  getStatusBadgeStyle,
} from '../../../lib/utils';

export default function ProjectDetailPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  const { data: project, isLoading: projectLoading, isError } = useProject(projectId);
  const { data: allUsers } = useUsers();

  const updateProjectMutation = useUpdateProject(projectId);
  const deleteProjectMutation = useDeleteProject();
  const addMemberMutation = useAddProjectMember(projectId);
  const removeMemberMutation = useRemoveProjectMember(projectId);

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const canManageProject =
    user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProjectMutation.mutateAsync({ status: newStatus });
      setStatusMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY delete project "${project.name}" along with all of its tasks, comments, attachments, and members?\n\nThis action cannot be undone.`
      )
    ) {
      try {
        await deleteProjectMutation.mutateAsync(project.id);
        router.push('/projects');
      } catch (err: any) {
        alert(err.message || 'Failed to delete project.');
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError(null);
    if (!selectedUserId) {
      setMemberError('Please select a team member to add.');
      return;
    }

    try {
      await addMemberMutation.mutateAsync(selectedUserId);
      setSelectedUserId('');
      setStatusMessage('Member successfully added to project!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add project member.');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }

    try {
      await removeMemberMutation.mutateAsync(userId);
      setStatusMessage(`${memberName} removed from project.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to remove member: ${err.message || 'Unknown error'}`);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <LoadingState fullScreen message="Loading project details..." />;
  }

  if (projectLoading) {
    return (
      <AppShell>
        <LoadingState message="Loading project info..." className="py-20" />
      </AppShell>
    );
  }

  if (isError || !project) {
    return (
      <AppShell>
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
          <EmptyState
            icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
            title="Project Not Found"
            description="We couldn’t load the details for this project. It may have been deleted or you may lack permissions."
            action={
              <Link href="/projects">
                <Button variant="primary">Back to All Projects</Button>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const badge = getStatusBadgeStyle(project.status);

  // Filter out users who are already project members
  const existingMemberIds = new Set(project.members?.map((m) => m.userId) || []);
  const availableUsers = (allUsers || []).filter(
    (u) => !existingMemberIds.has(u.id)
  );

  return (
    <AppShell>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 space-y-8">
        {/* Status Toast */}
        {statusMessage && (
          <div className="flex justify-end">
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
              ✓ {statusMessage}
            </div>
          </div>
        )}

        {/* Project Overview Card */}
        <div className="p-8 rounded-3xl bg-surface-card border border-border-subtle shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400">
                  Project Workspace
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border} uppercase tracking-wider`}
                >
                  {badge.label}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary">
                {project.name}
              </h1>
              <p className="text-text-secondary text-sm max-w-3xl leading-relaxed">
                {project.description || 'No project description provided.'}
              </p>
            </div>

            {/* PM Status Changer & Delete Project */}
            {canManageProject && (
              <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Project Actions
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updateProjectMutation.isPending}
                    className="bg-surface-muted border border-border-subtle rounded-xl px-4 py-2 text-sm text-text-primary font-semibold focus:outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <button
                    onClick={handleDeleteProject}
                    disabled={deleteProjectMutation.isPending}
                    className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-bold border border-red-500/30 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                    title="Permanently Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {deleteProjectMutation.isPending
                        ? 'Deleting...'
                        : 'Delete Project'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border-subtle">
            <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle">
              <span className="block text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">
                Start Date
              </span>
              <span className="text-base font-bold text-text-primary">
                {formatDate(project.startDate)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle">
              <span className="block text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">
                Deadline
              </span>
              <span className="text-base font-bold text-text-primary">
                {formatDate(project.deadline)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-muted border border-border-subtle">
              <span className="block text-xs uppercase tracking-wider text-text-secondary font-semibold mb-1">
                Project Manager
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {project.owner?.name || 'Assigned Owner'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members List (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>Team Members</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {project.members?.length || 0}
                </span>
              </h2>
            </div>

            <div className="space-y-3">
              {!project.members || project.members.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-6 h-6 text-indigo-500" />}
                  title="No Team Members"
                  description="No team members have been added to this project yet."
                />
              ) : (
                project.members.map((member) => {
                  const isOwner = member.userId === project.ownerId;

                  return (
                    <div
                      key={member.id || member.userId}
                      className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-sm flex items-start gap-3.5 hover:border-indigo-300 transition-colors overflow-hidden"
                    >
                      <Avatar
                        name={member.user?.name || `User (${member.userId.substring(0, 8)})`}
                        size="md"
                        title={member.user?.email || member.user?.name}
                        className="shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-bold text-text-primary text-sm truncate max-w-full"
                              title={member.user?.name || `User (${member.userId.substring(0, 8)})`}
                            >
                              {member.user?.name || `User (${member.userId.substring(0, 8)})`}
                            </span>
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 uppercase shrink-0">
                                Owner / PM
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs text-text-secondary truncate block mt-0.5"
                            title={member.user?.email || 'Member'}
                          >
                            {member.user?.email || 'Member'}
                          </span>
                        </div>

                        {/* Designation & Remove Button below the email in symmetry */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border-subtle/60">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-muted text-text-secondary border border-border-subtle uppercase tracking-wider shrink-0">
                            {member.user?.role || 'MEMBER'}
                          </span>

                          {canManageProject && !isOwner && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleRemoveMember(
                                  member.userId,
                                  member.user?.name || member.userId
                                )
                              }
                              disabled={removeMemberMutation.isPending}
                              title="Remove member from project"
                              className="px-3 py-1 text-xs shrink-0"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Team Member Card (Right 1 Column) */}
          <div className="space-y-6">
            {canManageProject ? (
              <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-sm space-y-4">
                <div className="border-b border-border-subtle pb-3">
                  <h3 className="font-bold text-text-primary text-base">
                    + Add Team Member
                  </h3>
                  <p className="text-text-secondary text-xs mt-0.5">
                    Select a user from your workspace to invite to this project.
                  </p>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {memberError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs">
                      {memberError}
                    </div>
                  )}

                  <Select
                    label="Available Workspace Users"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">-- Select a User --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </Select>

                  {availableUsers.length === 0 && (
                    <p className="text-xs text-text-secondary italic">
                      All existing users in the workspace are already project members.
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={addMemberMutation.isPending}
                    disabled={
                      addMemberMutation.isPending || !selectedUserId
                    }
                  >
                    Add Member to Project
                  </Button>
                </form>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-sm text-center space-y-2">
                <span className="text-xl">🔒</span>
                <h4 className="text-sm font-bold text-text-primary">
                  Member Management Restricted
                </h4>
                <p className="text-text-secondary text-xs">
                  Only Project Managers and Admins can add or remove team members.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Task Board Section */}
        <div className="pt-6 border-t border-border-subtle">
          <TaskBoard project={project} canManageProject={canManageProject} />
        </div>
      </div>
    </AppShell>
  );
}
