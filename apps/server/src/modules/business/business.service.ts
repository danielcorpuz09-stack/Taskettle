import type { Business, Product, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { assertMember } from '../circles/circles.service';
import { createTransaction, type WalletTransactionDto } from '../wallet/wallet.service';
import type { BusinessType } from '../../types/domain';
import type {
  CalculateInput,
  CreateBusinessInput,
  CreateProductInput,
  RecordExpenseInput,
  RecordSaleInput,
  UpdateBusinessInput,
  UpdateProductInput,
} from './business.schema';

// --- DTOs ---
export interface BusinessDto {
  id: string;
  circleId: string;
  name: string;
  type: BusinessType;
  currency: string;
  defaultAccountId: string | null;
  printerPowerW: number | null;
  printerPriceMinor: number | null;
  printerLifespanHr: number | null;
  electricityRatePerKwhMinor: number | null;
  laborRatePerHrMinor: number | null;
  failurePct: number | null;
  markupPct: number | null;
  archived: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostBreakdownDto {
  materialCostMinor: number;
  electricityCostMinor: number;
  wearCostMinor: number;
  laborCostMinor: number;
  subtotalMinor: number;
  failureCostMinor: number;
  profitMinor: number;
  finalPriceMinor: number;
  failurePct: number;
  markupPct: number;
}

export interface ProductDto {
  id: string;
  businessId: string;
  name: string;
  notes: string | null;
  currency: string;
  inputs: CalculateInput;
  breakdown: CostBreakdownDto;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessDashboardDto {
  currency: string;
  revenueMonthMinor: number;
  expenseMonthMinor: number;
  profitMonthMinor: number;
  revenueTotalMinor: number;
  expenseTotalMinor: number;
  profitTotalMinor: number;
  productCount: number;
  saleCount: number;
}

// --- Mappers ---
function toBusinessDto(b: Business): BusinessDto {
  return {
    id: b.id,
    circleId: b.circleId,
    name: b.name,
    type: b.type as BusinessType,
    currency: b.currency,
    defaultAccountId: b.defaultAccountId,
    printerPowerW: b.printerPowerW,
    printerPriceMinor: b.printerPriceMinor,
    printerLifespanHr: b.printerLifespanHr,
    electricityRatePerKwhMinor: b.electricityRatePerKwhMinor,
    laborRatePerHrMinor: b.laborRatePerHrMinor,
    failurePct: b.failurePct,
    markupPct: b.markupPct,
    archived: b.archivedAt !== null,
    createdById: b.createdById,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

function toProductDto(p: Product): ProductDto {
  const inputs = JSON.parse(p.inputs) as CalculateInput;
  return {
    id: p.id,
    businessId: p.businessId,
    name: p.name,
    notes: p.notes,
    currency: p.currency,
    inputs,
    breakdown: {
      materialCostMinor: p.materialCostMinor,
      electricityCostMinor: p.electricityCostMinor,
      wearCostMinor: p.wearCostMinor,
      laborCostMinor: p.laborCostMinor,
      subtotalMinor: p.subtotalMinor,
      failureCostMinor: Math.round((p.subtotalMinor * p.failurePct) / 100),
      profitMinor: p.finalPriceMinor - p.subtotalMinor - Math.round((p.subtotalMinor * p.failurePct) / 100),
      finalPriceMinor: p.finalPriceMinor,
      failurePct: p.failurePct,
      markupPct: p.markupPct,
    },
    createdById: p.createdById,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// --- Calculator (PesoPrint-style) ---
export function computeQuote(input: CalculateInput): CostBreakdownDto {
  const materialCostMinor = Math.round(
    input.filaments.reduce((sum, f) => sum + (f.weightG / 1000) * f.costPerKgMinor, 0)
  );
  const electricityCostMinor = Math.round(
    (input.printerPowerW / 1000) * input.printTimeHr * input.electricityRatePerKwhMinor
  );
  const wearCostMinor = Math.round(
    (input.printerPriceMinor / input.printerLifespanHr) * input.printTimeHr
  );
  const laborCostMinor = Math.round(input.laborRatePerHrMinor * input.laborTimeHr);

  const subtotalMinor = materialCostMinor + electricityCostMinor + wearCostMinor + laborCostMinor;
  const failureCostMinor = Math.round((subtotalMinor * input.failurePct) / 100);
  const profitMinor = Math.round(((subtotalMinor + failureCostMinor) * input.markupPct) / 100);
  const finalPriceMinor = subtotalMinor + failureCostMinor + profitMinor;

  return {
    materialCostMinor,
    electricityCostMinor,
    wearCostMinor,
    laborCostMinor,
    subtotalMinor,
    failureCostMinor,
    profitMinor,
    finalPriceMinor,
    failurePct: input.failurePct,
    markupPct: input.markupPct,
  };
}

// --- Guards ---
async function assertBusiness(businessId: string, userId: string): Promise<Business> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new HttpError(404, 'Business not found', 'NOT_FOUND');
  await assertMember(userId, business.circleId);
  return business;
}

async function assertAccountInCircle(accountId: string, circleId: string): Promise<void> {
  const account = await prisma.walletAccount.findUnique({ where: { id: accountId } });
  if (account?.circleId !== circleId) {
    throw new HttpError(400, 'Account does not belong to this circle', 'INVALID_ACCOUNT');
  }
}

// --- Business CRUD ---
export async function listBusinesses(circleId: string): Promise<BusinessDto[]> {
  const businesses = await prisma.business.findMany({
    where: { circleId },
    orderBy: [{ archivedAt: 'asc' }, { createdAt: 'desc' }],
  });
  return businesses.map(toBusinessDto);
}

export async function getBusiness(businessId: string, userId: string): Promise<BusinessDto> {
  const business = await assertBusiness(businessId, userId);
  return toBusinessDto(business);
}

export async function createBusiness(
  circleId: string,
  createdById: string,
  input: CreateBusinessInput
): Promise<BusinessDto> {
  if (input.defaultAccountId) await assertAccountInCircle(input.defaultAccountId, circleId);

  const business = await prisma.business.create({
    data: {
      circleId,
      createdById,
      name: input.name,
      type: input.type ?? 'PRINTING_3D',
      currency: input.currency ?? 'PHP',
      defaultAccountId: input.defaultAccountId ?? null,
      printerPowerW: input.printerPowerW ?? null,
      printerPriceMinor: input.printerPriceMinor ?? null,
      printerLifespanHr: input.printerLifespanHr ?? null,
      electricityRatePerKwhMinor: input.electricityRatePerKwhMinor ?? null,
      laborRatePerHrMinor: input.laborRatePerHrMinor ?? null,
      failurePct: input.failurePct ?? null,
      markupPct: input.markupPct ?? null,
    },
  });
  return toBusinessDto(business);
}

export async function updateBusiness(
  businessId: string,
  userId: string,
  input: UpdateBusinessInput
): Promise<BusinessDto> {
  const existing = await assertBusiness(businessId, userId);
  if (input.defaultAccountId) await assertAccountInCircle(input.defaultAccountId, existing.circleId);

  const data: Prisma.BusinessUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.type !== undefined) data.type = input.type;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.defaultAccountId !== undefined) {
    data.defaultAccount = input.defaultAccountId
      ? { connect: { id: input.defaultAccountId } }
      : { disconnect: true };
  }
  if (input.printerPowerW !== undefined) data.printerPowerW = input.printerPowerW;
  if (input.printerPriceMinor !== undefined) data.printerPriceMinor = input.printerPriceMinor;
  if (input.printerLifespanHr !== undefined) data.printerLifespanHr = input.printerLifespanHr;
  if (input.electricityRatePerKwhMinor !== undefined)
    data.electricityRatePerKwhMinor = input.electricityRatePerKwhMinor;
  if (input.laborRatePerHrMinor !== undefined) data.laborRatePerHrMinor = input.laborRatePerHrMinor;
  if (input.failurePct !== undefined) data.failurePct = input.failurePct;
  if (input.markupPct !== undefined) data.markupPct = input.markupPct;
  if (input.archived !== undefined) data.archivedAt = input.archived ? new Date() : null;

  const business = await prisma.business.update({ where: { id: businessId }, data });
  return toBusinessDto(business);
}

export async function deleteBusiness(businessId: string, userId: string): Promise<void> {
  await assertBusiness(businessId, userId);
  await prisma.business.delete({ where: { id: businessId } });
}

// --- Money flows (recorded as wallet transactions tagged to the business) ---
function resolveAccountId(business: Business, accountId?: string | null): string {
  const resolved = accountId ?? business.defaultAccountId;
  if (!resolved) {
    throw new HttpError(
      400,
      'No account specified and the business has no default account',
      'NO_ACCOUNT'
    );
  }
  return resolved;
}

export async function recordSale(
  businessId: string,
  userId: string,
  input: RecordSaleInput
): Promise<WalletTransactionDto> {
  const business = await assertBusiness(businessId, userId);
  const accountId = resolveAccountId(business, input.accountId);
  return createTransaction(business.circleId, userId, {
    accountId,
    type: 'INCOME',
    amountMinor: input.amountMinor,
    currency: business.currency,
    categoryId: input.categoryId ?? null,
    note: input.note ?? null,
    payee: input.payee ?? null,
    transactionDate: input.transactionDate,
    businessId: business.id,
    productId: input.productId ?? null,
  });
}

export async function recordExpense(
  businessId: string,
  userId: string,
  input: RecordExpenseInput
): Promise<WalletTransactionDto> {
  const business = await assertBusiness(businessId, userId);
  const accountId = resolveAccountId(business, input.accountId);
  return createTransaction(business.circleId, userId, {
    accountId,
    type: 'EXPENSE',
    amountMinor: input.amountMinor,
    currency: business.currency,
    categoryId: input.categoryId ?? null,
    note: input.note ?? null,
    payee: input.payee ?? null,
    transactionDate: input.transactionDate,
    businessId: business.id,
  });
}

export async function listTransactions(
  businessId: string,
  userId: string
): Promise<WalletTransactionDto[]> {
  const business = await assertBusiness(businessId, userId);
  const transactions = await prisma.walletTransaction.findMany({
    where: { businessId: business.id },
    orderBy: { transactionDate: 'desc' },
    take: 200,
  });
  return transactions.map((t) => ({
    id: t.id,
    circleId: t.circleId,
    accountId: t.accountId,
    type: t.type as WalletTransactionDto['type'],
    amountMinor: t.amountMinor,
    currency: t.currency,
    categoryId: t.categoryId,
    note: t.note,
    payee: t.payee,
    transactionDate: t.transactionDate.toISOString(),
    createdById: t.createdById,
    debtId: t.debtId,
    businessId: t.businessId,
    productId: t.productId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function getDashboard(
  businessId: string,
  userId: string
): Promise<BusinessDashboardDto> {
  const business = await assertBusiness(businessId, userId);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revMonth, expMonth, revTotal, expTotal, productCount, saleCount] = await Promise.all([
    prisma.walletTransaction.aggregate({
      _sum: { amountMinor: true },
      where: { businessId: business.id, type: 'INCOME', transactionDate: { gte: monthStart } },
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amountMinor: true },
      where: { businessId: business.id, type: 'EXPENSE', transactionDate: { gte: monthStart } },
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amountMinor: true },
      where: { businessId: business.id, type: 'INCOME' },
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amountMinor: true },
      where: { businessId: business.id, type: 'EXPENSE' },
    }),
    prisma.product.count({ where: { businessId: business.id } }),
    prisma.walletTransaction.count({ where: { businessId: business.id, type: 'INCOME' } }),
  ]);

  const revenueMonthMinor = revMonth._sum.amountMinor ?? 0;
  const expenseMonthMinor = expMonth._sum.amountMinor ?? 0;
  const revenueTotalMinor = revTotal._sum.amountMinor ?? 0;
  const expenseTotalMinor = expTotal._sum.amountMinor ?? 0;

  return {
    currency: business.currency,
    revenueMonthMinor,
    expenseMonthMinor,
    profitMonthMinor: revenueMonthMinor - expenseMonthMinor,
    revenueTotalMinor,
    expenseTotalMinor,
    profitTotalMinor: revenueTotalMinor - expenseTotalMinor,
    productCount,
    saleCount,
  };
}

// --- Products ---
export async function listProducts(businessId: string, userId: string): Promise<ProductDto[]> {
  const business = await assertBusiness(businessId, userId);
  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  return products.map(toProductDto);
}

export async function createProduct(
  businessId: string,
  userId: string,
  input: CreateProductInput
): Promise<ProductDto> {
  const business = await assertBusiness(businessId, userId);
  const breakdown = computeQuote(input.calculation);

  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      createdById: userId,
      name: input.name,
      notes: input.notes ?? null,
      currency: input.currency ?? business.currency,
      inputs: JSON.stringify(input.calculation),
      materialCostMinor: breakdown.materialCostMinor,
      electricityCostMinor: breakdown.electricityCostMinor,
      wearCostMinor: breakdown.wearCostMinor,
      laborCostMinor: breakdown.laborCostMinor,
      subtotalMinor: breakdown.subtotalMinor,
      failurePct: breakdown.failurePct,
      markupPct: breakdown.markupPct,
      finalPriceMinor: breakdown.finalPriceMinor,
    },
  });
  return toProductDto(product);
}

export async function updateProduct(
  businessId: string,
  productId: string,
  userId: string,
  input: UpdateProductInput
): Promise<ProductDto> {
  await assertBusiness(businessId, userId);
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing || existing.businessId !== businessId) {
    throw new HttpError(404, 'Product not found', 'NOT_FOUND');
  }

  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.calculation !== undefined) {
    const breakdown = computeQuote(input.calculation);
    data.inputs = JSON.stringify(input.calculation);
    data.materialCostMinor = breakdown.materialCostMinor;
    data.electricityCostMinor = breakdown.electricityCostMinor;
    data.wearCostMinor = breakdown.wearCostMinor;
    data.laborCostMinor = breakdown.laborCostMinor;
    data.subtotalMinor = breakdown.subtotalMinor;
    data.failurePct = breakdown.failurePct;
    data.markupPct = breakdown.markupPct;
    data.finalPriceMinor = breakdown.finalPriceMinor;
  }

  const product = await prisma.product.update({ where: { id: productId }, data });
  return toProductDto(product);
}

export async function deleteProduct(
  businessId: string,
  productId: string,
  userId: string
): Promise<void> {
  await assertBusiness(businessId, userId);
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing || existing.businessId !== businessId) {
    throw new HttpError(404, 'Product not found', 'NOT_FOUND');
  }
  await prisma.product.delete({ where: { id: productId } });
}
