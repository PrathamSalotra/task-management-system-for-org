import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, pool } from '../prisma/client';
import { Role } from '../generated/prisma/client';
import { config } from '../config/env';

export async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.error(`Failed to truncate table ${tablename}:`, error);
      }
    }
  }
}

export async function createTestUser({
  name = 'Test User',
  email = 'test@example.com',
  password = 'Password123!',
  role = Role.TEAM_MEMBER,
}: {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
} = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });
  return user;
}

export function generateAccessToken(user: { id: string; role: Role | string }) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '15m' }
  );
}

export function authHeader(user: { id: string; role: Role | string }) {
  const token = generateAccessToken(user);
  return { Authorization: `Bearer ${token}` };
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
  await pool.end();
}
