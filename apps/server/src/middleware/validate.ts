import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { HttpError } from '../utils/httpError';

interface Schemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

/** Validates request parts against Zod schemas; replaces parsed values. */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.errors[0];
        const field = first?.path.join('.');
        const message = field ? `${field}: ${first.message}` : first?.message ?? 'Invalid request';
        throw new HttpError(400, message, 'VALIDATION_ERROR');
      }
      throw err;
    }
  };
}
