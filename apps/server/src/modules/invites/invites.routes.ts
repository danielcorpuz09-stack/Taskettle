import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireMembership } from '../../middleware/membership';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './invites.controller';
import { createInviteSchema, inviteTokenParam } from './invites.schema';

// Mounted at /circles/:circleId/invites — needs parent params.
export const invitesRouter = Router({ mergeParams: true });

invitesRouter.post(
  '/',
  requireMembership,
  validate({ body: createInviteSchema }),
  asyncHandler(controller.create)
);

// Top-level invite acceptance: /invites/:token/accept
export const inviteAcceptRouter = Router();
inviteAcceptRouter.post(
  '/:token/accept',
  requireAuth,
  validate({ params: inviteTokenParam }),
  asyncHandler(controller.accept)
);
