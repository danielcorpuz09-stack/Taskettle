import { z } from 'zod';
import { RecurringExpenseCategory, RecurringExpenseFrequency } from '../../types/domain';

const EXPENSE_CATEGORIES: readonly RecurringExpenseCategory[] = ['UTILITY', 'SUBSCRIPTION'];
const FREQUENCIES: readonly RecurringExpenseFrequency[] = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];

export const createExpenseSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
  name: z.string().min(1, 'Expense name is required').max(255),
  category: z
    .enum(EXPENSE_CATEGORIES as [RecurringExpenseCategory, ...RecurringExpenseCategory[]])
    .default('UTILITY'),
  amountMinor: z.number().int().min(0, 'Amount must be positive'),
  currency: z.string().default('USD'),
  dueDate: z.number().int().min(1).max(31).optional(),
  frequency: z
    .enum(FREQUENCIES as [RecurringExpenseFrequency, ...RecurringExpenseFrequency[]])
    .default('MONTHLY'),
  autoPay: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().omit({
  circleId: true,
});

export const listExpensesSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
  category: z.enum(EXPENSE_CATEGORIES as [RecurringExpenseCategory, ...RecurringExpenseCategory[]]).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesInput = z.infer<typeof listExpensesSchema>;
