import { prisma } from '../../prisma/client';
import { CreateTaskInput } from './tasks.schema';
import {
  Role,
  TaskPriority,
  TaskStatus,
  Prisma,
} from '../../generated/prisma/client';
import {
  ProjectNotFoundError,
  ProjectForbiddenError,
} from '../projects/projects.service';

export class TaskNotFoundError extends Error {
  constructor(message = 'Task not found') {
    super(message);
    this.name = 'TaskNotFoundError';
  }
}

export class TaskForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'TaskForbiddenError';
  }
}

export class AssigneeNotMemberError extends Error {
  constructor(message = 'Assignee is not a member of the project') {
    super(message);
    this.name = 'AssigneeNotMemberError';
  }
}

export async function createTask(
  input: CreateTaskInput & { projectId: string },
  caller: { id: string; role: Role | string }
) {
  const { projectId, title, description, priority, assigneeId, dueDate } =
    input;

  if (!projectId) {
    throw new Error('Project ID is required');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new ProjectNotFoundError('Target project not found');
  }

  if (caller.role !== Role.ADMIN && project.managerId !== caller.id) {
    throw new TaskForbiddenError(
      'Forbidden: Only the owning Project Manager or an Admin can create tasks for this project'
    );
  }

  if (assigneeId) {
    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: assigneeId,
        },
      },
    });

    const isManager = project.managerId === assigneeId;

    if (!isMember && !isManager) {
      throw new AssigneeNotMemberError(
        'Assignee is not a member of the project'
      );
    }
  }

  const task = await prisma.$transaction(async (tx) => {
    const createdTask = await tx.task.create({
      data: {
        projectId: project.id,
        title,
        description: description || null,
        priority: priority || TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: caller.id,
        action: 'CREATE_TASK',
        entityType: 'TASK',
        entityId: createdTask.id,
        metadata: {
          projectId: project.id,
          title: createdTask.title,
          assigneeId: createdTask.assigneeId,
          priority: createdTask.priority,
          status: createdTask.status,
        },
      },
    });

    return createdTask;
  });

  return task;
}

export async function listTasks(
  projectId: string,
  caller: { id: string; role: Role | string },
  query: {
    status?: string;
    priority?: string;
    assignee?: string;
    assigneeId?: string;
    dueDate?: string;
    due_date?: string;
    search?: string;
    page?: string;
    pageSize?: string;
    limit?: string;
  }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        select: { userId: true },
      },
    },
  });

  if (!project) {
    throw new ProjectNotFoundError();
  }

  if (caller.role === Role.PROJECT_MANAGER) {
    const isOwner = project.managerId === caller.id;
    const isMember = project.members.some((m) => m.userId === caller.id);
    if (!isOwner && !isMember) {
      throw new ProjectForbiddenError();
    }
  } else if (caller.role === Role.TEAM_MEMBER) {
    const isMember = project.members.some((m) => m.userId === caller.id);
    if (!isMember) {
      throw new ProjectForbiddenError();
    }
  }

  const where: Prisma.TaskWhereInput = {
    projectId,
  };

  if (query.status) {
    const statusUpper = query.status.toUpperCase() as TaskStatus;
    if (Object.values(TaskStatus).includes(statusUpper)) {
      where.status = statusUpper;
    }
  }

  if (query.priority) {
    const priorityUpper = query.priority.toUpperCase() as TaskPriority;
    if (Object.values(TaskPriority).includes(priorityUpper)) {
      where.priority = priorityUpper;
    }
  }

  const assigneeVal = query.assignee || query.assigneeId;
  if (assigneeVal) {
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        assigneeVal
      )
    ) {
      where.assigneeId = assigneeVal;
    } else {
      where.assignee = {
        OR: [
          { name: { contains: assigneeVal, mode: 'insensitive' } },
          { email: { contains: assigneeVal, mode: 'insensitive' } },
        ],
      };
    }
  }

  const dueDateVal = query.due_date || query.dueDate;
  if (dueDateVal && !isNaN(Date.parse(dueDateVal))) {
    where.dueDate = new Date(dueDateVal);
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const pageSize = Math.max(
    1,
    parseInt(query.pageSize || query.limit || '20', 10) || 20
  );
  const skip = (page - 1) * pageSize;

  const [total, data] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}
