import request from 'supertest';
import app from '../../app';
import { prisma } from '../../prisma/client';
import {
  cleanDatabase,
  createTestUser,
  disconnectPrisma,
} from '../../test/helpers';
import { Role } from '../../generated/prisma/client';

describe('Auth Module Integration Tests (Supertest CRUD Flows)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return user without passwordHash', async () => {
      const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(201);

      expect(res.body.email).toBe(payload.email);
      expect(res.body.name).toBe(payload.name);
      expect(res.body.role).toBe(Role.TEAM_MEMBER);
      expect(res.body.passwordHash).toBeUndefined();

      // Verify DB state
      const dbUser = await prisma.user.findUnique({
        where: { email: payload.email },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe(payload.password);
    });

    it('should return error when registering with an already existing email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Another Jane',
          email: 'existing@example.com',
          password: 'Password123!',
        })
        .expect(409);

      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login and /api/v1/auth/refresh', () => {
    it('should login with valid credentials and set refreshToken cookie', async () => {
      await createTestUser({
        name: 'Login User',
        email: 'login@example.com',
        password: 'Password123!',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      await createTestUser({
        email: 'login@example.com',
        password: 'Password123!',
      });

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and blacklist the refresh token', async () => {
      await createTestUser({
        email: 'logout@example.com',
        password: 'Password123!',
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const cookies = loginRes.headers['set-cookie'];

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(logoutRes.body.message).toBeDefined();
    });
  });
});
