import type { Role } from './domain';

// Augment Express Request with the authenticated user and (when on a
// circle-scoped route) the caller's membership.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      membership?: { circleId: string; role: Role };
    }
  }
}

export {};
