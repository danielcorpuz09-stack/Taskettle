import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './notifications.controller';
import { notificationIdParam } from './notifications.schema';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get('/', asyncHandler(controller.list));
notificationsRouter.post('/read-all', asyncHandler(controller.readAll));
notificationsRouter.patch(
  '/:id/read',
  validate({ params: notificationIdParam }),
  asyncHandler(controller.read)
);
