'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useProjects, useCreateProject, useDeleteProject } from '../../hooks';
import { AppShell } from '../../components/AppShell';
import { formatDate, getStatusBadgeStyle } from '../../lib/utils';
import { Project } from '../../lib/api/types';
import {
  Button,
  Input,
  TextArea,
  EmptyState,
  LoadingState,
} from '../../components';


export default function ProjectsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating project
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartDate, setFormStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formDeadline, setFormDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formError, setFormError] = useState<string | null>(null);

  const projectsQuery = useProjects({
    search: search || undefined,
    status: selectedStatus || undefined,
    includeArchived: selectedStatus === 'ARCHIVED' || selectedStatus === '',
    pageSize: 50,
  });

  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const canManageProjects =
    user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const handleDeleteProject = async (
    e: React.MouseEvent,
    projectId: string,
    projectName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY delete project "${projectName}" along with all of its tasks, comments, attachments, and members?\n\nThis action cannot be undone.`
      )
    ) {
      try {
        await deleteProjectMutation.mutateAsync(projectId);
      } catch (err: any) {
        alert(err.message || 'Failed to delete project.');
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    if (!formDeadline) {
      setFormError('Deadline is required.');
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        startDate: new Date(formStartDate).toISOString(),
        deadline: new Date(formDeadline).toISOString(),
      });
      setIsCreateModalOpen(false);
      setFormName('');
      setFormDescription('');
      setFormError(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    }
  };

  if (authLoading || !isAuthenticated) {
    return <LoadingState fullScreen message="Loading projects workspace..." />;
  }

  const rawProjects: Project[] =
    (projectsQuery.data && 'data' in projectsQuery.data
      ? projectsQuery.data.data
      : (projectsQuery.data as unknown as Project[])) || [];

  const projects = rawProjects.filter((project) => {
    if (selectedStatus && project.status !== selectedStatus) {
      return false;
    }
    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      const matchName = project.name.toLowerCase().includes(term);
      const matchDesc = project.description?.toLowerCase().includes(term) || false;
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const statuses = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <span>🚀 Projects Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Project Directory
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage timelines, status, and collaborate with your team across projects.
            </p>
          </div>

          {canManageProjects && (
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="self-start md:self-auto"
            >
              + New Project
            </Button>
          )}
        </div>

        {/* Filter and View Controls Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Status Pill Selectors */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {statuses.map((status) => {
                const active = selectedStatus === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Projects Content Area */}
        {projectsQuery.isLoading ? (
          <LoadingState message="Loading projects..." className="py-20" />
        ) : projectsQuery.isError ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
            Failed to load projects. Please try refreshing the page.
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No Projects Found"
            description={
              search || selectedStatus
                ? 'No projects matched your search or status filter. Try clearing your filters.'
                : 'There are no projects in the workspace yet. Create one to get started!'
            }
          />
        ) : viewMode === 'grid' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const badge = getStatusBadgeStyle(project.status);
              return (
                <div
                  key={project.id}
                  className="group flex flex-col justify-between p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1"
                      >
                        {project.name}
                      </Link>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border} uppercase tracking-wider shrink-0`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm line-clamp-2">
                      {project.description || 'No project description provided.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div>
                        <span className="block text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                          Timeline
                        </span>
                        <span>
                          {formatDate(project.startDate)} — {formatDate(project.deadline)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                          Manager
                        </span>
                        <span className="text-slate-300 font-medium">
                          {project.owner?.name || 'Assigned PM'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 text-xs font-semibold transition-all border border-slate-700/80 hover:border-indigo-500/30 flex items-center justify-center gap-1.5 group-hover:border-indigo-500/30"
                      >
                        <span>View Project & Team</span>
                        <span>→</span>
                      </Link>

                      {canManageProjects && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) =>
                            handleDeleteProject(e, project.id, project.name)
                          }
                          disabled={deleteProjectMutation.isPending}
                          title="Permanently Delete Project"
                          className="shrink-0"
                        >
                          🗑️
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-950/60">
                  <th className="px-6 py-4 font-semibold">Project Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Timeline</th>
                  <th className="px-6 py-4 font-semibold">Project Manager</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {projects.map((project) => {
                  const badge = getStatusBadgeStyle(project.status);
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-bold text-white hover:text-indigo-400 transition-colors block"
                        >
                          {project.name}
                        </Link>
                        {project.description && (
                          <span className="text-xs text-slate-500 block truncate max-w-sm mt-0.5">
                            {project.description}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border} uppercase tracking-wider`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300">
                        {formatDate(project.startDate)} — {formatDate(project.deadline)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300 font-medium">
                        {project.owner?.name || 'Assigned PM'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-400 text-xs font-semibold transition-all border border-slate-700 hover:border-indigo-500/30 inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <span>→</span>
                        </Link>
                        {canManageProjects && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) =>
                              handleDeleteProject(e, project.id, project.name)
                            }
                            disabled={deleteProjectMutation.isPending}
                            title="Permanently Delete Project"
                          >
                            🗑️ Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Create New Project</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              <Input
                label="Project Name *"
                type="text"
                required
                placeholder="e.g. Next-Gen Dashboard Refactor"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <TextArea
                label="Description"
                rows={3}
                placeholder="Outline the objectives and scope of this project..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
                <Input
                  label="Deadline *"
                  type="date"
                  required
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createProjectMutation.isPending}
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
