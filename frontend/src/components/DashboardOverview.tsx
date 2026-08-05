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
import {
  Folder,
  Target,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  AlertTriangle,
  FolderOpen,
  CheckCircle,
} from 'lucide-react';
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
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Active Projects
            </p>
            <p className="text-3xl font-extrabold text-text-primary mt-1">
              {projectProgress.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Folder className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Overall Completion
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {overallPct}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Completed Tasks
            </p>
            <p className="text-3xl font-extrabold text-text-primary mt-1">
              {completionBreakdown.completed}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Pending Tasks
            </p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {completionBreakdown.pending}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Main Content + Right-Hand Panel (Reference Pattern) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* MAIN AREA (Left 2 Columns): Per-Project Progress Cards & Task Stat Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Progress Overview - Rounded Cards */}
          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <span>📊</span>
                  <span>Project Progress Overview</span>
                </h2>

              </div>
              <span className="text-xs text-text-secondary font-semibold">
                {projectProgress.length} Active
              </span>
            </div>

            {projectProgress.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="w-6 h-6 text-indigo-500" />}
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
                      className="p-5 rounded-2xl bg-surface-muted border border-border-subtle hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all group space-y-4 flex flex-col justify-between shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-secondary group-hover:text-accent transition-colors uppercase tracking-wider">
                            PROJECT
                          </span>
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {pct}%
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-text-primary truncate group-hover:text-accent transition-colors">
                          {proj.projectName}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <div className="w-full h-2.5 bg-border-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
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
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span>📈</span>
                  <span>Task Status Distribution</span>
                </h3>
                <span className="text-xs text-text-secondary font-semibold">
                  {totalTasksCount} Total Tasks
                </span>
              </div>

              <div className="space-y-4">
                {/* Horizontal Stacked Bar */}
                <div className="w-full h-3.5 bg-border-subtle rounded-full overflow-hidden flex">
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
                        className="h-full bg-slate-400 transition-all duration-500"
                        style={{
                          width: `${(todoCount / totalTasksCount) * 100}%`,
                        }}
                        title={`Todo: ${todoCount}`}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-border-subtle" />
                  )}
                </div>

                {/* Stat List */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-muted border border-border-subtle space-y-2 min-w-0 overflow-hidden">
                    <div className="flex justify-center w-full">
                      <StatusPill
                        status="COMPLETED"
                        className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                      />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-text-primary text-center">
                      {completedCount}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-muted border border-border-subtle space-y-2 min-w-0 overflow-hidden">
                    <div className="flex justify-center w-full">
                      <StatusPill
                        status="IN_PROGRESS"
                        className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                      />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-text-primary text-center">
                      {inProgressCount}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-muted border border-border-subtle space-y-2 min-w-0 overflow-hidden">
                    <div className="flex justify-center w-full">
                      <StatusPill
                        status="TODO"
                        className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                      />
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-text-primary text-center">
                      {todoCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span>🎯</span>
                  <span>Task Priority Breakdown</span>
                </h3>
                <span className="text-xs text-text-secondary font-semibold">
                  Urgency Levels
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-muted border border-border-subtle space-y-2 min-w-0 overflow-hidden">
                  <div className="flex justify-center w-full">
                    <PriorityBadge
                      priority="HIGH"
                      className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                    />
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-text-primary text-center">
                    {highPriorityCount}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-muted border border-border-subtle space-y-2 min-w-0 overflow-hidden">
                  <div className="flex justify-center w-full">
                    <PriorityBadge
                      priority="MEDIUM"
                      className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                    />
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-text-primary text-center">
                    {mediumPriorityCount}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-muted border border-border-subtle space-y-2 min-w-0 overflow-hidden">
                  <div className="flex justify-center w-full">
                    <PriorityBadge
                      priority="LOW"
                      className="text-[10px] sm:text-xs px-2 py-0.5 max-w-full"
                    />
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-text-primary text-center">
                    {lowPriorityCount}
                  </p>
                </div>
              </div>

              {/* Priority visual meters */}
              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex items-center justify-between">
                  <span>High Priority Ratio</span>
                  <span className="font-bold text-[#D2465B]">
                    {totalTasksCount > 0
                      ? Math.round((highPriorityCount / totalTasksCount) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-border-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D2465B] transition-all duration-500"
                    style={{
                      width: `${totalTasksCount > 0
                        ? (highPriorityCount / totalTasksCount) * 100
                        : 0
                        }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT-HAND PANEL (Right Column): Upcoming Deadlines matching "Meetings Schedule" card pattern */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-sm space-y-5 lg:h-[710px] lg:flex lg:flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Upcoming Deadlines</span>
                </h2>

              </div>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
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
                    className="block p-4 rounded-xl bg-surface-muted border border-border-subtle hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all group space-y-2.5 shadow-sm overflow-hidden min-w-0"
                  >
                    {/* Top Row: Due date/time in a colored accent + PriorityBadge */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 min-w-0 truncate">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{formatDate(task.dueDate)}</span>
                      </span>
                      <div className="shrink-0">
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>

                    {/* Middle Row: Bold Title + Project Name Subtitle */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-text-primary group-hover:text-accent transition-colors truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-text-secondary mt-0.5 truncate">
                        {task.projectName}
                      </p>
                    </div>

                    {/* Bottom Row: Assignee single avatar matching Meetings Schedule card pattern exactly */}
                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle min-w-0 gap-2">
                      <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider shrink-0">
                        Assignee
                      </span>
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        {task.assignee ? (
                          <>
                            <Avatar
                              name={task.assignee.name}
                              size="xs"
                              title={task.assignee.name}
                            />
                            <span className="text-xs font-semibold text-text-primary truncate">
                              {task.assignee.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-text-secondary italic truncate">
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

      {/* 5. Team Performance Card List (PM & Admin Only) - Symmetrical Full-Width Section */}
      {isPmOrAdmin && (
        <div className="w-full p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-1">
                <span>👑 Manager / Admin View</span>
              </div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Team Performance</span>
              </h2>

            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary font-semibold">
                {teamPerformance.length} Active Members
              </span>
            </div>
          </div>

          {teamPerformance.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6 text-indigo-500" />}
              title="No Team Members"
              description="No team members found on active projects."
            />
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scroll-smooth">
              {teamPerformance.map((member) => {
                const hasOverdue = member.overdueTasks > 0;
                return (
                  <div
                    key={member.userId}
                    className={`p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-4 shadow-sm ${hasOverdue
                      ? 'bg-red-50/80 border-red-300 hover:border-red-400'
                      : 'bg-surface-muted border border-border-subtle hover:bg-white hover:border-indigo-300 hover:shadow-md'
                      }`}
                  >
                    {/* Left: Avatar + Name + Email */}
                    <div className="flex items-center gap-3.5 min-w-[240px] flex-1">
                      <Avatar
                        name={member.name}
                        size="md"
                        title={member.email || member.name}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-text-primary flex items-center gap-2 flex-wrap">
                          <span className="truncate">{member.name}</span>
                          {hasOverdue && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FDE7E9] text-[#D2465B] dark:bg-red-500/20 dark:text-red-300 border border-[#D2465B]/30 dark:border-red-500/40 shrink-0">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Overdue Tasks</span>
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5 font-mono truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {/* Right: Completed Task Count + Overdue Task Count Badges */}
                    <div className="flex items-center gap-3 flex-wrap shrink-0">
                      {/* Completed Tasks */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border-subtle shrink-0">
                        <span className="text-xs font-semibold text-text-secondary">
                          Completed:
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {member.completedTasks}
                        </span>
                      </div>

                      {/* Overdue Tasks (HIGH/red tone if > 0) */}
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 ${hasOverdue
                          ? 'bg-[#FDE7E9] text-[#D2465B] dark:bg-red-500/20 dark:text-red-300 border-[#D2465B]/30 dark:border-red-500/40 font-extrabold animate-pulse'
                          : 'bg-surface border border-border-subtle text-text-secondary'
                          }`}
                      >
                        <span className="text-xs font-semibold">
                          Overdue:
                        </span>
                        <span
                          className={`text-sm font-extrabold ${hasOverdue
                            ? 'text-[#D2465B] dark:text-red-300'
                            : 'text-text-secondary'
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
  );
}
