import { z } from 'zod';

const currency = z
  .string()
  .trim()
  .length(3, 'must be a 3-letter ISO code')
  .toUpperCase();

const amountMinor = z.number().int('must be whole minor units').positive();
const isoDate = z.string().datetime({ message: 'must be an ISO date' });

const accountType = z.enum(['CASH', 'BANK', 'CARD', 'SAVINGS', 'OTHER']);
const categoryType = z.enum(['INCOME', 'EXPENSE']);
const transactionType = z.enum(['INCOME', 'EXPENSE', 'TRANSFER', 'DEBT_PAYMENT']);
const budgetPeriod = z.enum(['WEEKLY', 'MONTHLY', 'CUSTOM']);
const debtStatus = z.enum(['OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']);

// --- Accounts ---
export const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  type: accountType.optional(),
  currency: currency.optional(),
  ownerId: z.string().min(1).nullable().optional(),
});

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    type: accountType.optional(),
    currency: currency.optional(),
    ownerId: z.string().min(1).nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const accountIdParam = z.object({ accountId: z.string().min(1) });

// --- Categories ---
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'is required').max(50),
  type: categoryType,
  color: z.string().trim().max(20).optional(),
  icon: z.string().trim().max(40).optional(),
});

export const categoryIdParam = z.object({ categoryId: z.string().min(1) });

// --- Transactions ---
export const createTransactionSchema = z.object({
  accountId: z.string().min(1, 'is required'),
  type: transactionType,
  amountMinor,
  currency: currency.optional(),
  categoryId: z.string().min(1).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  payee: z.string().trim().max(120).nullable().optional(),
  transactionDate: isoDate.optional(),
  businessId: z.string().min(1).nullable().optional(),
  productId: z.string().min(1).nullable().optional(),
});

export const updateTransactionSchema = z
  .object({
    accountId: z.string().min(1).optional(),
    type: transactionType.optional(),
    amountMinor: amountMinor.optional(),
    currency: currency.optional(),
    categoryId: z.string().min(1).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
    payee: z.string().trim().max(120).nullable().optional(),
    transactionDate: isoDate.optional(),
    businessId: z.string().min(1).nullable().optional(),
    productId: z.string().min(1).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const transactionIdParam = z.object({ transactionId: z.string().min(1) });

export const transactionQuerySchema = z.object({
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: transactionType.optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// --- Dashboard & Analytics ---
export const dashboardQuerySchema = z.object({
  accountId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const analyticsQuerySchema = z.object({
  accountId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// --- Budgets ---
export const createBudgetSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  categoryId: z.string().min(1).nullable().optional(),
  amountMinor,
  currency: currency.optional(),
  period: budgetPeriod.optional(),
  startsAt: isoDate.optional(),
  endsAt: isoDate.nullable().optional(),
});

export const updateBudgetSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    categoryId: z.string().min(1).nullable().optional(),
    amountMinor: amountMinor.optional(),
    currency: currency.optional(),
    period: budgetPeriod.optional(),
    startsAt: isoDate.optional(),
    endsAt: isoDate.nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const budgetIdParam = z.object({ budgetId: z.string().min(1) });

// --- Debts ---
export const createDebtSchema = z.object({
  lenderId: z.string().min(1, 'is required'),
  borrowerId: z.string().min(1, 'is required'),
  amountMinor,
  currency: currency.optional(),
  reason: z.string().trim().max(200).nullable().optional(),
  dueDate: isoDate.nullable().optional(),
});

export const updateDebtSchema = z
  .object({
    reason: z.string().trim().max(200).nullable().optional(),
    dueDate: isoDate.nullable().optional(),
    status: debtStatus.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const debtIdParam = z.object({ debtId: z.string().min(1) });

export const recordPaymentSchema = z.object({
  amountMinor,
  paidAt: isoDate.optional(),
  accountId: z.string().min(1).nullable().optional(),
});

// --- Savings Goals ---
export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  targetAmountMinor: amountMinor,
  currency: currency.optional(),
  targetDate: isoDate.nullable().optional(),
  icon: z.string().trim().max(40).optional(),
  color: z.string().trim().max(20).optional(),
});

export const updateGoalSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    targetAmountMinor: amountMinor.optional(),
    currency: currency.optional(),
    targetDate: isoDate.nullable().optional(),
    icon: z.string().trim().max(40).optional(),
    color: z.string().trim().max(20).optional(),
    status: z.enum(['ACTIVE', 'ACHIEVED', 'ARCHIVED']).optional(),
    archived: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const goalIdParam = z.object({ goalId: z.string().min(1) });

export const createContributionSchema = z.object({
  amountMinor,
  direction: z.enum(['DEPOSIT', 'WITHDRAWAL']).default('DEPOSIT'),
  accountId: z.string().min(1).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  contributedAt: isoDate.optional(),
});

export const contributionIdParam = z.object({ contributionId: z.string().min(1) });

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;