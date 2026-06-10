import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireMembership } from '../../middleware/membership';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './inventory.controller';
import {
  createInventoryItemSchema,
  createTaskFromItemSchema,
  inventoryItemIdParam,
  updateInventoryItemSchema,
} from './inventory.schema';

// Circle-scoped routes: /circles/:circleId/inventory
export const inventoryCircleRouter = Router({ mergeParams: true });

inventoryCircleRouter.use(requireMembership);
inventoryCircleRouter.get('/', asyncHandler(controller.list));
inventoryCircleRouter.get('/dashboard', asyncHandler(controller.dashboard));
inventoryCircleRouter.post(
  '/',
  validate({ body: createInventoryItemSchema }),
  asyncHandler(controller.create)
);

// Top-level mutations: /inventory/:itemId
export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);
inventoryRouter.patch(
  '/:itemId',
  validate({ params: inventoryItemIdParam, body: updateInventoryItemSchema }),
  asyncHandler(controller.update)
);
inventoryRouter.delete(
  '/:itemId',
  validate({ params: inventoryItemIdParam }),
  asyncHandler(controller.remove)
);
inventoryRouter.post(
  '/:itemId/add-to-shopping-list',
  validate({ params: inventoryItemIdParam }),
  asyncHandler(controller.addToShoppingList)
);
inventoryRouter.post(
  '/:itemId/create-task',
  validate({ params: inventoryItemIdParam, body: createTaskFromItemSchema }),
  asyncHandler(controller.createTask)
);
