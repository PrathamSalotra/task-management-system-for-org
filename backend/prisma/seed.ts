import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('TestPass123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'prathamsalotra@proton.me' },
    update: {
      name: 'Password',
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      name: 'Password',
      email: 'prathamsalotra@proton.me',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log('Seeded admin user:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
