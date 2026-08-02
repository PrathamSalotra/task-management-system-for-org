'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useProjects, useCreateProject } from '../../hooks';
import { useUIStore } from '../../store/useUIStore';

export default function DashboardPage() {
  const { user, accessToken, isLoading, isAuthenticated, logout, apiFetch } =
    useAuth();
  const router = useRouter();

  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const projectsQuery = useProjects({ pageSize: 10 });
  const createProjectMutation = useCreateProject();

  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateSampleProject = async () => {
    try {
      await createProjectMutation.mutateAsync({
        name: `Sample Project ${Math.floor(Math.random() * 1000)}`,
        description: 'An automatically generated sample project to verify React Query data fetching.',
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

  const testApiCall = async () => {
    setApiStatus('loading');
    setErrorMessage(null);
    try {
      const res = await apiFetch('/api/v1/users/me');
      const data = await res.json();
      if (res.ok) {
        setApiResponse(data);
        setApiStatus('success');
      } else {
        setErrorMessage(data.error || `HTTP ${res.status}`);
        setApiStatus('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to make API request');
      setApiStatus('error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      testApiCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            T
          </div>
          <span className="text-lg font-bold tracking-tight">
            Agile Workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.email}</div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
            {user?.role}
          </span>
          <button
            id="logout-btn"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-slate-900/40 border border-indigo-500/20 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Step 6.1 — Frontend Auth Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome to Your Dashboard, {user?.name}!
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Your access token is safely stored in memory and your refresh token is persisted in an httpOnly cookie.
            </p>
          </div>
        </div>

        {/* Auth Architecture Overview & API Call Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Handling Card */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔐</span>
              <span>Token Security Status</span>
            </h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-400">Access Token</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {accessToken ? 'Active (In-Memory State)' : 'None'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-400">Refresh Token</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Protected (httpOnly Cookie)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-400">CSRF / XSS Resilience</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Strict Standard
                </span>
              </div>
            </div>
          </div>

          {/* API Verification Card */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📡</span>
                <span>API Verification</span>
              </h2>
              <button
                id="test-api-call-btn"
                onClick={testApiCall}
                disabled={apiStatus === 'loading'}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold border border-indigo-500/30 transition-colors disabled:opacity-50"
              >
                {apiStatus === 'loading' ? 'Testing...' : 'Retest API Call'}
              </button>
            </div>

            {apiStatus === 'success' && (
              <div
                id="api-verify-success-badge"
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2"
              >
                <span>✅</span>
                <span>Verified: Token Attached to API Call (200 OK)</span>
              </div>
            )}

            {apiStatus === 'error' && (
              <div
                id="api-verify-error-badge"
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold flex items-center gap-2"
              >
                <span>❌</span>
                <span>API Verification Failed: {errorMessage}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
              <div className="text-slate-500 mb-2">{'// Response from GET /api/v1/users/me'}</div>
              {apiResponse ? (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-500">Waiting for API response...</div>
              )}
            </div>
          </div>
        </div>

        {/* Step 6.2 — React Query Server-State & Zustand Local UI State Section */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
                <span>Step 6.2 — Data Fetching Setup</span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🚀</span>
                <span>React Query Projects & Zustand UI State</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Real data fetched via typed API client and React Query, with local UI state managed by Zustand.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              >
                Zustand Toggle Sidebar ({isSidebarOpen ? 'Open' : 'Closed'})
              </button>
              <button
                onClick={handleCreateSampleProject}
                disabled={createProjectMutation.isPending}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {createProjectMutation.isPending ? 'Creating...' : '+ Create Sample Project'}
              </button>
            </div>
          </div>

          {/* React Query Status Badge */}
          {projectsQuery.isSuccess && (
            <div
              id="react-query-verify-badge"
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>
                  Verified: Real Data Loaded via React Query ({projectsQuery.data?.data?.length ?? 0} projects found)
                </span>
              </div>
              <button
                onClick={() => projectsQuery.refetch()}
                className="text-xs text-emerald-300 hover:underline"
              >
                Refetch Data
              </button>
            </div>
          )}

          {/* Projects Data Grid */}
          {projectsQuery.isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Loading projects from database via React Query...
            </div>
          ) : projectsQuery.isError ? (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Error loading projects: {(projectsQuery.error as Error)?.message || 'Unknown error'}
            </div>
          ) : projectsQuery.data?.data && projectsQuery.data.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectsQuery.data.data.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {proj.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      Due: {new Date(proj.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{proj.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-3">
              <p className="text-slate-400 text-sm">
                No projects found in the database.
              </p>
              <button
                onClick={handleCreateSampleProject}
                disabled={createProjectMutation.isPending}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Create First Sample Project
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
