import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code } });
    return;
  }

  // Known Prisma errors → friendly messages.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: { message: 'That value is already taken', code: 'CONFLICT' } });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { message: 'Resource not found', code: 'NOT_FOUND' } });
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(500).json({
    error: {
      message: env.isProd ? 'Something went wrong' : String((err as Error)?.message ?? err),
      code: 'INTERNAL',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } });
}
