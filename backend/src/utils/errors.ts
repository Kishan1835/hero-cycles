/**
 * Base class for all operational errors (errors we anticipate and
 * handle gracefully, as opposed to programming bugs).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden — insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: unknown) {
    super(message, 409, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 422, details);
  }
}
