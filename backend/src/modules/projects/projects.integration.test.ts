import request from 'supertest';
import app from '../../app';
import { prisma } from '../../prisma/client';
import {
  cleanDatabase,
  createTestUser,
  authHeader,
  disconnectPrisma,
} from '../../test/helpers';
import { Role, ProjectStatus } from '../../generated/prisma/client';

describe('Projects Module Integration Tests (Supertest CRUD Flows)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  describe('CRUD Flows for Projects', () => {
    it('should create, list, get, update, and delete a project as Project Manager', async () => {
      const pm = await createTestUser({
        name: 'Project Manager One',
        email: 'pm1@example.com',
        role: Role.PROJECT_MANAGER,
      });

      const pmAuth = authHeader(pm);

      // 1. CREATE Project
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set(pmAuth)
        .send({
          name: 'Integration Project Alpha',
          description: 'Testing full CRUD',
          startDate: '2026-08-01T00:00:00.000Z',
          deadline: '2026-09-01T00:00:00.000Z',
        })
        .expect(201);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.name).toBe('Integration Project Alpha');
      expect(createRes.body.managerId).toBe(pm.id);

      const projectId = createRes.body.id;

      // 2. LIST Projects
      const listRes = await request(app)
        .get('/api/v1/projects')
        .set(pmAuth)
        .expect(200);

      expect(Array.isArray(listRes.body)).toBe(true);
      expect(
        listRes.body.some((p: any) => p.id === projectId)
      ).toBe(true);

      // 3. GET Project by ID
      const getRes = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set(pmAuth)
        .expect(200);

      expect(getRes.body.id).toBe(projectId);
      expect(getRes.body.name).toBe('Integration Project Alpha');

      // 4. UPDATE Project
      const updateRes = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set(pmAuth)
        .send({
          name: 'Integration Project Alpha (Updated)',
        })
        .expect(200);

      expect(updateRes.body.name).toBe(
        'Integration Project Alpha (Updated)'
      );

      // Verify update in DB
      const dbProjAfterUpdate = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(dbProjAfterUpdate?.name).toBe(
        'Integration Project Alpha (Updated)'
      );

      // 5. ADD MEMBER to Project
      const memberUser = await createTestUser({
        name: 'Team Member Bob',
        email: 'bob@example.com',
        role: Role.TEAM_MEMBER,
      });

      const addMemberRes = await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set(pmAuth)
        .send({
          userId: memberUser.id,
        })
        .expect(201);

      expect(addMemberRes.body.userId).toBe(memberUser.id);

      // 6. PERMANENTLY DELETE Project
      await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set(pmAuth)
        .expect(200);

      // Verify DB no longer has project
      const dbProjAfterDelete = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(dbProjAfterDelete).toBeNull();
    });

    it('should return 403 Forbidden when a Team Member tries to create a project', async () => {
      const tm = await createTestUser({
        name: 'Team Member User',
        email: 'tm@example.com',
        role: Role.TEAM_MEMBER,
      });

      await request(app)
        .post('/api/v1/projects')
        .set(authHeader(tm))
        .send({
          name: 'Illegal Project',
          description: 'Should fail',
          startDate: '2026-08-01T00:00:00.000Z',
          deadline: '2026-09-01T00:00:00.000Z',
        })
        .expect(403);
    });
  });
});
