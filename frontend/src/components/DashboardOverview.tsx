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

export function DashboardOverview() {
  const { user } = useAuth();
  const { data: overview, isLoading, isError, error, refetch } =
    useDashboardOverview();

  const isPmOrAdmin =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">
          Loading dashboard metrics and team performance...
        </p>
      </div>
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
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors"
          >
            Try Again
          </button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* 2. Progress Bars Per Project */}
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
        </div>

        {projectProgress.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <p className="text-slate-400 text-sm">No active projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectProgress.map((proj) => {
              const pct = Math.round(
                proj.completionPercentage ?? proj.percentage ?? 0
              );
              return (
                <Link
                  key={proj.projectId}
                  href={`/projects/${proj.projectId}`}
                  className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/50 transition-all group space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition-colors">
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
                    <div className="flex items-center justify-between text-xs text-slate-500">
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

      {/* 3. Task Stat Charts Grid (Status & Priority Breakdowns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
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
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div>
                  <StatusPill status="COMPLETED" />
                </div>
                <p className="text-xl font-bold text-white">{completedCount}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div>
                  <StatusPill status="IN_PROGRESS" />
                </div>
                <p className="text-xl font-bold text-white">{inProgressCount}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div>
                  <StatusPill status="TODO" />
                </div>
                <p className="text-xl font-bold text-white">{todoCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🎯</span>
              <span>Task Priority Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Urgency Levels
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div>
                <PriorityBadge priority="HIGH" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                {highPriorityCount}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div>
                <PriorityBadge priority="MEDIUM" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                {mediumPriorityCount}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div>
                <PriorityBadge priority="LOW" />
              </div>
              <p className="text-2xl font-extrabold text-white">
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

      {/* 4. Upcoming Deadlines List */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⏰</span>
              <span>Upcoming Deadlines</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pending tasks ordered by their due dates
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {upcomingDeadlines.length} Due Soon
          </span>
        </div>

        {upcomingDeadlines.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <p className="text-slate-400 text-sm">
              No upcoming task deadlines found. You are all caught up!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {upcomingDeadlines.map((task) => {
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <Link
                          href={`/projects/${task.projectId}`}
                          className="hover:text-indigo-400 transition-colors"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 font-medium">
                        <span className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
                          {task.projectName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-amber-400">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusPill status={task.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                              {getAvatarInitials(task.assignee.name)}
                            </span>
                            <span>{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
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

      {/* 5. Team Performance Table (PM & Admin Only) */}
      {isPmOrAdmin && (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-1">
                <span>👑 Manager / Admin View</span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👥</span>
                <span>Team Performance Table</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed vs pending and overdue tasks across your team
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {teamPerformance.length} Active Members
            </span>
          </div>

          {teamPerformance.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <p className="text-slate-400 text-sm">
                No team members found on active projects.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-3 px-4">Team Member</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4 text-center">Completed Tasks</th>
                    <th className="py-3 px-4 text-center">Overdue Tasks</th>
                    <th className="py-3 px-4 text-right">Status Indicator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {teamPerformance.map((member) => (
                    <tr
                      key={member.userId}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
                            {getAvatarInitials(member.name)}
                          </span>
                          <span>{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {member.email}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {member.completedTasks}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {member.overdueTasks > 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                            {member.overdueTasks} Overdue
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                            0 Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {member.overdueTasks > 0 ? (
                          <span className="text-xs font-semibold text-amber-400">
                            Needs Attention
                          </span>
                        ) : member.completedTasks > 0 ? (
                          <span className="text-xs font-semibold text-emerald-400">
                            On Track
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            No Completions Yet
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
