import { prisma } from '../../prisma/client';
import {
  Role,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
} from '../../generated/prisma/client';

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
      tasks: {
        select: {
          id: true,
          status: true,
          priority: true,
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

  for (const project of projects) {
    for (const task of project.tasks) {
      if (task.status in taskStats.byStatus) {
        taskStats.byStatus[task.status as TaskStatus]++;
      }
      if (task.priority in taskStats.byPriority) {
        taskStats.byPriority[task.priority as TaskPriority]++;
      }
    }
  }

  return {
    projectProgress,
    taskStats,
  };
}
