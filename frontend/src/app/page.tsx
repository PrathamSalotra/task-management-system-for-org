import React from 'react';
import Link from 'next/link';
import { Zap, Shield, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-canvas flex flex-col items-center justify-center p-6 md:p-12">
      {/* Subtle Background Glow Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Link */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-muted text-text-primary text-sm font-medium border border-border-subtle transition-colors shadow-sm"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors shadow-sm"
        >
          Get Started
        </Link>
      </div>

      <div className="max-w-4xl w-full mx-auto text-center relative z-10 space-y-8">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span>System Status: Frontend Auth Ready</span>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-primary">
            Enterprise{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              Task Management
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-text-secondary font-light leading-relaxed">
            Collaborate seamlessly across agile teams, track milestones in real-time, and elevate your
            organization&apos;s productivity with our state-of-the-art workspace.
          </p>
        </div>

        {/* Feature Cards Glassmorphism Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-indigo-300 transition-all duration-300 group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Real-Time Boards</h3>
            <p className="text-sm text-text-secondary">
              Dynamic Kanban workflows with status controls and priority filtering.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-purple-300 transition-all duration-300 group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Role-Based Access</h3>
            <p className="text-sm text-text-secondary">
              Granular JWT authentication gating actions by Admin, PM, and Team Member roles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-pink-300 transition-all duration-300 group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Live Analytics</h3>
            <p className="text-sm text-text-secondary">
              Comprehensive dashboard aggregation widgets tracking project velocity.
            </p>
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            id="explore-dashboard-btn"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium shadow-md transition-all duration-200 text-center"
          >
            Explore Dashboard
          </Link>
          <Link
            href="/register"
            id="create-account-btn"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-surface-card hover:bg-surface-muted text-text-primary font-medium border border-border-subtle transition-all duration-200 text-center shadow-sm"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </main>
  );
}
