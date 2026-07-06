import { Prisma, PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

if (env.nodeEnv === 'development') {
  prisma.$on('query', (e: Prisma.QueryEvent) => {
    logger.debug(`prisma query: ${e.query} — params=${e.params} (${e.duration}ms)`);
  });
}

prisma.$on('info', (e: Prisma.LogEvent) => logger.info(`prisma: ${e.message}`));
prisma.$on('warn', (e: Prisma.LogEvent) => logger.warn(`prisma: ${e.message}`));
prisma.$on('error', (e: Prisma.LogEvent) => logger.error(`prisma: ${e.message}`));
