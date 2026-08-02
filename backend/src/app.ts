import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);

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
