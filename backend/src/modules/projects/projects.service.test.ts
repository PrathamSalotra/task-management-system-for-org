import {
  createProject,
  updateProject,
  deleteProjectPermanently,
  ProjectForbiddenError,
  ProjectNotFoundError,
} from './projects.service';
import { prisma } from '../../prisma/client';
import { Role, ProjectStatus } from '../../generated/prisma/client';

const mockTx = {
  project: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  comment: {
    deleteMany: jest.fn(),
  },
  attachment: {
    deleteMany: jest.fn(),
  },
  projectMember: {
    deleteMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

jest.mock('../../prisma/client', () => ({
  prisma: {
    $transaction: jest.fn(async (cb) => cb(mockTx)),
    project: {
      findUnique: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  $transaction: jest.Mock;
  project: {
    findUnique: jest.Mock;
  };
};

describe('Project Business Rules Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject (PM & Admin)', () => {
    it('should allow PM/Admin to create a project and record audit log', async () => {
      const newProject = {
        id: 'proj-1',
        name: 'Alpha Project',
        description: 'Test project',
        managerId: 'pm-1',
        startDate: new Date('2026-08-01'),
        deadline: new Date('2026-09-01'),
        status: ProjectStatus.ACTIVE,
      };

      mockTx.project.create.mockResolvedValue(newProject);
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await createProject(
        {
          name: 'Alpha Project',
          description: 'Test project',
          startDate: '2026-08-01',
          deadline: '2026-09-01',
        },
        'pm-1'
      );

      expect(mockTx.project.create).toHaveBeenCalledTimes(1);
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE_PROJECT',
            entityType: 'PROJECT',
            entityId: 'proj-1',
          }),
        })
      );
      expect(result).toEqual(newProject);
    });
  });

  describe('updateProject (Only owning PM or Admin can update)', () => {
    const sampleProject = {
      id: 'proj-1',
      name: 'Alpha Project',
      description: 'Test project',
      managerId: 'pm-1',
      startDate: new Date('2026-08-01'),
      deadline: new Date('2026-09-01'),
      status: ProjectStatus.ACTIVE,
    };

    it('should allow owning PM to update project details', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
      mockTx.project.update.mockResolvedValue({
        ...sampleProject,
        name: 'Updated Alpha',
      });

      const result = await updateProject(
        'proj-1',
        { name: 'Updated Alpha' },
        { id: 'pm-1', role: Role.PROJECT_MANAGER }
      );

      expect(mockedPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
      });
      expect(mockTx.project.update).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Updated Alpha');
    });

    it('should allow Admin to update any project details', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
      mockTx.project.update.mockResolvedValue({
        ...sampleProject,
        name: 'Admin Updated',
      });

      const result = await updateProject(
        'proj-1',
        { name: 'Admin Updated' },
        { id: 'admin-99', role: Role.ADMIN }
      );

      expect(mockTx.project.update).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Admin Updated');
    });

    it('should throw ProjectForbiddenError when Team Member tries to update a project', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);

      await expect(
        updateProject(
          'proj-1',
          { name: 'Illegal Update' },
          { id: 'tm-1', role: Role.TEAM_MEMBER }
        )
      ).rejects.toThrow(ProjectForbiddenError);

      expect(mockTx.project.update).not.toHaveBeenCalled();
    });

    it('should throw ProjectForbiddenError when non-owning PM tries to update a project', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);

      await expect(
        updateProject(
          'proj-1',
          { name: 'Illegal PM Update' },
          { id: 'pm-2-other', role: Role.PROJECT_MANAGER }
        )
      ).rejects.toThrow(ProjectForbiddenError);

      expect(mockTx.project.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteProjectPermanently (Only owning PM or Admin can delete)', () => {
    const sampleProject = {
      id: 'proj-1',
      name: 'Alpha Project',
      managerId: 'pm-1',
    };

    it('should allow owning PM to permanently delete project and cascade tasks', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
      mockTx.task.findMany.mockResolvedValue([{ id: 'task-1' }]);
      mockTx.project.delete.mockResolvedValue(sampleProject);

      const result = await deleteProjectPermanently('proj-1', {
        id: 'pm-1',
        role: Role.PROJECT_MANAGER,
      });

      expect(mockTx.task.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        select: { id: true },
      });
      expect(mockTx.comment.deleteMany).toHaveBeenCalled();
      expect(mockTx.attachment.deleteMany).toHaveBeenCalled();
      expect(mockTx.task.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
      });
      expect(mockTx.projectMember.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
      });
      expect(mockTx.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
      });
      expect(result).toEqual(sampleProject);
    });

    it('should allow Admin to permanently delete any project', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);
      mockTx.task.findMany.mockResolvedValue([]);
      mockTx.project.delete.mockResolvedValue(sampleProject);

      await deleteProjectPermanently('proj-1', {
        id: 'admin-1',
        role: Role.ADMIN,
      });

      expect(mockTx.project.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw ProjectForbiddenError when Team Member attempts to delete project', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);

      await expect(
        deleteProjectPermanently('proj-1', {
          id: 'tm-10',
          role: Role.TEAM_MEMBER,
        })
      ).rejects.toThrow(ProjectForbiddenError);

      expect(mockTx.project.delete).not.toHaveBeenCalled();
    });

    it('should throw ProjectForbiddenError when non-owning PM attempts to delete project', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(sampleProject);

      await expect(
        deleteProjectPermanently('proj-1', {
          id: 'pm-other',
          role: Role.PROJECT_MANAGER,
        })
      ).rejects.toThrow(ProjectForbiddenError);

      expect(mockTx.project.delete).not.toHaveBeenCalled();
    });
  });
});
