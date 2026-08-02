import { prisma } from '../../prisma/client';
import {
  Role,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
} from '../../generated/prisma/client';

export class DashboardForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardForbiddenError';
  }
}

export interface DashboardOverviewResult {
  projectProgress: Array<{
    projectId: string;
    projectName: string;
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  }>;
  taskStats: {
    byStatus: {
      TODO: number;
      IN_PROGRESS: number;
      COMPLETED: number;
    };
    byPriority: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
    };
  };
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: Date | null;
    projectId: string;
    projectName: string;
    assignee: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
  completionBreakdown: {
    completed: number;
    pending: number;
    total: number;
    completionPercentage: number;
  };
  teamPerformance?: Array<{
    userId: string;
    name: string;
    email: string;
    completedTasks: number;
    overdueTasks: number;
  }>;
}

function computeTeamPerformance(projects: any[]) {
  const memberMap = new Map<
    string,
    {
      userId: string;
      name: string;
      email: string;
      completedTasks: number;
      overdueTasks: number;
    }
  >();

  const now = new Date();

  for (const project of projects) {
    if (project.members) {
      for (const member of project.members) {
        if (member.user && !memberMap.has(member.user.id)) {
          memberMap.set(member.user.id, {
            userId: member.user.id,
            name: member.user.name,
            email: member.user.email,
            completedTasks: 0,
            overdueTasks: 0,
          });
        }
      }
    }

    for (const task of project.tasks) {
      if (task.assignee) {
        if (!memberMap.has(task.assignee.id)) {
          memberMap.set(task.assignee.id, {
            userId: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
            completedTasks: 0,
            overdueTasks: 0,
          });
        }
        const memberStats = memberMap.get(task.assignee.id)!;
        if (task.status === TaskStatus.COMPLETED) {
          memberStats.completedTasks++;
        } else if (
          task.dueDate &&
          new Date(task.dueDate).getTime() < now.getTime()
        ) {
          memberStats.overdueTasks++;
        }
      }
    }
  }

  return Array.from(memberMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function getDashboardOverview(caller: {
  id: string;
  role: Role | string;
}): Promise<DashboardOverviewResult> {
  const whereProject: any = {
    status: { not: ProjectStatus.ARCHIVED },
  };

  if (caller.role === Role.PROJECT_MANAGER) {
    whereProject.managerId = caller.id;
  } else if (caller.role === Role.TEAM_MEMBER) {
    whereProject.members = {
      some: {
        userId: caller.id,
      },
    };
  }

  const projects = await prisma.project.findMany({
    where: whereProject,
    select: {
      id: true,
      name: true,
      members: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const projectProgress = projects.map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    ).length;
    const completionPercentage =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return {
      projectId: project.id,
      projectName: project.name,
      totalTasks,
      completedTasks,
      completionPercentage,
    };
  });

  const taskStats = {
    byStatus: {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
    },
    byPriority: {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
    },
  };

  const upcomingDeadlines: Array<{
    id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: Date | null;
    projectId: string;
    projectName: string;
    assignee: {
      id: string;
      name: string;
      email: string;
    } | null;
  }> = [];

  for (const project of projects) {
    for (const task of project.tasks) {
      if (task.status in taskStats.byStatus) {
        taskStats.byStatus[task.status as TaskStatus]++;
      }
      if (task.priority in taskStats.byPriority) {
        taskStats.byPriority[task.priority as TaskPriority]++;
      }

      if (task.status !== TaskStatus.COMPLETED && task.dueDate !== null) {
        upcomingDeadlines.push({
          id: task.id,
          title: task.title,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate,
          projectId: project.id,
          projectName: project.name,
          assignee: task.assignee,
        });
      }
    }
  }

  upcomingDeadlines.sort((a, b) => {
    const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  const completedCount = taskStats.byStatus.COMPLETED;
  const pendingCount =
    taskStats.byStatus.TODO + taskStats.byStatus.IN_PROGRESS;
  const totalCount = completedCount + pendingCount;
  const completionPercentage =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const completionBreakdown = {
    completed: completedCount,
    pending: pendingCount,
    total: totalCount,
    completionPercentage,
  };

  const result: DashboardOverviewResult = {
    projectProgress,
    taskStats,
    upcomingDeadlines: upcomingDeadlines.slice(0, 20),
    completionBreakdown,
  };

  if (caller.role === Role.PROJECT_MANAGER || caller.role === Role.ADMIN) {
    result.teamPerformance = computeTeamPerformance(projects);
  }

  return result;
}

export async function getTeamPerformance(caller: {
  id: string;
  role: Role | string;
}) {
  if (caller.role === Role.TEAM_MEMBER) {
    throw new DashboardForbiddenError(
      'Forbidden: Requires PROJECT_MANAGER or ADMIN role'
    );
  }

  const whereProject: any = {
    status: { not: ProjectStatus.ARCHIVED },
  };

  if (caller.role === Role.PROJECT_MANAGER) {
    whereProject.managerId = caller.id;
  }

  const projects = await prisma.project.findMany({
    where: whereProject,
    select: {
      id: true,
      name: true,
      members: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return computeTeamPerformance(projects);
}
