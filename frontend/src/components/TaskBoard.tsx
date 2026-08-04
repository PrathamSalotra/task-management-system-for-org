'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useProjectTasks,
  useCreateTask,
  useUpdateProjectTask,
  useDeleteTask,
} from '../hooks/useTasks';
import {
  formatDate,
  getAvatarInitials,
} from '../lib/utils';
import { Project, Task, TaskStatus, TaskPriority } from '../lib/api/types';
import { TaskDetailModal } from './TaskDetailModal';
import { StatusPill } from './StatusPill';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from './Avatar';

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-status-in-progress-bg text-status-in-progress-text';
    case 'COMPLETED':
      return 'bg-status-completed-bg text-status-completed-text';
    case 'TODO':
    default:
      return 'bg-status-todo-bg text-status-todo-text';
  }
}

function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case 'HIGH':
      return 'bg-priority-high-bg text-priority-high-text';
    case 'MEDIUM':
      return 'bg-priority-medium-bg text-priority-medium-text';
    case 'LOW':
    default:
      return 'bg-priority-low-bg text-priority-low-text';
  }
}

interface DateGroup {
  key: string;
  label: string;
  dateVal: number;
  tasks: Task[];
}

function getDateGroupKey(dueDate?: string | null): string {
  if (!dueDate) return 'no-date';
  return new Date(dueDate).toISOString().split('T')[0];
}

function getDateGroupLabel(dueDate?: string | null): string {
  if (!dueDate) return 'No Due Date';
  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return formatDate(dueDate);
}

function getDateGroups(tasks: Task[]): DateGroup[] {
  const map = new Map<string, DateGroup>();
  tasks.forEach((task) => {
    const key = getDateGroupKey(task.dueDate);
    const label = getDateGroupLabel(task.dueDate);
    const dateVal = task.dueDate ? new Date(task.dueDate).getTime() : Infinity;
    if (!map.has(key)) {
      map.set(key, { key, label, dateVal, tasks: [] });
    }
    map.get(key)!.tasks.push(task);
  });
  return Array.from(map.values()).sort((a, b) => a.dateVal - b.dateVal);
}

interface TaskBoardProps {
  project: Project;
  canManageProject: boolean;
}

