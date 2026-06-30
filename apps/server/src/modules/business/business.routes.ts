import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireMembership } from '../../middleware/membership';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './business.controller';
import {
  businessIdParam,
  calculateSchema,
  createBusinessSchema,
  createProductSchema,
  productIdParam,
  recordExpenseSchema,
  recordSaleSchema,
  updateBusinessSchema,
  updateProductSchema,
} from './business.schema';

// Circle-scoped routes: /circles/:circleId/business/*
export const businessCircleRouter = Router({ mergeParams: true });

businessCircleRouter.use(requireMembership);

businessCircleRouter.get('/', asyncHandler(controller.list));
businessCircleRouter.post(
  '/',
  validate({ body: createBusinessSchema }),
  asyncHandler(controller.create)
);

// Top-level routes: /business/*
export const businessRouter = Router();
businessRouter.use(requireAuth);

businessRouter.get(
  '/:businessId',
  validate({ params: businessIdParam }),
  asyncHandler(controller.get)
);
businessRouter.patch(
  '/:businessId',
  validate({ params: businessIdParam, body: updateBusinessSchema }),
  asyncHandler(controller.update)
);
businessRouter.delete(
  '/:businessId',
  validate({ params: businessIdParam }),
  asyncHandler(controller.remove)
);

businessRouter.get(
  '/:businessId/dashboard',
  validate({ params: businessIdParam }),
  asyncHandler(controller.dashboard)
);
businessRouter.get(
  '/:businessId/transactions',
  validate({ params: businessIdParam }),
  asyncHandler(controller.listTransactions)
);
businessRouter.post(
  '/:businessId/sales',
  validate({ params: businessIdParam, body: recordSaleSchema }),
  asyncHandler(controller.recordSale)
);
businessRouter.post(
  '/:businessId/expenses',
  validate({ params: businessIdParam, body: recordExpenseSchema }),
  asyncHandler(controller.recordExpense)
);

businessRouter.post(
  '/:businessId/calculate',
  validate({ params: businessIdParam, body: calculateSchema }),
  asyncHandler(controller.calculate)
);

businessRouter.get(
  '/:businessId/products',
  validate({ params: businessIdParam }),
  asyncHandler(controller.listProducts)
);
businessRouter.post(
  '/:businessId/products',
  validate({ params: businessIdParam, body: createProductSchema }),
  asyncHandler(controller.createProduct)
);
businessRouter.patch(
  '/:businessId/products/:productId',
  validate({ params: productIdParam, body: updateProductSchema }),
  asyncHandler(controller.updateProduct)
);
businessRouter.delete(
  '/:businessId/products/:productId',
  validate({ params: productIdParam }),
  asyncHandler(controller.removeProduct)
);
