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
  formatDate,
  getStatusBadgeStyle,
  getAvatarInitials,
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
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <AppShell>
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading project info...</p>
        </div>
      </AppShell>
    );
  }

  if (isError || !project) {
    return (
      <AppShell>
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
          <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-300">Project Not Found</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              We couldn’t load the details for this project. It may have been deleted or you may lack permissions.
            </p>
            <Link
              href="/projects"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              Back to All Projects
            </Link>
          </div>
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
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 space-y-8">
        {/* Top Navigation & Status Toast */}
        <div className="flex items-center justify-between">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-all"
          >
            <span>←</span>
            <span>Back to Projects</span>
          </Link>

          {statusMessage && (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fadeIn">
              ✓ {statusMessage}
            </div>
          )}
        </div>

        {/* Project Overview Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">
                  Project Workspace
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border} uppercase tracking-wider`}
                >
                  {badge.label}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {project.name}
              </h1>
              <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
                {project.description || 'No project description provided.'}
              </p>
            </div>

            {/* PM Status Changer & Delete Project */}
            {canManageProject && (
              <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Project Actions
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updateProjectMutation.isPending}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <button
                    onClick={handleDeleteProject}
                    disabled={deleteProjectMutation.isPending}
                    className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold border border-red-500/30 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                    title="Permanently Delete Project"
                  >
                    <span>🗑️</span>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Start Date
              </span>
              <span className="text-base font-bold text-white">
                {formatDate(project.startDate)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Deadline
              </span>
              <span className="text-base font-bold text-white">
                {formatDate(project.deadline)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Project Manager
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-indigo-400">
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
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span>👥 Team Members</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {project.members?.length || 0}
                </span>
              </h2>
            </div>

            <div className="space-y-3">
              {!project.members || project.members.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
                  <p className="text-slate-400 text-sm">
                    No team members have been added to this project yet.
                  </p>
                </div>
              ) : (
                project.members.map((member) => {
                  const isOwner = member.userId === project.ownerId;
                  const initials = getAvatarInitials(member.user?.name);

                  return (
                    <div
                      key={member.id || member.userId}
                      className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {member.user?.name || `User (${member.userId.substring(0, 8)})`}
                            </span>
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                                Owner / PM
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {member.user?.email || 'Member'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800 uppercase tracking-wider">
                          {member.user?.role || 'MEMBER'}
                        </span>

                        {canManageProject && !isOwner && (
                          <button
                            onClick={() =>
                              handleRemoveMember(
                                member.userId,
                                member.user?.name || member.userId
                              )
                            }
                            disabled={removeMemberMutation.isPending}
                            className="p-2 rounded-xl bg-slate-950 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all text-xs font-semibold"
                            title="Remove member from project"
                          >
                            Remove
                          </button>
                        )}
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
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-base">
                    + Add Team Member
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Select a user from your workspace to invite to this project.
                  </p>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {memberError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                      {memberError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Available Workspace Users
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">-- Select a User --</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {availableUsers.length === 0 && (
                    <p className="text-xs text-slate-500 italic">
                      All existing users in the workspace are already project members.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      addMemberMutation.isPending || !selectedUserId
                    }
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {addMemberMutation.isPending
                      ? 'Adding Member...'
                      : 'Add Member to Project'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                <span className="text-xl">🔒</span>
                <h4 className="text-sm font-bold text-white">
                  Member Management Restricted
                </h4>
                <p className="text-slate-400 text-xs">
                  Only Project Managers and Admins can add or remove team members.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Task Board Section */}
        <div className="pt-6 border-t border-slate-800/80">
          <TaskBoard project={project} canManageProject={canManageProject} />
        </div>
      </div>
    </AppShell>
  );
}
