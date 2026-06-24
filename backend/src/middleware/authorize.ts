import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Restricts a route to one or more roles. Must run after authenticate().
 *
 * Role model for this domain:
 *  - SALESPERSON:     read parts/prices/configs, create configurations, run pricing calculator
 *  - PRICING_MANAGER: everything a salesperson can do + create/update parts + add price history entries
 *  - ADMIN:           everything + user management + delete operations
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role '${req.user.role}' is not permitted to perform this action`
      );
    }
    next();
  };
}
