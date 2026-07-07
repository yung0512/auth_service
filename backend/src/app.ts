import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: 'ok', error: null });
  });

  app.use('/api/auth', authRouter);
  app.use(errorHandler);

  return app;
}
