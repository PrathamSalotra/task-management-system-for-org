import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0d14] flex flex-col items-center justify-center p-6 md:p-12">
      {/* Subtle Background Glow Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto text-center relative z-10 space-y-8">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span>System Status: Frontend Skeleton Ready</span>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Enterprise{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Task Management
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-light leading-relaxed">
            Collaborate seamlessly across agile teams, track milestones in real-time, and elevate your
            organization&apos;s productivity with our state-of-the-art workspace.
          </p>
        </div>

        {/* Feature Cards Glassmorphism Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/40 transition-all duration-300 group shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Boards</h3>
            <p className="text-sm text-slate-400">
              Dynamic Kanban workflows with status controls and priority filtering.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 group shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              🔒
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Role-Based Access</h3>
            <p className="text-sm text-slate-400">
              Granular JWT authentication gating actions by Admin, PM, and Team Member roles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-300 group shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
              📊
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Live Analytics</h3>
            <p className="text-sm text-slate-400">
              Comprehensive dashboard aggregation widgets tracking project velocity.
            </p>
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            id="explore-dashboard-btn"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Explore Dashboard
          </button>
          <button
            id="view-documentation-btn"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 text-slate-300 font-medium border border-slate-800 transition-all duration-200"
          >
            View Specification
          </button>
        </div>
      </div>
    </main>
  );
}
