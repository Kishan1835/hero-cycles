import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

/**
 * Verifies the Bearer token on incoming requests and attaches the
 * decoded payload to req.user. Does not hit the database — for
 * performance, we trust the signed token rather than re-fetching
 * the user on every request. isActive is re-checked at login and
 * can be revoked by shortening token expiry / a future denylist.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
