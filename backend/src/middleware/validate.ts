import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validates req.body / req.query / req.params against the given Zod
 * schemas and replaces them with the parsed (and coerced/defaulted)
 * values, so downstream code can trust the shape of the data.
 */
export function validate(schemas: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as unknown as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as unknown as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError('Request validation failed', err.flatten().fieldErrors);
      }
      throw err;
    }
  };
}
