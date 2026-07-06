import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: 'ok', error: null });
  });

  app.use('/api/auth', authRouter);
  app.use(errorHandler);

  return app;
}
