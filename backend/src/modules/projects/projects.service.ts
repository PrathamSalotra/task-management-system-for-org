import { prisma } from '../../prisma/client';
import { CreateProjectInput, UpdateProjectInput } from './projects.schema';
import { Role, ProjectStatus, Prisma } from '../../generated/prisma/client';

export class ProjectNotFoundError extends Error {
  constructor(message = 'Project not found') {
    super(message);
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectForbiddenError extends Error {
  constructor(
    message = 'Forbidden: Insufficient permissions to access this project'
  ) {
    super(message);
    this.name = 'ProjectForbiddenError';
  }
}

export async function createProject(
  input: CreateProjectInput,
  managerId: string
) {
  const startDate = new Date(input.startDate);
  const deadline = new Date(input.deadline);

  const project = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        name: input.name,
        description: input.description,
        managerId,
        startDate,
        deadline,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: managerId,
        action: 'CREATE_PROJECT',
        entityType: 'PROJECT',
        entityId: createdProject.id,
        metadata: {
          name: createdProject.name,
          description: createdProject.description,
          startDate: createdProject.startDate,
          deadline: createdProject.deadline,
          status: createdProject.status,
        },
      },
    });

    return createdProject;
  });

  return project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  user: { id: string; role: Role | string }
) {
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existingProject) {
    throw new ProjectNotFoundError();
  }

  if (user.role !== Role.ADMIN && existingProject.managerId !== user.id) {
    throw new ProjectForbiddenError(
      'Forbidden: Only the owning Project Manager or an Admin can update this project'
    );
  }

  const startDate = input.startDate
    ? new Date(input.startDate)
    : existingProject.startDate;
  const deadline = input.deadline
    ? new Date(input.deadline)
    : existingProject.deadline;

  if (deadline < startDate) {
    throw new Error('Deadline cannot be earlier than start date');
  }

  const data: Prisma.ProjectUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
  if (input.deadline !== undefined) data.deadline = new Date(input.deadline);
  if (input.status !== undefined) data.status = input.status;

  const updatedProject = await prisma.$transaction(async (tx) => {
    const proj = await tx.project.update({
      where: { id: projectId },
      data,
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_PROJECT',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: {
          oldData: {
            name: existingProject.name,
            description: existingProject.description,
            startDate: existingProject.startDate,
            deadline: existingProject.deadline,
            status: existingProject.status,
          },
          newData: {
            name: proj.name,
            description: proj.description,
            startDate: proj.startDate,
            deadline: proj.deadline,
            status: proj.status,
          },
        },
      },
    });

    return proj;
  });

  return updatedProject;
}

