import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { VehiclesController } from './vehicles.controller';
import {
  createVehicleSchema,
  updateVehicleSchema,
  listVehiclesSchema,
} from './vehicles.schema';

const router = Router();

// POST /api/vehicles
router.post(
  '/',
  requireAuth,
  validate({
    body: createVehicleSchema,
  }),
  asyncHandler(VehiclesController.createVehicle)
);

// POST /api/vehicles/list
router.post(
  '/list',
  requireAuth,
  validate({
    body: listVehiclesSchema,
  }),
  asyncHandler(VehiclesController.listVehicles)
);

// GET /api/vehicles/:vehicleId
router.get(
  '/:vehicleId',
  requireAuth,
  asyncHandler(VehiclesController.getVehicle)
);

// PATCH /api/vehicles/:vehicleId
router.patch(
  '/:vehicleId',
  requireAuth,
  validate({
    body: updateVehicleSchema,
  }),
  asyncHandler(VehiclesController.updateVehicle)
);

// DELETE /api/vehicles/:vehicleId
router.delete(
  '/:vehicleId',
  requireAuth,
  asyncHandler(VehiclesController.deleteVehicle)
);

export default router;
