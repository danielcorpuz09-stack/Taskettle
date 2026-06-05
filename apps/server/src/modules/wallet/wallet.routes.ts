import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireMembership } from '../../middleware/membership';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './wallet.controller';
import {
  accountIdParam,
  budgetIdParam,
  categoryIdParam,
  createAccountSchema,
  createBudgetSchema,
  createCategorySchema,
  createDebtSchema,
  createTransactionSchema,
  debtIdParam,
  recordPaymentSchema,
  transactionIdParam,
  transactionQuerySchema,
  updateAccountSchema,
  updateBudgetSchema,
  updateDebtSchema,
  updateTransactionSchema,
} from './wallet.schema';

// Circle-scoped routes: /circles/:circleId/wallet/*
export const walletCircleRouter = Router({ mergeParams: true });

walletCircleRouter.use(requireMembership);

walletCircleRouter.get('/dashboard', asyncHandler(controller.dashboard));

walletCircleRouter.get('/accounts', asyncHandler(controller.listAccounts));
walletCircleRouter.post(
  '/accounts',
  validate({ body: createAccountSchema }),
  asyncHandler(controller.createAccount)
);

walletCircleRouter.get('/categories', asyncHandler(controller.listCategories));
walletCircleRouter.post(
  '/categories',
  validate({ body: createCategorySchema }),
  asyncHandler(controller.createCategory)
);

walletCircleRouter.get(
  '/transactions',
  validate({ query: transactionQuerySchema }),
  asyncHandler(controller.listTransactions)
);
walletCircleRouter.post(
  '/transactions',
  validate({ body: createTransactionSchema }),
  asyncHandler(controller.createTransaction)
);

walletCircleRouter.get('/budgets', asyncHandler(controller.listBudgets));
walletCircleRouter.post(
  '/budgets',
  validate({ body: createBudgetSchema }),
  asyncHandler(controller.createBudget)
);

walletCircleRouter.get('/debts', asyncHandler(controller.listDebts));
walletCircleRouter.post(
  '/debts',
  validate({ body: createDebtSchema }),
  asyncHandler(controller.createDebt)
);

// Top-level mutations: /wallet/*
export const walletRouter = Router();
walletRouter.use(requireAuth);

walletRouter.patch(
  '/accounts/:accountId',
  validate({ params: accountIdParam, body: updateAccountSchema }),
  asyncHandler(controller.updateAccount)
);
walletRouter.delete(
  '/accounts/:accountId',
  validate({ params: accountIdParam }),
  asyncHandler(controller.deleteAccount)
);

walletRouter.delete(
  '/categories/:categoryId',
  validate({ params: categoryIdParam }),
  asyncHandler(controller.deleteCategory)
);

walletRouter.patch(
  '/transactions/:transactionId',
  validate({ params: transactionIdParam, body: updateTransactionSchema }),
  asyncHandler(controller.updateTransaction)
);
walletRouter.delete(
  '/transactions/:transactionId',
  validate({ params: transactionIdParam }),
  asyncHandler(controller.deleteTransaction)
);

walletRouter.patch(
  '/budgets/:budgetId',
  validate({ params: budgetIdParam, body: updateBudgetSchema }),
  asyncHandler(controller.updateBudget)
);
walletRouter.delete(
  '/budgets/:budgetId',
  validate({ params: budgetIdParam }),
  asyncHandler(controller.deleteBudget)
);

walletRouter.patch(
  '/debts/:debtId',
  validate({ params: debtIdParam, body: updateDebtSchema }),
  asyncHandler(controller.updateDebt)
);
walletRouter.post(
  '/debts/:debtId/payments',
  validate({ params: debtIdParam, body: recordPaymentSchema }),
  asyncHandler(controller.recordPayment)
);
