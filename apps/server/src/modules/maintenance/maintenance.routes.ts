import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { MaintenanceController } from './maintenance.controller';
import {
  createScheduleSchema,
  updateScheduleSchema,
  listSchedulesSchema,
} from './maintenance.schema';

const router = Router();

// POST /api/maintenance
router.post(
  '/',
  requireAuth,
  validate({
    body: createScheduleSchema,
  }),
  asyncHandler(MaintenanceController.createSchedule)
);

// POST /api/maintenance/list
router.post(
  '/list',
  requireAuth,
  validate({
    body: listSchedulesSchema,
  }),
  asyncHandler(MaintenanceController.listSchedules)
);

// GET /api/maintenance/:scheduleId
router.get(
  '/:scheduleId',
  requireAuth,
  asyncHandler(MaintenanceController.getSchedule)
);

// PATCH /api/maintenance/:scheduleId
router.patch(
  '/:scheduleId',
  requireAuth,
  validate({
    body: updateScheduleSchema,
  }),
  asyncHandler(MaintenanceController.updateSchedule)
);

// DELETE /api/maintenance/:scheduleId
router.delete(
  '/:scheduleId',
  requireAuth,
  asyncHandler(MaintenanceController.deleteSchedule)
);

export default router;
