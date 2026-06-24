import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { logger } from './utils/logger';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }));
  }

  // Global rate limit — protects against brute-force and abuse.
  // Auth routes get a tighter limit applied separately below.
  const globalLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many auth attempts. Try again later.', code: 'RateLimited' } },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
