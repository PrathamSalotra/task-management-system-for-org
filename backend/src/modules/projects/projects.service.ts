import { prisma } from '../../prisma/client';
import { CreateProjectInput } from './projects.schema';

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
