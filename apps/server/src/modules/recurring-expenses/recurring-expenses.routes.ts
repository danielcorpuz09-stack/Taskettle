import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { RecurringExpensesController } from './recurring-expenses.controller';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
} from './recurring-expenses.schema';

const router = Router();

// POST /api/recurring-expenses
router.post(
  '/',
  requireAuth,
  validate({
    body: createExpenseSchema,
  }),
  asyncHandler(RecurringExpensesController.createExpense)
);

// POST /api/recurring-expenses/list
router.post(
  '/list',
  requireAuth,
  validate({
    body: listExpensesSchema,
  }),
  asyncHandler(RecurringExpensesController.listExpenses)
);

// GET /api/recurring-expenses/:expenseId
router.get(
  '/:expenseId',
  requireAuth,
  asyncHandler(RecurringExpensesController.getExpense)
);

// PATCH /api/recurring-expenses/:expenseId
router.patch(
  '/:expenseId',
  requireAuth,
  validate({
    body: updateExpenseSchema,
  }),
  asyncHandler(RecurringExpensesController.updateExpense)
);

// DELETE /api/recurring-expenses/:expenseId
router.delete(
  '/:expenseId',
  requireAuth,
  asyncHandler(RecurringExpensesController.deleteExpense)
);

export default router;
