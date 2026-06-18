import { Request, Response } from 'express';
import { RecurringExpensesService } from './recurring-expenses.service';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesInput,
} from './recurring-expenses.schema';

export class RecurringExpensesController {
  static async createExpense(req: Request, res: Response) {
    const data = req.body as CreateExpenseInput;
    const expense = await RecurringExpensesService.createExpense(data, req.user!.id);
    res.status(201).json(expense);
  }

  static async getExpense(req: Request, res: Response) {
    const { expenseId } = req.params;
    const expense = await RecurringExpensesService.getExpense(expenseId, req.user!.id);
    res.json(expense);
  }

  static async listExpenses(req: Request, res: Response) {
    const data = req.body as ListExpensesInput;
    const expenses = await RecurringExpensesService.listExpenses(data, req.user!.id);
    res.json(expenses);
  }

  static async updateExpense(req: Request, res: Response) {
    const { expenseId } = req.params;
    const data = req.body as UpdateExpenseInput;
    const expense = await RecurringExpensesService.updateExpense(
      expenseId,
      data,
      req.user!.id
    );
    res.json(expense);
  }

  static async deleteExpense(req: Request, res: Response) {
    const { expenseId } = req.params;
    await RecurringExpensesService.deleteExpense(expenseId, req.user!.id);
    res.status(204).send();
  }
}
