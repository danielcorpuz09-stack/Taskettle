import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesInput,
} from './recurring-expenses.schema';

export class RecurringExpensesService {
  static async createExpense(data: CreateExpenseInput, userId: string) {
    // Verify circle membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return await prisma.recurringExpense.create({
      data: {
        circleId: data.circleId,
        name: data.name,
        category: data.category,
        amountMinor: data.amountMinor,
        currency: data.currency,
        dueDate: data.dueDate,
        frequency: data.frequency,
        autoPay: data.autoPay,
        notes: data.notes,
        createdById: userId,
      },
    });
  }

  static async getExpense(expenseId: string, userId: string) {
    const expense = await prisma.recurringExpense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new HttpError(404, 'Recurring expense not found', 'NOT_FOUND');
    }

    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: expense.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return expense;
  }

  static async listExpenses(data: ListExpensesInput, userId: string) {
    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return await prisma.recurringExpense.findMany({
      where: {
        circleId: data.circleId,
        ...(data.category && { category: data.category }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateExpense(
    expenseId: string,
    data: UpdateExpenseInput,
    userId: string
  ) {
    await this.getExpense(expenseId, userId);

    return await prisma.recurringExpense.update({
      where: { id: expenseId },
      data,
    });
  }

  static async deleteExpense(expenseId: string, userId: string) {
    await this.getExpense(expenseId, userId);

    return await prisma.recurringExpense.delete({
      where: { id: expenseId },
    });
  }
}
