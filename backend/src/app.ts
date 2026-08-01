import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

const port = config.port;

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port} in ${config.nodeEnv} mode`);
});

export { app, server };
export default app;
