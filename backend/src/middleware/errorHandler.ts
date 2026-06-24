import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Known, operational errors (bad input, missing resource, auth failures)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack, details: err.details });
    } else {
      logger.warn(err.message, { path: req.path, details: err.details });
    }
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.constructor.name,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Zod validation errors that weren't caught by the validate middleware
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        message: 'Validation failed',
        code: 'ValidationError',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Prisma known request errors (unique constraint violations, FK violations, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: {
          message: `A record with this ${(err.meta?.target as string[])?.join(', ') ?? 'value'} already exists`,
          code: 'UniqueConstraintViolation',
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: { message: 'Record not found', code: 'RecordNotFound' },
      });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({
        error: { message: 'Operation violates a foreign key relationship', code: 'ForeignKeyViolation' },
      });
      return;
    }
  }

  // Unknown / programming errors — never leak internals to the client
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({
    error: {
      message: env.isProduction ? 'Internal server error' : err.message,
      code: 'InternalServerError',
      ...(env.isProduction ? {} : { stack: err.stack }),
    },
  });
}
