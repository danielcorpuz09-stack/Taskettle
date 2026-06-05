import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/httpError';
import type { Role } from '../types/domain';

/**
 * Ensures the authenticated user belongs to the circle identified by the
 * `:circleId` route param. This is the core authorization boundary — every
 * circle-scoped resource must use it. Attaches req.membership.
 */
export async function requireMembership(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.user?.id;
  const circleId = req.params.circleId;

  if (!userId) throw new HttpError(401, 'Authentication required', 'UNAUTHENTICATED');
  if (!circleId) throw new HttpError(400, 'Missing circle id', 'MISSING_CIRCLE_ID');

  const membership = await prisma.membership.findUnique({
    where: { userId_circleId: { userId, circleId } },
    select: { circleId: true, role: true },
  });

  if (!membership) {
    throw new HttpError(403, 'You are not a member of this circle', 'NOT_A_MEMBER');
  }

  req.membership = { circleId: membership.circleId, role: membership.role as Role };
  next();
}

/** Restricts a route to circle owners. Must run after requireMembership. */
export function requireOwner(req: Request, _res: Response, next: NextFunction): void {
  if (req.membership?.role !== 'OWNER') {
    throw new HttpError(403, 'Only the circle owner can do this', 'OWNER_ONLY');
  }
  next();
}
