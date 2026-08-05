import request from 'supertest';
import app from '../../app';
import { cleanDatabase, disconnectPrisma } from '../../test/helpers';

/**
 * Rate-limit tests run with NODE_ENV=test, so the limiter's `skip` function
 * returns true and every request goes through normally.
 *
 * To actually exercise the 429 path we temporarily override NODE_ENV inside
 * each test that needs the limiter active.
 */
describe('Auth Rate Limiting', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await disconnectPrisma();
  });

  it('returns 429 after exceeding the login threshold', async () => {
    // Activate rate limiter by pretending we are not in test env
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      // Send 11 rapid requests (limit is 10 per window)
      const responses = await Promise.all(
        Array.from({ length: 11 }, () =>
          request(app).post('/api/v1/auth/login').send({
            email: 'notreal@example.com',
            password: 'wrong',
          })
        )
      );

      const statuses = responses.map((r) => r.status);
      // At least one request must have been rate-limited
      expect(statuses).toContain(429);

      // The 429 body should match our error shape
      const blocked = responses.find((r) => r.status === 429);
      expect(blocked?.body.error).toBe('Too many requests');
      expect(blocked?.body.retryAfter).toBe('15 minutes');
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it('returns 429 after exceeding the register threshold', async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const responses = await Promise.all(
        Array.from({ length: 11 }, (_, i) =>
          request(app).post('/api/v1/auth/register').send({
            name: `User ${i}`,
            email: `user${i}@example.com`,
            password: 'Password123!',
          })
        )
      );

      const statuses = responses.map((r) => r.status);
      expect(statuses).toContain(429);

      const blocked = responses.find((r) => r.status === 429);
      expect(blocked?.body.error).toBe('Too many requests');
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it('does NOT rate-limit in test environment (existing tests stay green)', async () => {
    // NODE_ENV is 'test' by default in jest — limiter should skip
    const responses = await Promise.all(
      Array.from({ length: 11 }, () =>
        request(app).post('/api/v1/auth/login').send({
          email: 'notreal@example.com',
          password: 'wrong',
        })
      )
    );

    // All should be 401 (bad credentials), none 429
    responses.forEach((r) => expect(r.status).toBe(401));
  });
});
