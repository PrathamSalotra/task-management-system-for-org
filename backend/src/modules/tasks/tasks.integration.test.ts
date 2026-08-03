import request from 'supertest';
import app from '../../app';
import { prisma } from '../../prisma/client';
import {
  cleanDatabase,
  createTestUser,
  authHeader,
  disconnectPrisma,
} from '../../test/helpers';
import {
  Role,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
} from '../../generated/prisma/client';

describe('Tasks Module Integration Tests (Supertest CRUD Flows)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  describe('CRUD Flows for Tasks', () => {
    it('should create, list, get, update status, and add comments on a task', async () => {
      const pm = await createTestUser({
        name: 'PM Owner',
        email: 'pm_tasks@example.com',
        role: Role.PROJECT_MANAGER,
      });

      const tm = await createTestUser({
        name: 'Team Member Assignee',
        email: 'tm_assignee@example.com',
        role: Role.TEAM_MEMBER,
      });

      const pmAuth = authHeader(pm);
      const tmAuth = authHeader(tm);

      // Setup: Create a project and add Team Member
      const project = await prisma.project.create({
        data: {
          name: 'Task Integration Project',
          description: 'Testing task CRUD',
          managerId: pm.id,
          startDate: new Date('2026-08-01'),
          deadline: new Date('2026-09-01'),
          status: ProjectStatus.ACTIVE,
          members: {
            create: { userId: tm.id },
          },
        },
      });

      // 1. CREATE Task as PM
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set(pmAuth)
        .send({
          projectId: project.id,
          title: 'Integration Test Task',
          description: 'Testing task flows',
          priority: TaskPriority.HIGH,
          assigneeId: tm.id,
          dueDate: '2026-08-15T00:00:00.000Z',
        })
        .expect(201);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.title).toBe('Integration Test Task');
      expect(createRes.body.assigneeId).toBe(tm.id);
      expect(createRes.body.status).toBe(TaskStatus.TODO);

      const taskId = createRes.body.id;

      // 2. LIST Tasks in Project
      const listRes = await request(app)
        .get(`/api/v1/tasks?projectId=${project.id}`)
        .set(tmAuth)
        .expect(200);

      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(
        listRes.body.data.some((t: any) => t.id === taskId)
      ).toBe(true);
      // 3. UPDATE Task Status as Assignee (Team Member)
      const updateRes = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set(tmAuth)
        .send({
          status: TaskStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(updateRes.body.status).toBe(TaskStatus.IN_PROGRESS);

      // Verify DB state
      const dbTask = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(dbTask?.status).toBe(TaskStatus.IN_PROGRESS);

      // 5. ADD COMMENT as Project Member
      const commentRes = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set(tmAuth)
        .send({
          content: 'Working on this task now!',
        })
        .expect(201);

      expect(commentRes.body.content).toBe('Working on this task now!');
      expect(commentRes.body.userId).toBe(tm.id);

      // 6. LIST COMMENTS
      const listCommentsRes = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set(tmAuth)
        .expect(200);

      expect(Array.isArray(listCommentsRes.body)).toBe(true);
      expect(listCommentsRes.body.length).toBe(1);
      expect(listCommentsRes.body[0].content).toBe(
        'Working on this task now!'
      );

      // 7. DELETE Task as PM
      await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set(pmAuth)
        .expect(200);

      const dbTaskAfterDelete = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(dbTaskAfterDelete).toBeNull();
    });
  });
});
