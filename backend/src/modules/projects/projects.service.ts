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
  includeArchived = false
) {
  const where: Prisma.ProjectWhereInput = {};

  if (!includeArchived) {
    where.status = { not: ProjectStatus.ARCHIVED };
  }

  if (user.role === Role.PROJECT_MANAGER) {
    where.OR = [
      { managerId: user.id },
      { members: { some: { userId: user.id } } },
    ];
  } else if (user.role === Role.TEAM_MEMBER) {
    where.members = { some: { userId: user.id } };
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
