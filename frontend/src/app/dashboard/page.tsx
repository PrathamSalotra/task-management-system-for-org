'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCreateProject } from '../../hooks';
import { Navbar } from '../../components/Navbar';
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
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-900/40 border border-indigo-500/20 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Phase 5 — Executive Analytics & Team Workload</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Track real-time project progress, task status breakdowns, upcoming deadlines, and team workload.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCreateSampleProject}
              disabled={createProjectMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 disabled:opacity-50"
            >
              {createProjectMutation.isPending
                ? 'Creating...'
                : '+ Create Sample Project'}
            </button>
            <Link
              href="/projects"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
            >
              All Projects →
            </Link>
          </div>
        </div>

        {/* Dashboard Analytics & Metrics */}
        <DashboardOverview />
      </main>
    </div>
  );
}
