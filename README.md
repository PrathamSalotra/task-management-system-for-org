# Project & Task Management System

A full-stack web application for organizations to manage projects, teams, and tasks — with role-based access, task tracking, and project-level dashboards.

**Live demo:** [task-management-system-for-org.vercel.app](https://task-management-system-for-org.vercel.app/)
**API docs (Swagger):** [task-management-system-for-org.onrender.com/api-docs](https://task-management-system-for-org.onrender.com/api-docs)

> Live backend runs on Render's free tier and spins down after ~15 minutes of inactivity — the first request after idle can take 30-60 seconds to respond.

---

## Test Accounts

The live demo has the following seeded accounts for trying out each role — all use the same password.

| Role | Email | Password |
|---|---|---|
| Admin | `test@admin.com` | `TestPass123!` |
| Project Manager | `test@projmj.com` | `TestPass123!` |
| Team Member | `test1@member.com` | `TestPass123!` |
| Team Member | `test2@member.com` | `TestPass123!` |

## Overview

The app supports three roles — **Admin**, **Project Manager**, and **Team Member** — each with different visibility and controls:

- **Auth** — registration, login, JWT access + refresh tokens, logout
- **Projects** — create/update/archive, team membership management, role-scoped visibility
- **Tasks** — create/edit/delete, priority and status tracking, comments, search/filter/pagination
- **Dashboard** — per-project progress, task statistics, upcoming deadlines, team performance overview (PM/Admin)
- **Audit logging** — create/update/delete actions on projects and tasks are logged with actor and timestamp

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TanStack Query, Zustand, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (access + refresh tokens), bcrypt |
| API Docs | Swagger / OpenAPI (`/api-docs`) |
| Testing | Jest (backend + frontend) |
| Containerization | Docker, Docker Compose |

## Architecture

```
Client (Next.js, Vercel)
        │  REST + JWT
        ▼
Backend API (Express, Render)
  - Auth & RBAC middleware
  - Projects, Tasks, Dashboard modules
  - Audit logging
        │  Prisma
        ▼
PostgreSQL (Neon)
```

Backend and frontend deploy as separate services; the frontend calls the backend over its public URL, configured via `NEXT_PUBLIC_API_URL`.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Git | any recent | [git-scm.com](https://git-scm.com/) |
| Node.js | 20+ (LTS) | [nodejs.org](https://nodejs.org/) |
| Docker Desktop | latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |

Verify:
```bash
git --version
node --version    # v20.x or higher
docker --version
docker ps         # confirms the Docker daemon is running
```

## Local Setup

```bash
git clone https://github.com/PrathamSalotra/task-management-system-for-org.git
cd task-management-system-for-org
```

Create `backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/task_management
JWT_SECRET=<generate — see below>
JWT_REFRESH_SECRET=<generate — see below>
PORT=4000
NODE_ENV=development
```

Generate the two secrets (must be different values):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Run it twice, once for each secret.

Start everything:
```bash
docker compose up
```
This builds and runs the database, API, and frontend together. Watch the logs for `Server listening on port 4000` from the `api` service, then confirm:
```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

Open the app at [http://localhost:3000](http://localhost:3000).

**Note:** `docker-compose.yml` currently has development-only JWT/DB values inline for local convenience — for anything beyond local dev, override them via `backend/.env` or your deployment platform's environment variables instead of editing the compose file directly.

### Running without Docker (backend/frontend as plain npm processes)

```bash
docker compose up db          # just the Postgres container
cd backend && npm install && npm run dev     # separate terminal
cd frontend && npm install && npm run dev    # separate terminal
```
If you go this route, set `DATABASE_URL` in `backend/.env` to use `localhost` instead of `db` as the host.

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Signing secret for access tokens |
| `JWT_REFRESH_SECRET` | backend | Signing secret for refresh tokens (must differ from `JWT_SECRET`) |
| `PORT` | backend | Port the API listens on (default `4000`) |
| `NODE_ENV` | backend | `development` or `production` |
| `NEXT_PUBLIC_API_URL` | frontend | Base URL of the backend API — baked in at build time, so it must be set correctly before building for deployment |

## Database

Schema and migrations live in `backend/prisma/schema.prisma` / `backend/prisma/migrations/`. Core entities: `User`, `Project`, `ProjectMember`, `Task`, `Comment`, `Attachment`, `AuditLog`.

```bash
cd backend
npx prisma studio        # browse the database visually
npx prisma migrate deploy   # apply migrations to a target database
```

## Running Tests

```bash
npm test              # backend tests, from repo root
npm run test:frontend # frontend tests, from repo root
npm run test:all      # both
```

## API Documentation

- Swagger UI: `/api-docs` on the running backend (locally: [http://localhost:4000/api-docs](http://localhost:4000/api-docs))
- Postman collection: [`postman_collection.json`](./postman_collection.json) at the repo root — import directly into Postman

## Project Structure

```
├── backend/          Express API, Prisma schema, tests
├── frontend/          Next.js app
├── docker-compose.yml
└── postman_collection.json
```