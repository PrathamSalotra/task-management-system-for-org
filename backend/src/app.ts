import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import projectsRoutes from './modules/projects/projects.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import auditRoutes from './modules/audit/audit.routes';
import swaggerUi from 'swagger-ui-express';
import { getSwaggerSpec } from './config/swagger';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
      ].filter(Boolean) as string[];
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api-docs', swaggerUi.serve, (_req: Request, res: Response, next: any) => {
  return swaggerUi.setup(getSwaggerSpec())(_req, res, next);
});
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(getSwaggerSpec());
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

let server: any = null;
if (require.main === module) {
  const port = config.port;
  server = app.listen(port, () => {
    console.log(`Server listening on port ${port} in ${config.nodeEnv} mode`);
  });
}

export { app, server };
export default app;
