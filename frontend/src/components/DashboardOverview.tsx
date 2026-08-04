'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useDashboardOverview } from '../hooks/useDashboard';
import {
  formatDate,
  getAvatarInitials,
} from '../lib/utils';
import { TaskStatus, TaskPriority } from '../lib/api/types';
import { StatusPill } from './StatusPill';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';
import { AvatarStack } from './AvatarStack';
import { Button, EmptyState, LoadingState } from './index';


export function DashboardOverview() {
  const { user } = useAuth();
  const { data: overview, isLoading, isError, error, refetch } =
    useDashboardOverview();

  const isPmOrAdmin =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <LoadingState
        message="Loading dashboard metrics and team performance..."
        className="p-12 rounded-2xl bg-surface border border-border-subtle"
      />
    );
  }

  if (isError || !overview) {
    return (
      <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/30 text-red-300 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>⚠️</span>
            <span>Failed to load Dashboard Data</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
        <p className="text-sm text-red-400">
          {(error as Error)?.message || 'An unexpected error occurred while fetching metrics.'}
        </p>
      </div>
    );
  }

  const {
    projectProgress = [],
    taskStats = {
      byStatus: { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 },
      byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
    },
    upcomingDeadlines = [],
    completionBreakdown = { completed: 0, pending: 0, total: 0, completionPercentage: 0 },
    teamPerformance = [],
  } = overview;

  const totalTasksCount =
    completionBreakdown.total ??
    completionBreakdown.completed + completionBreakdown.pending;
  const overallPct =
    completionBreakdown.completionPercentage ??
    (totalTasksCount > 0
      ? Math.round((completionBreakdown.completed / totalTasksCount) * 100)
      : 0);

  const todoCount = taskStats.byStatus['TODO'] ?? 0;
  const inProgressCount = taskStats.byStatus['IN_PROGRESS'] ?? 0;
  const completedCount = taskStats.byStatus['COMPLETED'] ?? 0;

  const highPriorityCount = taskStats.byPriority['HIGH'] ?? 0;
  const mediumPriorityCount = taskStats.byPriority['MEDIUM'] ?? 0;
  const lowPriorityCount = taskStats.byPriority['LOW'] ?? 0;

  return (
    <div className="space-y-8">
      {/* 1. Top Bar: Overall Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Projects
            </p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {projectProgress.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl text-indigo-400">
            📁
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Completion
            </p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">
              {overallPct}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl text-emerald-400">
            🎯
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Tasks
            </p>
            <p className="text-3xl font-extrabold text-white mt-1">
              {completionBreakdown.completed}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl text-purple-400">
            ✅
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Tasks
            </p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">
              {completionBreakdown.pending}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl text-amber-400">
            ⏳
          </div>
        </div>
      </div>

      {/* 2. Main Content + Right-Hand Panel (Reference Pattern) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* MAIN AREA (Left 2 Columns): Per-Project Progress Cards & Task Stat Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Progress Overview - Rounded Cards */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📊</span>
                  <span>Project Progress Overview</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Task completion progress across all active projects
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {projectProgress.length} Active
              </span>
            </div>

            {projectProgress.length === 0 ? (
              <EmptyState
                icon="📂"
                title="No Active Projects"
                description="No active projects found in your workspace."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[304px] overflow-y-auto pr-1 scroll-smooth">
                {projectProgress.map((proj) => {
                  const pct = Math.round(
                    proj.completionPercentage ?? proj.percentage ?? 0
                  );
                  return (
                    <Link
                      key={proj.projectId}
                      href={`/projects/${proj.projectId}`}
                      className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all group space-y-4 flex flex-col justify-between shadow-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition-colors uppercase tracking-wider">
                            PROJECT
                          </span>
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {pct}%
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {proj.projectName}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span>{proj.completedTasks} completed</span>
                          <span>{proj.totalTasks} total tasks</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Task Stat Charts Grid (Status & Priority Breakdowns) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📈</span>
                  <span>Task Status Distribution</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {totalTasksCount} Total Tasks
                </span>
              </div>

              <div className="space-y-4">
                {/* Horizontal Stacked Bar */}
                <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex">
                  {totalTasksCount > 0 ? (
                    <>
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${(completedCount / totalTasksCount) * 100}%`,
                        }}
                        title={`Completed: ${completedCount}`}
                      />
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{
                          width: `${(inProgressCount / totalTasksCount) * 100}%`,
                        }}
                        title={`In Progress: ${inProgressCount}`}
                      />
                      <div
                        className="h-full bg-slate-600 transition-all duration-500"
                        style={{
                          width: `${(todoCount / totalTasksCount) * 100}%`,
                        }}
                        title={`Todo: ${todoCount}`}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-800" />
                  )}
                </div>

                {/* Stat List */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 min-w-0 overflow-hidden">
                    <div className="flex justify-center w-full">
                      <StatusPill
                        status="COMPLETED"
                        className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                      />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-white text-center">
                      {completedCount}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 min-w-0 overflow-hidden">
                    <div className="flex justify-center w-full">
                      <StatusPill
                        status="IN_PROGRESS"
                        className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                      />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-white text-center">
                      {inProgressCount}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 min-w-0 overflow-hidden">
                    <div className="flex justify-center w-full">
                      <StatusPill
                        status="TODO"
                        className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                      />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-white text-center">
                      {todoCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>Task Priority Breakdown</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  Urgency Levels
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 min-w-0 overflow-hidden">
                  <div className="flex justify-center w-full">
                    <PriorityBadge
                      priority="HIGH"
                      className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                    />
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-white text-center">
                    {highPriorityCount}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 min-w-0 overflow-hidden">
                  <div className="flex justify-center w-full">
                    <PriorityBadge
                      priority="MEDIUM"
                      className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                    />
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-white text-center">
                    {mediumPriorityCount}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 min-w-0 overflow-hidden">
                  <div className="flex justify-center w-full">
                    <PriorityBadge
                      priority="LOW"
                      className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                    />
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-white text-center">
                    {lowPriorityCount}
                  </p>
                </div>
              </div>

              {/* Priority visual meters */}
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>High Priority Ratio</span>
                  <span className="font-bold text-red-400">
                    {totalTasksCount > 0
                      ? Math.round((highPriorityCount / totalTasksCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${
                        totalTasksCount > 0
                          ? (highPriorityCount / totalTasksCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Team Performance Card List (PM & Admin Only) */}
          {isPmOrAdmin && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-1">
                    <span>👑 Manager / Admin View</span>
                  </div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>👥</span>
                    <span>Team Performance</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Completed and overdue tasks across your team
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {teamPerformance.length > 0 && (
                    <AvatarStack
                      members={teamPerformance.map((m) => ({
                        id: m.userId,
                        name: m.name,
                        email: m.email,
                      }))}
                      max={5}
                      size="sm"
                    />
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {teamPerformance.length} Active Members
                  </span>
                </div>
              </div>

              {teamPerformance.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No Team Members"
                  description="No team members found on active projects."
                />
              ) : (
                <div className="space-y-3">
                  {teamPerformance.map((member) => {
                    const hasOverdue = member.overdueTasks > 0;
                    return (
                      <div
                        key={member.userId}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          hasOverdue
                            ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60 shadow-lg shadow-red-500/5'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Left: Avatar + Name + Email */}
                        <div className="flex items-center gap-3.5">
                          <Avatar
                            name={member.name}
                            size="md"
                            title={member.email || member.name}
                          />
                          <div>
                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                              <span>{member.name}</span>
                              {hasOverdue && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FDE7E9] text-[#D2465B] dark:bg-red-500/20 dark:text-red-300 border border-[#D2465B]/30 dark:border-red-500/40">
                                  <span>⚠️ Overdue Tasks</span>
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        {/* Right: Completed Task Count + Overdue Task Count Badges */}
                        <div className="flex items-center gap-4 sm:justify-end">
                          {/* Completed Tasks */}
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                            <span className="text-xs font-semibold text-slate-400">
                              Completed:
                            </span>
                            <span className="text-sm font-extrabold text-emerald-400">
                              {member.completedTasks}
                            </span>
                          </div>

                          {/* Overdue Tasks (HIGH/red tone if > 0) */}
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                              hasOverdue
                                ? 'bg-[#FDE7E9] text-[#D2465B] dark:bg-red-500/20 dark:text-red-300 border-[#D2465B]/30 dark:border-red-500/40 font-extrabold animate-pulse'
                                : 'bg-slate-900/80 border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <span className="text-xs font-semibold">
                              Overdue:
                            </span>
                            <span
                              className={`text-sm font-extrabold ${
                                hasOverdue
                                  ? 'text-[#D2465B] dark:text-red-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {member.overdueTasks}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT-HAND PANEL (Right Column): Upcoming Deadlines matching "Meetings Schedule" card pattern */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5 lg:h-[716px] lg:flex lg:flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⏰</span>
                  <span>Upcoming Deadlines</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tasks with near due dates
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {upcomingDeadlines.length} Soon
              </span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon="🎉"
                  title="All Caught Up!"
                  description="No upcoming task deadlines found. You are all caught up!"
                />
              </div>
            ) : (
              <div className="space-y-3 max-h-[296px] lg:max-h-none lg:flex-1 overflow-y-auto pr-1 scroll-smooth">
                {upcomingDeadlines.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}`}
                    className="block p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950 transition-all group space-y-2.5 shadow-md"
                  >
                    {/* Top Row: Due date/time in a colored accent + PriorityBadge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <span>📅</span>
                        <span>{formatDate(task.dueDate)}</span>
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>

                    {/* Middle Row: Bold Title + Project Name Subtitle */}
                    <div>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {task.projectName}
                      </p>
                    </div>

                    {/* Bottom Row: Assignee single avatar matching Meetings Schedule card pattern exactly */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Assignee
                      </span>
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <Avatar
                              name={task.assignee.name}
                              size="xs"
                              title={task.assignee.name}
                            />
                            <span className="text-xs font-semibold text-slate-300">
                              {task.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
