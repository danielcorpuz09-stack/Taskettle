import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireMembership } from '../../middleware/membership';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './wallet.controller';
import {
  accountIdParam,
  analyticsQuerySchema,
  budgetIdParam,
  categoryIdParam,
  createAccountSchema,
  createBudgetSchema,
  createCategorySchema,
  createContributionSchema,
  createDebtSchema,
  createGoalSchema,
  createTransactionSchema,
  dashboardQuerySchema,
  debtIdParam,
  goalIdParam,
  recordPaymentSchema,
  transactionIdParam,
  transactionQuerySchema,
  updateAccountSchema,
  updateBudgetSchema,
  updateDebtSchema,
  updateGoalSchema,
  updateTransactionSchema,
} from './wallet.schema';

// Circle-scoped routes: /circles/:circleId/wallet/*
export const walletCircleRouter = Router({ mergeParams: true });

walletCircleRouter.use(requireMembership);

walletCircleRouter.get(
  '/dashboard',
  validate({ query: dashboardQuerySchema }),
  asyncHandler(controller.dashboard)
);
walletCircleRouter.get(
  '/analytics',
  validate({ query: analyticsQuerySchema }),
  asyncHandler(controller.analytics)
);

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

walletCircleRouter.get(
  '/budgets',
  validate({ query: dashboardQuerySchema }),
  asyncHandler(controller.listBudgets)
);
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

walletCircleRouter.get('/goals', asyncHandler(controller.listGoals));
walletCircleRouter.post(
  '/goals',
  validate({ body: createGoalSchema }),
  asyncHandler(controller.createGoal)
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

walletRouter.patch(
  '/goals/:goalId',
  validate({ params: goalIdParam, body: updateGoalSchema }),
  asyncHandler(controller.updateGoal)
);
walletRouter.delete(
  '/goals/:goalId',
  validate({ params: goalIdParam }),
  asyncHandler(controller.deleteGoal)
);
walletRouter.get(
  '/goals/:goalId/contributions',
  validate({ params: goalIdParam }),
  asyncHandler(controller.listContributions)
);
walletRouter.post(
  '/goals/:goalId/contributions',
  validate({ params: goalIdParam, body: createContributionSchema }),
  asyncHandler(controller.addContribution)
);
