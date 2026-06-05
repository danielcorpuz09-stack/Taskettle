import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireMembership } from '../../middleware/membership';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './tasks.controller';
import { createTaskSchema, taskIdParam, updateTaskSchema } from './tasks.schema';

// Mounted at /circles/:circleId/tasks — needs parent params.
export const tasksCircleRouter = Router({ mergeParams: true });

tasksCircleRouter.use(requireMembership);
tasksCircleRouter.get('/', asyncHandler(controller.list));
tasksCircleRouter.post('/', validate({ body: createTaskSchema }), asyncHandler(controller.create));

// Top-level task mutations by id: /tasks/:taskId (membership checked in service).
export const tasksRouter = Router();
tasksRouter.use(requireAuth);
tasksRouter.patch(
  '/:taskId',
  validate({ params: taskIdParam, body: updateTaskSchema }),
  asyncHandler(controller.update)
);
tasksRouter.delete('/:taskId', validate({ params: taskIdParam }), asyncHandler(controller.remove));
