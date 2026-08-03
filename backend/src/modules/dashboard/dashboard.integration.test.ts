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

describe('Dashboard Module Integration Tests (Supertest Flows)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  describe('GET /api/v1/dashboard/overview', () => {
    it('should return overview stats including projects, task breakdown, and upcoming deadlines', async () => {
      const pm = await createTestUser({
        name: 'Dashboard PM',
        email: 'pm_dash@example.com',
        role: Role.PROJECT_MANAGER,
      });

      const tm = await createTestUser({
        name: 'Dashboard Member',
        email: 'tm_dash@example.com',
        role: Role.TEAM_MEMBER,
      });

      const pmAuth = authHeader(pm);

      // Create a project and tasks
      const project = await prisma.project.create({
        data: {
          name: 'Dashboard Project Alpha',
          managerId: pm.id,
          startDate: new Date('2026-08-01'),
          deadline: new Date('2026-09-01'),
          status: ProjectStatus.ACTIVE,
          members: {
            create: { userId: tm.id },
          },
        },
      });

      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            projectId: project.id,
            assigneeId: tm.id,
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            dueDate: new Date('2026-08-15'),
          },
          {
            title: 'Task 2',
            projectId: project.id,
            assigneeId: tm.id,
            status: TaskStatus.COMPLETED,
            priority: TaskPriority.MEDIUM,
            dueDate: new Date('2026-08-10'),
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set(pmAuth)
        .expect(200);

      expect(res.body.projectProgress).toBeDefined();
      expect(Array.isArray(res.body.projectProgress)).toBe(true);
      expect(res.body.projectProgress.length).toBeGreaterThan(0);
      expect(res.body.completionBreakdown).toBeDefined();
      expect(res.body.completionBreakdown.total).toBe(2);
      expect(res.body.completionBreakdown.completed).toBe(1);
      expect(res.body.upcomingDeadlines).toBeDefined();
    });
  });

  describe('GET /api/v1/dashboard/team-performance', () => {
    it('should return team performance metrics for PM or Admin', async () => {
      const pm = await createTestUser({
        name: 'Dashboard PM',
        email: 'pm_team@example.com',
        role: Role.PROJECT_MANAGER,
      });

      const res = await request(app)
        .get('/api/v1/dashboard/team-performance')
        .set(authHeader(pm))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 403 Forbidden when a Team Member attempts to access team performance', async () => {
      const tm = await createTestUser({
        name: 'Team Member',
        email: 'tm_forbidden@example.com',
        role: Role.TEAM_MEMBER,
      });

      await request(app)
        .get('/api/v1/dashboard/team-performance')
        .set(authHeader(tm))
        .expect(403);
    });
  });
});
