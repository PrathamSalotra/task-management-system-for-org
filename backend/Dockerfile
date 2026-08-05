# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --no-audit --no-fund

COPY . .

# Add dummy URL to prevent prisma.config.ts from crashing during the build phase
ENV DATABASE_URL="postgresql://neondb_owner:npg_BvdaL3m6SPnf@ep-frosty-shape-ax4ry5wz-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

RUN npx prisma generate
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --only=production --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 4000

# Start the server directly (Schema sync is handled locally per Step 9.4.2)
CMD ["node", "dist/app.js"]