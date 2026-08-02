import { prisma } from '../../prisma/client';
import { CreateTaskInput } from './tasks.schema';
import { Role, TaskPriority, TaskStatus } from '../../generated/prisma/client';
import { ProjectNotFoundError } from '../projects/projects.service';

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
