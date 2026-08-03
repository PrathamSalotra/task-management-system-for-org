import {
  updateTask,
  addComment,
  TaskForbiddenError,
  TaskNotFoundError,
} from './tasks.service';
import { prisma } from '../../prisma/client';
import {
  Role,
  TaskStatus,
  TaskPriority,
} from '../../generated/prisma/client';

const mockTx = {
  task: {
    update: jest.fn(),
  },
  comment: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

jest.mock('../../prisma/client', () => ({
  prisma: {
    $transaction: jest.fn(async (cb) => cb(mockTx)),
    task: {
      findUnique: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  $transaction: jest.Mock;
  task: {
    findUnique: jest.Mock;
  };
};

describe('Task Business Rules Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Status Change Rule (Only Assignee / PM / Admin can change status)', () => {
    const sampleTask = {
      id: 'task-100',
      title: 'Setup Database',
      description: 'Initial DB setup',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assigneeId: 'tm-assignee-1',
      projectId: 'proj-1',
      project: {
        id: 'proj-1',
        managerId: 'pm-owner-1',
        members: [
          { userId: 'tm-assignee-1' },
          { userId: 'tm-member-2' },
        ],
      },
    };

    it('should allow the assigned team member to change task status', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTask);
      mockTx.task.update.mockResolvedValue({
        ...sampleTask,
        status: TaskStatus.IN_PROGRESS,
      });
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await updateTask(
        'task-100',
        { status: TaskStatus.IN_PROGRESS },
        { id: 'tm-assignee-1', role: Role.TEAM_MEMBER }
      );

      expect(mockedPrisma.task.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'task-100' } })
      );
      expect(mockTx.task.update).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should allow the owning Project Manager to change task status', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTask);
      mockTx.task.update.mockResolvedValue({
        ...sampleTask,
        status: TaskStatus.COMPLETED,
      });
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await updateTask(
        'task-100',
        { status: TaskStatus.COMPLETED },
        { id: 'pm-owner-1', role: Role.PROJECT_MANAGER }
      );

      expect(mockTx.task.update).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(TaskStatus.COMPLETED);
    });

    it('should allow an Admin to change task status', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTask);
      mockTx.task.update.mockResolvedValue({
        ...sampleTask,
        status: TaskStatus.COMPLETED,
      });
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await updateTask(
        'task-100',
        { status: TaskStatus.COMPLETED },
        { id: 'admin-99', role: Role.ADMIN }
      );

      expect(mockTx.task.update).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(TaskStatus.COMPLETED);
    });

    it('should throw TaskForbiddenError when a Team Member who is NOT the assignee tries to change status', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTask);

      await expect(
        updateTask(
          'task-100',
          { status: TaskStatus.IN_PROGRESS },
          { id: 'tm-member-2', role: Role.TEAM_MEMBER }
        )
      ).rejects.toThrow(TaskForbiddenError);

      expect(mockTx.task.update).not.toHaveBeenCalled();
    });

    it('should throw TaskForbiddenError when an external user tries to change task status', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTask);

      await expect(
        updateTask(
          'task-100',
          { status: TaskStatus.COMPLETED },
          { id: 'outsider-1', role: Role.TEAM_MEMBER }
        )
      ).rejects.toThrow(TaskForbiddenError);

      expect(mockTx.task.update).not.toHaveBeenCalled();
    });
  });

  describe('Comment Business Rule (Only Project Members can comment)', () => {
    const sampleTaskWithMembers = {
      id: 'task-100',
      title: 'Setup Database',
      projectId: 'proj-1',
      project: {
        id: 'proj-1',
        managerId: 'pm-owner-1',
        members: [
          { userId: 'tm-member-1' },
          { userId: 'tm-member-2' },
        ],
      },
    };

    it('should allow a project member to add a comment', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTaskWithMembers);
      const newComment = {
        id: 'comment-1',
        taskId: 'task-100',
        userId: 'tm-member-1',
        content: 'Looks good to me!',
        createdAt: new Date(),
        user: {
          id: 'tm-member-1',
          name: 'Member One',
          email: 'member1@example.com',
          role: Role.TEAM_MEMBER,
        },
      };

      mockTx.comment.create.mockResolvedValue(newComment);
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await addComment(
        'task-100',
        'Looks good to me!',
        { id: 'tm-member-1', role: Role.TEAM_MEMBER }
      );

      expect(mockedPrisma.task.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'task-100' } })
      );
      expect(mockTx.comment.create).toHaveBeenCalledTimes(1);
      expect(result.content).toBe('Looks good to me!');
    });

    it('should allow the owning PM to add a comment', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTaskWithMembers);
      mockTx.comment.create.mockResolvedValue({
        id: 'comment-2',
        content: 'PM Comment',
      });
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await addComment(
        'task-100',
        'PM Comment',
        { id: 'pm-owner-1', role: Role.PROJECT_MANAGER }
      );

      expect(mockTx.comment.create).toHaveBeenCalledTimes(1);
      expect(result.content).toBe('PM Comment');
    });

    it('should allow an Admin to add a comment', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTaskWithMembers);
      mockTx.comment.create.mockResolvedValue({
        id: 'comment-3',
        content: 'Admin Comment',
      });
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await addComment(
        'task-100',
        'Admin Comment',
        { id: 'admin-1', role: Role.ADMIN }
      );

      expect(mockTx.comment.create).toHaveBeenCalledTimes(1);
    });

    it('should throw TaskForbiddenError when a non-member attempts to add a comment', async () => {
      mockedPrisma.task.findUnique.mockResolvedValue(sampleTaskWithMembers);

      await expect(
        addComment(
          'task-100',
          'Intruder comment',
          { id: 'outsider-999', role: Role.TEAM_MEMBER }
        )
      ).rejects.toThrow(TaskForbiddenError);

      expect(mockTx.comment.create).not.toHaveBeenCalled();
    });
  });
});
