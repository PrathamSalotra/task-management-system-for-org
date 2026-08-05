import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Strip channel_binding parameter — not supported by the pg driver used with
// @prisma/adapter-pg; Neon works correctly with sslmode=require alone.
const connectionString = process.env.DATABASE_URL.replace(
  /[&?]channel_binding=[^&]*/,
  ''
);

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // required for Neon TLS
});

// Surface connection errors immediately at startup rather than on first query
pool.on('error', (err) => {
  console.error('[pg pool] Unexpected error on idle client:', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma, pool };
export default prisma;
