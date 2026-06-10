import { Router } from 'express';
import { requireMembership } from '../../middleware/membership';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './shopping-list.controller';
import {
  createShoppingItemSchema,
  shoppingItemIdParam,
  updateShoppingItemSchema,
} from './shopping-list.schema';

// Circle-scoped routes: /circles/:circleId/shopping-list
export const shoppingListCircleRouter = Router({ mergeParams: true });

shoppingListCircleRouter.use(requireMembership);
shoppingListCircleRouter.get('/', asyncHandler(controller.list));
shoppingListCircleRouter.post(
  '/',
  validate({ body: createShoppingItemSchema }),
  asyncHandler(controller.create)
);

// Top-level mutations: /shopping-list/:itemId
export const shoppingListRouter = Router();
shoppingListRouter.use(requireAuth);
shoppingListRouter.patch(
  '/:itemId',
  validate({ params: shoppingItemIdParam, body: updateShoppingItemSchema }),
  asyncHandler(controller.update)
);
shoppingListRouter.delete(
  '/:itemId',
  validate({ params: shoppingItemIdParam }),
  asyncHandler(controller.remove)
);
