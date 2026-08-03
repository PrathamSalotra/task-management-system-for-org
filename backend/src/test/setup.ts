import dotenv from 'dotenv';
dotenv.config();

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/task_management_test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-12345';

jest.setTimeout(30000);
