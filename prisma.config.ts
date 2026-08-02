import "./backend/node_modules/dotenv/config.js";
import { defineConfig } from "./backend/node_modules/prisma/config.js";

declare const process: {
  env: Record<string, string | undefined>;
};

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  migrations: {
    path: "backend/prisma/migrations",
    seed: "tsx ./backend/prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
