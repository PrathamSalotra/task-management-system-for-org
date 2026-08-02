import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const localEnvPath = path.resolve(process.cwd(), '.env');
const rootEnvPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key_1234567890_default',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_key_1234567890_default',
};
