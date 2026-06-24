import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`🚲 Hero Cycles Pricing Engine API listening on port ${env.port} [${env.nodeEnv}]`);
  logger.info(`📘 API docs available at http://localhost:${env.port}/api/docs`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});
