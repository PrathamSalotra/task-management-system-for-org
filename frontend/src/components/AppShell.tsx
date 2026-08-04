'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
            ☰
          </button>
        </div>

        {/* Persistent Left Sidebar Region (~260-280px) */}
        <aside
          className={`${
            isMobileSidebarOpen ? 'block' : 'hidden'
          } md:block w-full md:w-[270px] lg:w-[280px] shrink-0 border-b md:border-b-0 md:border-r border-border-subtle bg-surface-card p-6 flex flex-col justify-between`}
        >
          <div className="space-y-6">
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

            {/* Sidebar Navigation Skeleton Region (layout structure only per Step UI.2) */}
            <div className="space-y-2 py-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2">
                Navigation
              </div>
              {/* Actual nav items will be populated in Step UI.3 */}
            </div>
          </div>

          {/* Sidebar Bottom: User Profile & Log Out */}
          {user && (
            <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-sm">
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
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border-subtle transition-colors shrink-0"
              >
                Log Out
              </button>
            </div>
          )}
        </aside>

        {/* Main Content Region */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface-card overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