export async function listProjects(
  user: { id: string; role: Role | string },
  optionsOrIncludeArchived:
    | boolean
    | {
        includeArchived?: boolean;
        search?: string;
        status?: string;
      } = {}
) {
  const options =
    typeof optionsOrIncludeArchived === 'boolean'
      ? { includeArchived: optionsOrIncludeArchived }
      : optionsOrIncludeArchived;

  const where: Prisma.ProjectWhereInput = {};
  const andConditions: Prisma.ProjectWhereInput[] = [];

  if (options.status && options.status.trim() !== '') {
    andConditions.push({ status: options.status.trim() as ProjectStatus });
  } else if (!options.includeArchived) {
    andConditions.push({ status: { not: ProjectStatus.ARCHIVED } });
  }

  if (options.search && options.search.trim() !== '') {
    const term = options.search.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  if (user.role === Role.PROJECT_MANAGER) {
    andConditions.push({
      OR: [
        { managerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    });
  } else if (user.role === Role.TEAM_MEMBER) {
    andConditions.push({
      members: { some: { userId: user.id } },
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { members: true, tasks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
}

export async function getProjectById(
  projectId: string,
  user: { id: string; role: Role | string }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: {
        select: { id: true, name: true, email: true },
      },
      members: {
        select: {
          id: true,
          projectId: true,
          userId: true,
          joinedAt: true,
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!project) {
    throw new ProjectNotFoundError();
  }

  if (user.role === Role.PROJECT_MANAGER) {
    const isOwner = project.managerId === user.id;
    const isMember = project.members.some((m) => m.user.id === user.id);
    if (!isOwner && !isMember) {
      throw new ProjectForbiddenError();
    }
  } else if (user.role === Role.TEAM_MEMBER) {
    const isMember = project.members.some((m) => m.user.id === user.id);
    if (!isMember) {
      throw new ProjectForbiddenError();
    }
  }

  return project;
}

export async function archiveProject(
  projectId: string,
  user: { id: string; role: Role | string }
) {
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existingProject) {
    throw new ProjectNotFoundError();
  }

  if (user.role !== Role.ADMIN && existingProject.managerId !== user.id) {
    throw new ProjectForbiddenError(
      'Forbidden: Only the owning Project Manager or an Admin can archive this project'
    );
  }

  const archivedProject = await prisma.$transaction(async (tx) => {
    const proj = await tx.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.ARCHIVED },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'ARCHIVE_PROJECT',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: {
          previousStatus: existingProject.status,
          newStatus: proj.status,
        },
      },
    });

    return proj;
  });

  return archivedProject;
}

export async function deleteProjectPermanently(
  projectId: string,
  user: { id: string; role: Role | string }
) {
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existingProject) {
    throw new ProjectNotFoundError();
  }

  if (user.role !== Role.ADMIN && existingProject.managerId !== user.id) {
    throw new ProjectForbiddenError(
      'Forbidden: Only the owning Project Manager or an Admin can permanently delete this project'
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Find all tasks in project to delete their comments and attachments
    const tasks = await tx.task.findMany({
      where: { projectId },
      select: { id: true },
    });
    const taskIds = tasks.map((t) => t.id);

    if (taskIds.length > 0) {
      await tx.comment.deleteMany({
        where: { taskId: { in: taskIds } },
      });
      await tx.attachment.deleteMany({
        where: { taskId: { in: taskIds } },
      });
      await tx.task.deleteMany({
        where: { projectId },
      });
    }

    await tx.projectMember.deleteMany({
      where: { projectId },
    });

    const deletedProject = await tx.project.delete({
      where: { id: projectId },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_PROJECT_PERMANENTLY',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: {
          name: existingProject.name,
        },
      },
    });

    return deletedProject;
  });

  return result;
}

export async function addProjectMember(
  projectId: string,
  targetUserId: string,
  caller: { id: string; role: Role | string }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new ProjectNotFoundError();
  }

  if (caller.role !== Role.ADMIN && project.managerId !== caller.id) {
    throw new ProjectForbiddenError(
      'Forbidden: Only the owning Project Manager or an Admin can manage project members'
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error('User not found');
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUserId,
      },
    },
  });

  if (existingMember) {
    throw new Error('User is already a member of this project');
  }

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.projectMember.create({
      data: {
        projectId,
        userId: targetUserId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: caller.id,
        action: 'ADD_PROJECT_MEMBER',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: {
          addedUserId: targetUserId,
          addedUserEmail: targetUser.email,
        },
      },
    });

    return created;
  });

  return member;
}

export async function removeProjectMember(
  projectId: string,
  targetUserId: string,
  caller: { id: string; role: Role | string }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new ProjectNotFoundError();
  }

  if (caller.role !== Role.ADMIN && project.managerId !== caller.id) {
    throw new ProjectForbiddenError(
      'Forbidden: Only the owning Project Manager or an Admin can manage project members'
    );
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUserId,
      },
    },
  });

  if (!existingMember) {
    throw new Error('Member not found in this project');
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: caller.id,
        action: 'REMOVE_PROJECT_MEMBER',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: {
          removedUserId: targetUserId,
        },
      },
    });
  });

  return { message: 'Member removed from project successfully' };
}