export function TaskBoard({ project, canManageProject }: TaskBoardProps) {
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] =
    useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for new task
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<string>('MEDIUM');
  const [formAssigneeId, setFormAssigneeId] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Unfiltered (by status) tasks for tab badge counts
  const { data: allTasksResponse } = useProjectTasks(project.id, {
    search: search || undefined,
    priority: priorityFilter || undefined,
    pageSize: 100,
  });

  const { data: tasksResponse, isLoading, isError } = useProjectTasks(
    project.id,
    {
      search: search || undefined,
      priority: priorityFilter || undefined,
      status: statusFilter || undefined,
      pageSize: 100,
    }
  );

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateProjectTask(project.id);
  const deleteTaskMutation = useDeleteTask(project.id);

  const allTasks: Task[] =
    (allTasksResponse && 'data' in allTasksResponse
      ? allTasksResponse.data
      : (allTasksResponse as unknown as Task[])) || [];

  const tasks: Task[] =
    (tasksResponse && 'data' in tasksResponse
      ? tasksResponse.data
      : (tasksResponse as unknown as Task[])) || [];

  const statusTabs = [
    { key: '', label: 'All Tasks', count: allTasks.length },
    {
      key: 'TODO',
      label: 'To Do',
      count: allTasks.filter((t) => t.status === 'TODO').length,
    },
    {
      key: 'IN_PROGRESS',
      label: 'In Progress',
      count: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    },
    {
      key: 'COMPLETED',
      label: 'Completed',
      count: allTasks.filter((t) => t.status === 'COMPLETED').length,
    },
  ];

  const sortedDateGroups = getDateGroups(tasks);

  // Determine who can edit task details (Title, Priority, Assignee, DueDate) -> PM/Admin
  const canEditDetails =
    user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  // Compile list of available assignees for this project (PM + Project Members)
  const memberAssignees = (project.members || []).map((m) => {
    return {
      id: m.userId,
      name: m.user?.name || `User (${m.userId.substring(0, 8)})`,
      email: m.user?.email || '',
    };
  });

  // Include project manager if not already in members
  const hasManager = memberAssignees.some((m) => m.id === project.managerId);
  if (!hasManager && project.manager) {
    memberAssignees.unshift({
      id: project.managerId,
      name: project.manager.name,
      email: project.manager.email,
    });
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!formAssigneeId) {
      setFormError('Please assign this task to a team member.');
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        projectId: project.id,
        assigneeId: formAssigneeId,
        priority: formPriority,
        status: 'TODO',
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
      });
      setIsCreateModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormAssigneeId('');
      showToast('Task created successfully!');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        data: { status: newStatus },
      });
      showToast(`Task moved to ${newStatus}`);
    } catch (err: any) {
      alert(`Error updating status: ${err.message || 'Permission denied'}`);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        data: { priority: newPriority },
      });
      showToast(`Priority updated to ${newPriority}`);
    } catch (err: any) {
      alert(`Error updating priority: ${err.message || 'Permission denied'}`);
    }
  };

  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        data: { assigneeId: newAssigneeId },
      });
      showToast('Assignee updated successfully');
    } catch (err: any) {
      alert(`Error updating assignee: ${err.message || 'Permission denied'}`);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY delete task "${task.title}" along with its comments and attachments?\n\nThis action cannot be undone.`
      )
    ) {
      try {
        await deleteTaskMutation.mutateAsync(task.id);
        showToast('Task permanently deleted');
      } catch (err: any) {
        alert(err.message || 'Failed to delete task.');
      }
    }
  };

  const columns: { key: TaskStatus; label: string; icon: string }[] = [
    { key: 'TODO', label: 'To Do', icon: '📋' },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: '⚡' },
    { key: 'COMPLETED', label: 'Completed', icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      {/* Task Board Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <span>📌 Task Board</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tasks.length} Tasks
            </span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage tasks across statuses. Team members can update status only for tasks assigned to them.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {toastMessage && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fadeIn">
              ✓ {toastMessage}
            </div>
          )}

          {canManageProject && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs (Step UI.5) */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-slate-800/80 overflow-x-auto">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-indigo-500 text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and View Switcher Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-60 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Task Content */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">Loading project tasks...</p>
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
          Failed to load tasks for this project.
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/30 border border-slate-800/60 text-center space-y-2">
          <span className="text-2xl">📝</span>
          <h3 className="text-base font-bold text-white">No Tasks Found</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            {search || priorityFilter
              ? 'No tasks matched your filter criteria.'
              : 'There are no tasks created for this project yet.'}
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div
                key={col.key}
                className="flex flex-col rounded-2xl bg-slate-900/30 border border-slate-800/80 p-4 space-y-4"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span>{col.icon}</span>
                    <span className="font-bold text-sm text-white">
                      {col.label}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-xs font-semibold ${getStatusBadgeClass(
                      col.key
                    )}`}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards Container */}
                <div className="space-y-3 min-h-[200px]">
                  {colTasks.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      No tasks in {col.label}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isAssignee = task.assigneeId === user?.id;
                      const canChangeStatus = canEditDetails || isAssignee;

                      return (
                        <div
                          key={task.id}
                          className="group p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-white leading-tight">
                              {task.title}
                            </h4>
                            {/* Priority Control */}
                            {canEditDetails ? (
                              <select
                                value={task.priority}
                                onChange={(e) =>
                                  handlePriorityChange(
                                    task.id,
                                    e.target.value
                                  )
                                }
                                disabled={updateTaskMutation.isPending}
                                className={`text-[10px] font-semibold uppercase rounded-pill px-2.5 py-1 border-none ${getPriorityBadgeClass(
                                  task.priority
                                )} focus:outline-none cursor-pointer`}
                              >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Med</option>
                                <option value="HIGH">High</option>
                              </select>
                            ) : (
                              <PriorityBadge priority={task.priority} />
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Assignee & Due Date Row */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                            {/* Assignee Selector */}
                            <div className="flex items-center gap-1.5">
                              <Avatar name={task.assignee?.name} size="xs" />
                              {canEditDetails ? (
                                <select
                                  value={task.assigneeId || ''}
                                  onChange={(e) =>
                                    handleAssigneeChange(
                                      task.id,
                                      e.target.value
                                    )
                                  }
                                  disabled={updateTaskMutation.isPending}
                                  className="bg-slate-950 text-slate-300 text-xs rounded-lg px-1.5 py-0.5 border border-slate-800 focus:outline-none focus:border-indigo-500 max-w-[110px] truncate"
                                >
                                  <option value="">Unassigned</option>
                                  {memberAssignees.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-slate-300 font-medium truncate max-w-[100px]">
                                  {task.assignee?.name || 'Unassigned'}
                                </span>
                              )}
                            </div>

                            {/* Due Date */}
                            <span className="text-slate-500 text-[11px]">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>

                          {/* Status Change Control Box */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Status
                            </span>
                            {canChangeStatus ? (
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusChange(task.id, e.target.value)
                                }
                                disabled={updateTaskMutation.isPending}
                                className={`rounded-pill px-2.5 py-1 text-xs font-semibold border-none ${getStatusBadgeClass(
                                  task.status
                                )} focus:outline-none cursor-pointer`}
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 cursor-not-allowed text-xs"
                                title="Only the assigned member or PM can update status"
                              >
                                🔒 <StatusPill status={task.status} />
                              </span>
                            )}
                          </div>

                          {/* Discussion & Files Button + Delete Task */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              onClick={() => setSelectedTaskForDetail(task)}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-slate-950/80 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <span>💬</span>
                              <span>Discussion & Files</span>
                            </button>

                            {canEditDetails && (
                              <button
                                onClick={() => handleDeleteTask(task)}
                                disabled={deleteTaskMutation.isPending}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors shrink-0"
                                title="Permanently Delete Task"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Step UI.5 Restyle) */
        <div className="space-y-6">
          {sortedDateGroups.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
              <p className="text-slate-400 text-sm font-medium">
                No tasks found matching your filters.
              </p>
            </div>
          ) : (
            sortedDateGroups.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.key]);
              return (
                <div key={group.key} className="space-y-2.5">
                  {/* Collapsible Date Section Header */}
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedGroups((prev) => ({
                        ...prev,
                        [group.key]: !prev[group.key],
                      }))
                    }
                    className="w-full flex items-center justify-between py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl transition-all cursor-pointer text-left backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400 font-bold">
                        {isCollapsed ? '▶' : '▼'}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {group.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                        {group.tasks.length}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {isCollapsed ? 'Show tasks' : 'Hide tasks'}
                    </span>
                  </button>

                  {/* Group Tasks List */}
                  {!isCollapsed && (
                    <div className="space-y-2 pl-1 sm:pl-3">
                      {group.tasks.map((task) => {
                        const isAssignee = task.assigneeId === user?.id;
                        const canChangeStatus = canEditDetails || isAssignee;

                        return (
                          <div
                            key={task.id}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/50 transition-all backdrop-blur-xl"
                          >
                            {/* Left: Rounded Checkbox + Bold Title + Subtitle */}
                            <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={task.status === 'COMPLETED'}
                                readOnly
                                className="mt-1 md:mt-0 w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 cursor-default focus:ring-0"
                                title="Task completion status (read-only)"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-white text-sm block truncate">
                                  {task.title}
                                </span>
                                <span className="text-xs text-slate-400 block truncate mt-0.5">
                                  {task.projectName ||
                                    (task.assignee
                                      ? task.assignee.name
                                      : 'Unassigned')}
                                  {task.description
                                    ? ` • ${task.description}`
                                    : ''}
                                </span>
                              </div>
                            </div>

                            {/* Right: Priority, Assignee, StatusPill (right-aligned), Discussion, Delete */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0 self-end md:self-auto">
                              {/* Priority */}
                              {canEditDetails ? (
                                <select
                                  value={task.priority}
                                  onChange={(e) =>
                                    handlePriorityChange(
                                      task.id,
                                      e.target.value
                                    )
                                  }
                                  disabled={updateTaskMutation.isPending}
                                  className={`text-xs font-semibold uppercase rounded-pill px-2.5 py-1 border-none ${getPriorityBadgeClass(
                                    task.priority
                                  )} focus:outline-none cursor-pointer`}
                                >
                                  <option value="LOW">Low</option>
                                  <option value="MEDIUM">Medium</option>
                                  <option value="HIGH">High</option>
                                </select>
                              ) : (
                                <PriorityBadge priority={task.priority} />
                              )}

                              {/* Assignee */}
                              {canEditDetails ? (
                                <select
                                  value={task.assigneeId || ''}
                                  onChange={(e) =>
                                    handleAssigneeChange(
                                      task.id,
                                      e.target.value
                                    )
                                  }
                                  disabled={updateTaskMutation.isPending}
                                  className="bg-slate-950 text-slate-300 text-xs rounded-lg px-2.5 py-1 border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  <option value="">Unassigned</option>
                                  {memberAssignees.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-slate-300 text-xs font-medium px-2 py-1 bg-slate-950/60 rounded-lg border border-slate-800/60">
                                  {task.assignee?.name || 'Unassigned'}
                                </span>
                              )}

                              {/* Status Control / StatusPill right-aligned */}
                              {canChangeStatus ? (
                                <select
                                  value={task.status}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      task.id,
                                      e.target.value
                                    )
                                  }
                                  disabled={updateTaskMutation.isPending}
                                  className={`rounded-pill px-2.5 py-1 text-xs font-semibold border-none ${getStatusBadgeClass(
                                    task.status
                                  )} focus:outline-none cursor-pointer`}
                                >
                                  <option value="TODO">To Do</option>
                                  <option value="IN_PROGRESS">
                                    In Progress
                                  </option>
                                  <option value="COMPLETED">Completed</option>
                                </select>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 cursor-not-allowed text-xs"
                                  title="Only the assigned member or PM can update status"
                                >
                                  🔒 <StatusPill status={task.status} />
                                </span>
                              )}

                              {/* Discussion & Files Button */}
                              <button
                                onClick={() =>
                                  setSelectedTaskForDetail(task)
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/40 text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                                title="Discussion & Files"
                              >
                                <span>💬</span>
                                <span>
                                  {task._count?.comments || 0}{' '}
                                  {task._count?.comments === 1
                                    ? 'msg'
                                    : 'msgs'}
                                </span>
                              </button>

                              {/* Delete Button (PM / Admin only) */}
                              {canEditDetails && (
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  disabled={deleteTaskMutation.isPending}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors shrink-0"
                                  title="Permanently Delete Task"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Create New Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth2 token refresh"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide any implementation notes or acceptance criteria..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assignee *
                  </label>
                  <select
                    required
                    value={formAssigneeId}
                    onChange={(e) => setFormAssigneeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Assignee --</option>
                    {memberAssignees.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {createTaskMutation.isPending
                    ? 'Creating...'
                    : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal (Comments & Attachments) */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
        />
      )}
    </div>
  );
}
