'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Plus,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProjects, useCreateProject } from '../hooks';
import { Project, ProjectStatus } from '../lib/api/types';
import { Button, Input, TextArea } from './index';


function getProjectDotColor(status: ProjectStatus | string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500';
    case 'ARCHIVED':
      return 'bg-slate-400';
    case 'ACTIVE':
    default:
      return 'bg-indigo-500';
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Create project modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formError, setFormError] = useState<string | null>(null);

  const { data: projectsData } = useProjects();
  const createProjectMutation = useCreateProject();

  const canManageProjects =
    user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const allProjects = projectsData?.data || [];
  const myProjects = allProjects.filter(
    (p) =>
      isAdmin ||
      p.managerId === user?.id ||
      p.members?.some((m) => m.userId === user?.id)
  );

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Project name is required');
      return;
    }
    if (!startDate || !deadline) {
      setFormError('Start date and deadline are required');
      return;
    }
    setFormError(null);

    try {
      const newProj = await createProjectMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        deadline: new Date(deadline).toISOString(),
      });

      setName('');
      setDescription('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDeadline(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      );
      setIsCreateModalOpen(false);

      if (newProj?.id) {
        router.push(`/projects/${newProj.id}`);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      isActive:
        pathname === '/projects' || pathname.startsWith('/projects/'),
    },
  ];

  const adminNavItems = [
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      isActive: pathname === '/admin/users',
    },
    {
      name: 'Audit Log',
      href: '/admin/audit-log',
      icon: FileText,
      isActive: pathname === '/admin/audit-log',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6 lg:p-8 flex flex-col text-text-primary">
      {/* Floating Rounded Card Shell (with card radius & shadow from Section 3.4) */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto bg-surface-card rounded-card shadow-card border border-border-subtle flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Header Toggle for small viewports */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border-subtle bg-surface-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm">
              AW
            </div>
            <span className="font-bold text-lg text-text-primary">
              Agile Workspace
            </span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg border border-border-subtle"
            aria-label="Toggle Sidebar"
          >
            {isMobileSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Persistent Left Sidebar Region (~260-280px) */}
        <aside
          className={`${
            isMobileSidebarOpen ? 'flex' : 'hidden'
          } md:flex w-full md:w-[270px] lg:w-[280px] shrink-0 border-b md:border-b-0 md:border-r border-border-subtle bg-surface-card p-6 flex-col justify-between`}
        >
          <div className="space-y-6 overflow-y-auto pr-1">
            {/* Brand Title Area */}
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-lg shadow-sm">
                AW
              </div>
              <span className="font-bold text-xl tracking-tight text-text-primary">
                Agile Workspace
              </span>
            </Link>

            {/* Main Navigation (Step UI.3) */}
            <nav className="space-y-1">
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider px-3 mb-2">
                Menu
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                      item.isActive
                        ? 'bg-accent/10 text-accent font-semibold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Admin-only Nav Items */}
              {isAdmin && (
                <>
                  <div className="text-xs font-bold text-text-secondary uppercase tracking-wider px-3 pt-4 mb-2">
                    Administration
                  </div>
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                          item.isActive
                            ? 'bg-accent/10 text-accent font-semibold shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted font-medium'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>

            {/* My Projects Section */}
            <div className="pt-2">
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider px-3 mb-2">
                Projects
              </div>
              <div className="space-y-1">
                {myProjects.length === 0 ? (
                  <p className="text-xs text-text-secondary px-3 py-1.5 italic">
                    No projects yet
                  </p>
                ) : (
                  myProjects.map((proj) => {
                    const isProjActive = pathname === `/projects/${proj.id}`;
                    return (
                      <Link
                        key={proj.id}
                        href={`/projects/${proj.id}`}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                          isProjActive
                            ? 'bg-accent/10 text-accent font-semibold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted font-medium'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${getProjectDotColor(
                            proj.status
                          )}`}
                        />
                        <span className="truncate">{proj.name}</span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Bottom: CTA Button & User Profile */}
          <div className="pt-4 border-t border-border-subtle space-y-4 shrink-0">
            {canManageProjects && (
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                className="w-full"
              >
                New Project
              </Button>
            )}

            {user && (
              <div className="flex items-center justify-between text-sm pt-1">
                <div className="truncate pr-2">
                  <div className="font-medium text-text-primary truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-text-secondary truncate">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border-subtle transition-colors shrink-0"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Region */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface-card overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Create Project Modal (Step UI.3 / 6.3 Flow) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card border border-border-subtle rounded-card max-w-lg w-full p-6 space-y-6 shadow-2xl text-text-primary">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h3 className="text-lg font-bold">Create New Project</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-text-secondary hover:text-text-primary text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              <Input
                label="Project Name *"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Mobile App Overhaul"
              />

              <TextArea
                label="Description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summary of scope, key objectives, and deliverables..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="Deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
    </div>
  );
}
