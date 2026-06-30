import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireMembership } from '../../middleware/membership';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { invitesRouter } from '../invites/invites.routes';
import { tasksCircleRouter } from '../tasks/tasks.routes';
import { inventoryCircleRouter } from '../inventory/inventory.routes';
import { shoppingListCircleRouter } from '../shopping-list/shopping-list.routes';
import { walletCircleRouter } from '../wallet/wallet.routes';
import { businessCircleRouter } from '../business/business.routes';
import * as controller from './circles.controller';
import { circleIdParam, createCircleSchema, updateCircleSchema, memberParam } from './circles.schema';

export const circlesRouter = Router();

circlesRouter.use(requireAuth);

circlesRouter.get('/', asyncHandler(controller.list));
circlesRouter.post('/', validate({ body: createCircleSchema }), asyncHandler(controller.create));

circlesRouter.get(
  '/:circleId',
  validate({ params: circleIdParam }),
  requireMembership,
  asyncHandler(controller.get)
);

circlesRouter.patch(
  '/:circleId',
  validate({ params: circleIdParam, body: updateCircleSchema }),
  requireMembership,
  asyncHandler(controller.update)
);

circlesRouter.delete(
  '/:circleId',
  validate({ params: circleIdParam }),
  requireMembership,
  asyncHandler(controller.archive)
);

circlesRouter.get(
  '/:circleId/members',
  validate({ params: circleIdParam }),
  requireMembership,
  asyncHandler(controller.members)
);

circlesRouter.delete(
  '/:circleId/members/:userId',
  validate({ params: memberParam }),
  requireMembership,
  asyncHandler(controller.removeMember)
);

circlesRouter.delete(
  '/:circleId/leave',
  validate({ params: circleIdParam }),
  asyncHandler(controller.leaveCircle)
);

// Nested circle-scoped resources (membership guard applied within).
circlesRouter.use('/:circleId/invites', invitesRouter);
circlesRouter.use('/:circleId/tasks', tasksCircleRouter);
circlesRouter.use('/:circleId/inventory', inventoryCircleRouter);
circlesRouter.use('/:circleId/shopping-list', shoppingListCircleRouter);
circlesRouter.use('/:circleId/wallet', walletCircleRouter);
circlesRouter.use('/:circleId/business', businessCircleRouter);
