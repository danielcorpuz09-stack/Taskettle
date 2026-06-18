import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { AssetsController } from './assets.controller';
import {
  createAssetSchema,
  updateAssetSchema,
  listAssetsSchema,
} from './assets.schema';

const router = Router();

// POST /api/assets
router.post(
  '/',
  requireAuth,
  validate({
    body: createAssetSchema,
  }),
  asyncHandler(AssetsController.createAsset)
);

// GET /api/assets
router.post(
  '/list',
  requireAuth,
  validate({
    body: listAssetsSchema,
  }),
  asyncHandler(AssetsController.listAssets)
);

// GET /api/assets/:assetId
router.get(
  '/:assetId',
  requireAuth,
  asyncHandler(AssetsController.getAsset)
);

// PATCH /api/assets/:assetId
router.patch(
  '/:assetId',
  requireAuth,
  validate({
    body: updateAssetSchema,
  }),
  asyncHandler(AssetsController.updateAsset)
);

// DELETE /api/assets/:assetId
router.delete(
  '/:assetId',
  requireAuth,
  asyncHandler(AssetsController.deleteAsset)
);

export default router;
