import type {
  Budget,
  Debt,
  DebtPayment,
  Prisma,
  WalletAccount,
  WalletCategory,
  WalletTransaction,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { assertMember } from '../circles/circles.service';
import type {
  BudgetPeriod,
  DebtStatus,
  TransactionType,
  WalletAccountType,
  WalletCategoryType,
} from '../../types/domain';
import type {
  CreateAccountInput,
  CreateBudgetInput,
  CreateCategoryInput,
  CreateDebtInput,
  CreateTransactionInput,
  RecordPaymentInput,
  UpdateAccountInput,
  UpdateBudgetInput,
  UpdateDebtInput,
  UpdateTransactionInput,
} from './wallet.schema';

// --- DTOs ---
export interface WalletAccountDto {
  id: string;
  circleId: string;
  name: string;
  type: WalletAccountType;
  currency: string;
  ownerId: string | null;
  balanceMinor: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletCategoryDto {
  id: string;
  circleId: string;
  name: string;
  type: WalletCategoryType;
  color: string;
  icon: string;
  createdAt: string;
}

export interface WalletTransactionDto {
  id: string;
  circleId: string;
  accountId: string;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  categoryId: string | null;
  note: string | null;
  payee: string | null;
  transactionDate: string;
  createdById: string;
  debtId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDto {
  id: string;
  circleId: string;
  name: string;
  categoryId: string | null;
  amountMinor: number;
  currency: string;
  period: BudgetPeriod;
  startsAt: string;
  endsAt: string | null;
  spentMinor: number;
  remainingMinor: number;
  createdById: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPaymentDto {
  id: string;
  debtId: string;
  amountMinor: number;
  currency: string;
  paidById: string;
  paidToId: string;
  paidAt: string;
  createdAt: string;
}

export interface DebtDto {
  id: string;
  circleId: string;
  lenderId: string;
  borrowerId: string;
  amountMinor: number;
  paidMinor: number;
  remainingMinor: number;
  currency: string;
  reason: string | null;
  dueDate: string | null;
  status: DebtStatus;
  createdById: string;
  paidAt: string | null;
  payments: DebtPaymentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletDashboardDto {
  currency: string;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  accountsBalanceMinor: number;
  owedToMeMinor: number;
  owedByMeMinor: number;
  openDebtCount: number;
  overdueDebtCount: number;
}

// --- Mappers ---
function toAccountDto(a: WalletAccount, balanceMinor: number): WalletAccountDto {
  return {
    id: a.id,
    circleId: a.circleId,
    name: a.name,
    type: a.type as WalletAccountType,
    currency: a.currency,
    ownerId: a.ownerId,
    balanceMinor,
    archived: a.archivedAt !== null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function toCategoryDto(c: WalletCategory): WalletCategoryDto {
  return {
    id: c.id,
    circleId: c.circleId,
    name: c.name,
    type: c.type as WalletCategoryType,
    color: c.color,
    icon: c.icon,
    createdAt: c.createdAt.toISOString(),
  };
}

function toTransactionDto(t: WalletTransaction): WalletTransactionDto {
  return {
    id: t.id,
    circleId: t.circleId,
    accountId: t.accountId,
    type: t.type as TransactionType,
    amountMinor: t.amountMinor,
    currency: t.currency,
    categoryId: t.categoryId,
    note: t.note,
    payee: t.payee,
    transactionDate: t.transactionDate.toISOString(),
    createdById: t.createdById,
    debtId: t.debtId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function toPaymentDto(p: DebtPayment): DebtPaymentDto {
  return {
    id: p.id,
    debtId: p.debtId,
    amountMinor: p.amountMinor,
    currency: p.currency,
    paidById: p.paidById,
    paidToId: p.paidToId,
    paidAt: p.paidAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
  };
}

function toDebtDto(debt: Debt & { payments: DebtPayment[] }): DebtDto {
  const paidMinor = debt.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const remainingMinor = Math.max(debt.amountMinor - paidMinor, 0);
  return {
    id: debt.id,
    circleId: debt.circleId,
    lenderId: debt.lenderId,
    borrowerId: debt.borrowerId,
    amountMinor: debt.amountMinor,
    paidMinor,
    remainingMinor,
    currency: debt.currency,
    reason: debt.reason,
    dueDate: debt.dueDate ? debt.dueDate.toISOString() : null,
    status: debt.status as DebtStatus,
    createdById: debt.createdById,
    paidAt: debt.paidAt ? debt.paidAt.toISOString() : null,
    payments: debt.payments
      .slice()
      .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime())
      .map(toPaymentDto),
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString(),
  };
}

/** Signed effect of a transaction on its account balance, in minor units. */
function balanceEffect(type: string, amountMinor: number): number {
  if (type === 'INCOME') return amountMinor;
  return -amountMinor; // EXPENSE, TRANSFER (out), DEBT_PAYMENT
}

// --- Accounts ---
export async function listAccounts(circleId: string): Promise<WalletAccountDto[]> {
  const accounts = await prisma.walletAccount.findMany({
    where: { circleId },
    orderBy: [{ archivedAt: 'asc' }, { createdAt: 'asc' }],
    include: { transactions: { select: { type: true, amountMinor: true } } },
  });
  return accounts.map((a) => {
    const balance = a.transactions.reduce((sum, t) => sum + balanceEffect(t.type, t.amountMinor), 0);
    return toAccountDto(a, balance);
  });
}

export async function createAccount(
  circleId: string,
  input: CreateAccountInput
): Promise<WalletAccountDto> {
  if (input.ownerId) await assertMember(input.ownerId, circleId);
  const account = await prisma.walletAccount.create({
    data: {
      circleId,
      name: input.name,
      type: input.type ?? 'CASH',
      currency: input.currency ?? 'USD',
      ownerId: input.ownerId ?? null,
    },
  });
  return toAccountDto(account, 0);
}

export async function updateAccount(
  accountId: string,
  userId: string,
  input: UpdateAccountInput
): Promise<WalletAccountDto> {
  const existing = await prisma.walletAccount.findUnique({ where: { id: accountId } });
  if (!existing) throw new HttpError(404, 'Account not found', 'NOT_FOUND');
  await assertMember(userId, existing.circleId);
  if (input.ownerId) await assertMember(input.ownerId, existing.circleId);

  const data: Prisma.WalletAccountUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.type !== undefined) data.type = input.type;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.ownerId !== undefined) {
    data.owner = input.ownerId ? { connect: { id: input.ownerId } } : { disconnect: true };
  }
  if (input.archived !== undefined) data.archivedAt = input.archived ? new Date() : null;

  const account = await prisma.walletAccount.update({ where: { id: accountId }, data });
  const txns = await prisma.walletTransaction.findMany({
    where: { accountId },
    select: { type: true, amountMinor: true },
  });
  const balance = txns.reduce((sum, t) => sum + balanceEffect(t.type, t.amountMinor), 0);
  return toAccountDto(account, balance);
}

export async function deleteAccount(accountId: string, userId: string): Promise<void> {
  const existing = await prisma.walletAccount.findUnique({ where: { id: accountId } });
  if (!existing) throw new HttpError(404, 'Account not found', 'NOT_FOUND');
  await assertMember(userId, existing.circleId);
  await prisma.walletAccount.delete({ where: { id: accountId } });
}

// --- Categories ---
export async function listCategories(circleId: string): Promise<WalletCategoryDto[]> {
  const categories = await prisma.walletCategory.findMany({
    where: { circleId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
  return categories.map(toCategoryDto);
}

export async function createCategory(
  circleId: string,
  input: CreateCategoryInput
): Promise<WalletCategoryDto> {
  try {
    const category = await prisma.walletCategory.create({
      data: {
        circleId,
        name: input.name,
        type: input.type,
        color: input.color ?? '#8fa998',
        icon: input.icon ?? 'payments',
      },
    });
    return toCategoryDto(category);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw new HttpError(409, 'A category with that name already exists', 'CATEGORY_EXISTS');
    }
    throw err;
  }
}

export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  const existing = await prisma.walletCategory.findUnique({ where: { id: categoryId } });
  if (!existing) throw new HttpError(404, 'Category not found', 'NOT_FOUND');
  await assertMember(userId, existing.circleId);
  await prisma.walletCategory.delete({ where: { id: categoryId } });
}

// --- Transactions ---
async function assertAccountInCircle(accountId: string, circleId: string): Promise<void> {
  const account = await prisma.walletAccount.findUnique({ where: { id: accountId } });
  if (account?.circleId !== circleId) {
    throw new HttpError(400, 'Account does not belong to this circle', 'INVALID_ACCOUNT');
  }
}

async function assertCategoryInCircle(categoryId: string, circleId: string): Promise<void> {
  const category = await prisma.walletCategory.findUnique({ where: { id: categoryId } });
  if (category?.circleId !== circleId) {
    throw new HttpError(400, 'Category does not belong to this circle', 'INVALID_CATEGORY');
  }
}

export async function listTransactions(
  circleId: string,
  filters?: { accountId?: string; categoryId?: string; type?: string; search?: string; from?: string; to?: string }
): Promise<WalletTransactionDto[]> {
  const where: Prisma.WalletTransactionWhereInput = { circleId };
  if (filters?.accountId) where.accountId = filters.accountId;
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { note: { contains: filters.search } },
      { payee: { contains: filters.search } },
    ];
  }
  if (filters?.from || filters?.to) {
    where.transactionDate = {};
    if (filters.from) where.transactionDate.gte = new Date(filters.from);
    if (filters.to) where.transactionDate.lte = new Date(filters.to);
  }

  const transactions = await prisma.walletTransaction.findMany({
    where,
    orderBy: { transactionDate: 'desc' },
    take: 200,
  });
  return transactions.map(toTransactionDto);
}

export async function createTransaction(
  circleId: string,
  createdById: string,
  input: CreateTransactionInput
): Promise<WalletTransactionDto> {
  await assertAccountInCircle(input.accountId, circleId);
  if (input.categoryId) await assertCategoryInCircle(input.categoryId, circleId);

  const transaction = await prisma.walletTransaction.create({
    data: {
      circleId,
      createdById,
      accountId: input.accountId,
      type: input.type,
      amountMinor: input.amountMinor,
      currency: input.currency ?? 'USD',
      categoryId: input.categoryId ?? null,
      note: input.note ?? null,
      payee: input.payee ?? null,
      transactionDate: input.transactionDate ? new Date(input.transactionDate) : new Date(),
    },
  });
  return toTransactionDto(transaction);
}

export async function updateTransaction(
  transactionId: string,
  userId: string,
  input: UpdateTransactionInput
): Promise<WalletTransactionDto> {
  const existing = await prisma.walletTransaction.findUnique({ where: { id: transactionId } });
  if (!existing) throw new HttpError(404, 'Transaction not found', 'NOT_FOUND');
  await assertMember(userId, existing.circleId);
  if (input.accountId) await assertAccountInCircle(input.accountId, existing.circleId);
  if (input.categoryId) await assertCategoryInCircle(input.categoryId, existing.circleId);

  const data: Prisma.WalletTransactionUpdateInput = {};
  if (input.accountId !== undefined) data.account = { connect: { id: input.accountId } };
  if (input.type !== undefined) data.type = input.type;
  if (input.amountMinor !== undefined) data.amountMinor = input.amountMinor;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.categoryId !== undefined) {
    data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
  }
  if (input.note !== undefined) data.note = input.note;
  if (input.payee !== undefined) data.payee = input.payee;
  if (input.transactionDate !== undefined) data.transactionDate = new Date(input.transactionDate);

  const transaction = await prisma.walletTransaction.update({ where: { id: transactionId }, data });
  return toTransactionDto(transaction);
}

export async function deleteTransaction(transactionId: string, userId: string): Promise<void> {
  const existing = await prisma.walletTransaction.findUnique({ where: { id: transactionId } });
  if (!existing) throw new HttpError(404, 'Transaction not found', 'NOT_FOUND');
  await assertMember(userId, existing.circleId);
  await prisma.walletTransaction.delete({ where: { id: transactionId } });
}

// --- Budgets ---
function budgetWindow(budget: Budget, now: Date): { start: Date; end: Date } {
  if (budget.period === 'CUSTOM') {
    return { start: budget.startsAt, end: budget.endsAt ?? now };
  }
  if (budget.period === 'WEEKLY') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  // MONTHLY
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

async function computeBudgetSpend(budget: Budget, now: Date): Promise<number> {
  const { start, end } = budgetWindow(budget, now);
  const result = await prisma.walletTransaction.aggregate({
    _sum: { amountMinor: true },
    where: {
      circleId: budget.circleId,
      type: 'EXPENSE',
      categoryId: budget.categoryId ?? undefined,
      transactionDate: { gte: start, lt: end },
    },
  });
  return result._sum.amountMinor ?? 0;
}

async function toBudgetDto(budget: Budget, now: Date): Promise<BudgetDto> {
  const spentMinor = await computeBudgetSpend(budget, now);
  return {
    id: budget.id,
    circleId: budget.circleId,
    name: budget.name,
    categoryId: budget.categoryId,
    amountMinor: budget.amountMinor,
    currency: budget.currency,
    period: budget.period as BudgetPeriod,
    startsAt: budget.startsAt.toISOString(),
    endsAt: budget.endsAt ? budget.endsAt.toISOString() : null,
    spentMinor,
    remainingMinor: budget.amountMinor - spentMinor,
    createdById: budget.createdById,
    archived: budget.archivedAt !== null,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

export async function listBudgets(circleId: string): Promise<BudgetDto[]> {
  const budgets = await prisma.budget.findMany({
    where: { circleId },
    orderBy: [{ archivedAt: 'asc' }, { createdAt: 'desc' }],
  });
  const now = new Date();
  return Promise.all(budgets.map((b) => toBudgetDto(b, now)));
}

export async function createBudget(
  circleId: string,
  createdById: string,
  input: CreateBudgetInput
): Promise<BudgetDto> {
  if (input.categoryId) await assertCategoryInCircle(input.categoryId, circleId);
  const budget = await prisma.budget.create({
    data: {
      circleId,
      createdById,
      name: input.name,
      categoryId: input.categoryId ?? null,
      amountMinor: input.amountMinor,
      currency: input.currency ?? 'USD',
      period: input.period ?? 'MONTHLY',
      startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
    },
  });
  return toBudgetDto(budget, new Date());
}

export async function updateBudget(
  budgetId: string,
  userId: string,
  input: UpdateBudgetInput
): Promise<BudgetDto> {
  const existing = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!existing) throw new HttpError(404, 'Budget not found', 'NOT_FOUND');
  await assertMember(userId, existing.circleId);
  if (input.categoryId) await assertCategoryInCircle(input.categoryId, existing.circleId);

  const budget = await prisma.budget.update({
    where: { id: budgetId },
    data: buildBudgetUpdateData(input),
  });
  return toBudgetDto(budget, new Date());
}

function buildBudgetUpdateData(input: UpdateBudgetInput): Prisma.BudgetUpdateInput {
  const data: Prisma.BudgetUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.categoryId !== undefined) {
    data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
  }
  if (input.amountMinor !== undefined) data.amountMinor = input.amountMinor;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.period !== undefined) data.period = input.period;
  if (input.startsAt !== undefined) data.startsAt = new Date(input.startsAt);
  if (input.endsAt !== undefined) data.endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (input.archived !== undefined) data.archivedAt = input.archived ? new Date() : null;
  return data;
}

export async function deleteBudget(budgetId: string, userId: string): Promise<void> {
  const existing = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!existing) throw new HttpError(404, 'Budget not found', 'NOT_FOUND');
  await assertMember(userId, existing.circleId);
  await prisma.budget.delete({ where: { id: budgetId } });
}

// --- Debts ---
/** Only the lender, borrower, or creator may see or act on a debt. */
function isInvolved(debt: Debt, userId: string): boolean {
  return debt.lenderId === userId || debt.borrowerId === userId || debt.createdById === userId;
}

function debtStatusFromPayments(amountMinor: number, paidMinor: number, current: string): DebtStatus {
  if (current === 'CANCELLED') return 'CANCELLED';
  if (paidMinor <= 0) return 'OPEN';
  if (paidMinor >= amountMinor) return 'PAID';
  return 'PARTIALLY_PAID';
}

export async function listDebts(circleId: string, userId: string): Promise<DebtDto[]> {
  const debts = await prisma.debt.findMany({
    where: {
      circleId,
      OR: [{ lenderId: userId }, { borrowerId: userId }, { createdById: userId }],
    },
    orderBy: { createdAt: 'desc' },
    include: { payments: true },
  });
  return debts.map(toDebtDto);
}

export async function createDebt(
  circleId: string,
  createdById: string,
  input: CreateDebtInput
): Promise<DebtDto> {
  if (input.lenderId === input.borrowerId) {
    throw new HttpError(400, 'Lender and borrower must be different people', 'INVALID_DEBT');
  }
  await assertMember(input.lenderId, circleId);
  await assertMember(input.borrowerId, circleId);

  const debt = await prisma.debt.create({
    data: {
      circleId,
      createdById,
      lenderId: input.lenderId,
      borrowerId: input.borrowerId,
      amountMinor: input.amountMinor,
      currency: input.currency ?? 'USD',
      reason: input.reason ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
    include: { payments: true },
  });
  return toDebtDto(debt);
}

export async function updateDebt(
  debtId: string,
  userId: string,
  input: UpdateDebtInput
): Promise<DebtDto> {
  const existing = await prisma.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
  if (!existing) throw new HttpError(404, 'Debt not found', 'NOT_FOUND');
  if (!isInvolved(existing, userId)) {
    throw new HttpError(403, 'You cannot modify this debt', 'NOT_INVOLVED');
  }

  const data: Prisma.DebtUpdateInput = {};
  if (input.reason !== undefined) data.reason = input.reason;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.status !== undefined) {
    data.status = input.status;
    data.paidAt = input.status === 'PAID' ? new Date() : null;
  }

  const debt = await prisma.debt.update({
    where: { id: debtId },
    data,
    include: { payments: true },
  });
  return toDebtDto(debt);
}

export async function recordPayment(
  debtId: string,
  userId: string,
  input: RecordPaymentInput
): Promise<DebtDto> {
  const existing = await prisma.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
  if (!existing) throw new HttpError(404, 'Debt not found', 'NOT_FOUND');
  if (!isInvolved(existing, userId)) {
    throw new HttpError(403, 'You cannot modify this debt', 'NOT_INVOLVED');
  }
  if (existing.status === 'CANCELLED') {
    throw new HttpError(400, 'This debt has been cancelled', 'DEBT_CANCELLED');
  }

  const alreadyPaid = existing.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const remaining = existing.amountMinor - alreadyPaid;
  if (input.amountMinor > remaining) {
    throw new HttpError(400, 'Payment exceeds the remaining balance', 'PAYMENT_TOO_LARGE');
  }
  if (input.accountId) await assertAccountInCircle(input.accountId, existing.circleId);

  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();

  await prisma.$transaction(async (tx) => {
    let walletTransactionId: string | null = null;
    if (input.accountId) {
      const txn = await tx.walletTransaction.create({
        data: {
          circleId: existing.circleId,
          createdById: userId,
          accountId: input.accountId,
          type: 'DEBT_PAYMENT',
          amountMinor: input.amountMinor,
          currency: existing.currency,
          note: existing.reason ? `Debt payment: ${existing.reason}` : 'Debt payment',
          transactionDate: paidAt,
          debtId: existing.id,
        },
      });
      walletTransactionId = txn.id;
    }

    await tx.debtPayment.create({
      data: {
        debtId: existing.id,
        amountMinor: input.amountMinor,
        currency: existing.currency,
        paidById: existing.borrowerId,
        paidToId: existing.lenderId,
        paidAt,
        walletTransactionId,
      },
    });

    const newPaid = alreadyPaid + input.amountMinor;
    const status = debtStatusFromPayments(existing.amountMinor, newPaid, existing.status);
    await tx.debt.update({
      where: { id: existing.id },
      data: { status, paidAt: status === 'PAID' ? paidAt : null },
    });
  });

  const debt = await prisma.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
  if (!debt) throw new HttpError(404, 'Debt not found', 'NOT_FOUND');
  return toDebtDto(debt);
}

// --- Dashboard ---
export async function getDashboard(
  circleId: string,
  userId: string
): Promise<WalletDashboardDto> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [income, expense, accounts, debts] = await Promise.all([
    prisma.walletTransaction.aggregate({
      _sum: { amountMinor: true },
      where: { circleId, type: 'INCOME', transactionDate: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amountMinor: true },
      where: { circleId, type: 'EXPENSE', transactionDate: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.walletAccount.findMany({
      where: { circleId, archivedAt: null },
      include: { transactions: { select: { type: true, amountMinor: true } } },
    }),
    prisma.debt.findMany({
      where: {
        circleId,
        status: { not: 'CANCELLED' },
        OR: [{ lenderId: userId }, { borrowerId: userId }, { createdById: userId }],
      },
      include: { payments: { select: { amountMinor: true } } },
    }),
  ]);

  const incomeMinor = income._sum.amountMinor ?? 0;
  const expenseMinor = expense._sum.amountMinor ?? 0;
  const accountsBalanceMinor = accounts.reduce(
    (sum, a) => sum + a.transactions.reduce((s, t) => s + balanceEffect(t.type, t.amountMinor), 0),
    0
  );

  let owedToMeMinor = 0;
  let owedByMeMinor = 0;
  let openDebtCount = 0;
  let overdueDebtCount = 0;
  for (const debt of debts) {
    const paid = debt.payments.reduce((s, p) => s + p.amountMinor, 0);
    const remaining = Math.max(debt.amountMinor - paid, 0);
    if (remaining <= 0) continue;
    openDebtCount += 1;
    if (debt.dueDate && debt.dueDate.getTime() < now.getTime()) overdueDebtCount += 1;
    if (debt.lenderId === userId) owedToMeMinor += remaining;
    if (debt.borrowerId === userId) owedByMeMinor += remaining;
  }

  return {
    currency: accounts[0]?.currency ?? 'USD',
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
    accountsBalanceMinor,
    owedToMeMinor,
    owedByMeMinor,
    openDebtCount,
    overdueDebtCount,
  };
}
