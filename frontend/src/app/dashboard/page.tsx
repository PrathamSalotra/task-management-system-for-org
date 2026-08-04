'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCreateProject } from '../../hooks';
import { AppShell } from '../../components/AppShell';
import { DashboardOverview } from '../../components/DashboardOverview';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const createProjectMutation = useCreateProject();

  const handleCreateSampleProject = async () => {
    try {
      await createProjectMutation.mutateAsync({
        name: `Sample Project ${Math.floor(Math.random() * 1000)}`,
        description:
          'An automatically generated sample project to explore dashboard analytics and charts.',
        startDate: new Date().toISOString(),
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (err: any) {
      alert(`Error creating sample project: ${err.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Phase 5 — Executive Analytics & Team Workload</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-text-secondary text-sm mt-1 max-w-xl">
              Track real-time project progress, task status breakdowns, upcoming deadlines, and team workload.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleCreateSampleProject}
              disabled={createProjectMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-surface-muted hover:bg-surface text-text-primary text-xs font-semibold border border-border-subtle transition-colors disabled:opacity-50 shadow-sm"
            >
              {createProjectMutation.isPending
                ? 'Creating...'
                : '+ Create Sample Project'}
            </button>
            <Link
              href="/projects"
              className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors shadow-sm"
            >
              All Projects →
            </Link>
          </div>
        </div>

        {/* Dashboard Analytics & Metrics */}
        <DashboardOverview />
      </div>
    </AppShell>
  );
}
