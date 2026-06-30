import type { Request, Response } from 'express';
import * as wallet from './wallet.service';

// --- Dashboard ---
export async function dashboard(req: Request, res: Response): Promise<void> {
  const { accountId, from, to } = req.query as Record<string, string | undefined>;
  const data = await wallet.getDashboard(req.params.circleId, req.user!.id, { accountId, from, to });
  res.status(200).json({ dashboard: data });
}

// --- Analytics ---
export async function analytics(req: Request, res: Response): Promise<void> {
  const { accountId, from, to } = req.query as Record<string, string | undefined>;
  const data = await wallet.getAnalytics(req.params.circleId, { accountId, from, to });
  res.status(200).json({ analytics: data });
}

// --- Accounts ---
export async function listAccounts(req: Request, res: Response): Promise<void> {
  const accounts = await wallet.listAccounts(req.params.circleId);
  res.status(200).json({ accounts });
}

export async function createAccount(req: Request, res: Response): Promise<void> {
  const account = await wallet.createAccount(req.params.circleId, req.body);
  res.status(201).json({ account });
}

export async function updateAccount(req: Request, res: Response): Promise<void> {
  const account = await wallet.updateAccount(req.params.accountId, req.user!.id, req.body);
  res.status(200).json({ account });
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  await wallet.deleteAccount(req.params.accountId, req.user!.id);
  res.status(204).send();
}

// --- Categories ---
export async function listCategories(req: Request, res: Response): Promise<void> {
  const categories = await wallet.listCategories(req.params.circleId);
  res.status(200).json({ categories });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const category = await wallet.createCategory(req.params.circleId, req.body);
  res.status(201).json({ category });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  await wallet.deleteCategory(req.params.categoryId, req.user!.id);
  res.status(204).send();
}

// --- Transactions ---
export async function listTransactions(req: Request, res: Response): Promise<void> {
  const { accountId, categoryId, type, search, from, to } = req.query as Record<
    string,
    string | undefined
  >;
  const transactions = await wallet.listTransactions(req.params.circleId, {
    accountId,
    categoryId,
    type,
    search,
    from,
    to,
  });
  res.status(200).json({ transactions });
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  const transaction = await wallet.createTransaction(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ transaction });
}

export async function updateTransaction(req: Request, res: Response): Promise<void> {
  const transaction = await wallet.updateTransaction(
    req.params.transactionId,
    req.user!.id,
    req.body
  );
  res.status(200).json({ transaction });
}

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  await wallet.deleteTransaction(req.params.transactionId, req.user!.id);
  res.status(204).send();
}

// --- Budgets ---
export async function listBudgets(req: Request, res: Response): Promise<void> {
  const { accountId } = req.query as Record<string, string | undefined>;
  const budgets = await wallet.listBudgets(req.params.circleId, { accountId });
  res.status(200).json({ budgets });
}

export async function createBudget(req: Request, res: Response): Promise<void> {
  const budget = await wallet.createBudget(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ budget });
}

export async function updateBudget(req: Request, res: Response): Promise<void> {
  const budget = await wallet.updateBudget(req.params.budgetId, req.user!.id, req.body);
  res.status(200).json({ budget });
}

export async function deleteBudget(req: Request, res: Response): Promise<void> {
  await wallet.deleteBudget(req.params.budgetId, req.user!.id);
  res.status(204).send();
}

// --- Debts ---
export async function listDebts(req: Request, res: Response): Promise<void> {
  const debts = await wallet.listDebts(req.params.circleId, req.user!.id);
  res.status(200).json({ debts });
}

export async function createDebt(req: Request, res: Response): Promise<void> {
  const debt = await wallet.createDebt(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ debt });
}

export async function updateDebt(req: Request, res: Response): Promise<void> {
  const debt = await wallet.updateDebt(req.params.debtId, req.user!.id, req.body);
  res.status(200).json({ debt });
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  const debt = await wallet.recordPayment(req.params.debtId, req.user!.id, req.body);
  res.status(201).json({ debt });
}

// --- Savings Goals ---
export async function listGoals(req: Request, res: Response): Promise<void> {
  const goals = await wallet.listGoals(req.params.circleId);
  res.status(200).json({ goals });
}

export async function createGoal(req: Request, res: Response): Promise<void> {
  const goal = await wallet.createGoal(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ goal });
}

export async function updateGoal(req: Request, res: Response): Promise<void> {
  const goal = await wallet.updateGoal(req.params.goalId, req.user!.id, req.body);
  res.status(200).json({ goal });
}

export async function deleteGoal(req: Request, res: Response): Promise<void> {
  await wallet.deleteGoal(req.params.goalId, req.user!.id);
  res.status(204).send();
}

export async function listContributions(req: Request, res: Response): Promise<void> {
  const contributions = await wallet.listContributions(req.params.goalId, req.user!.id);
  res.status(200).json({ contributions });
}

export async function addContribution(req: Request, res: Response): Promise<void> {
  const goal = await wallet.addContribution(req.params.goalId, req.user!.id, req.body);
  res.status(201).json({ goal });
}
