import { z } from 'zod';

const currency = z.string().trim().length(3, 'must be a 3-letter ISO code').toUpperCase();
const amountMinor = z.number().int('must be whole minor units').positive();
const isoDate = z.string().datetime({ message: 'must be an ISO date' });
const businessType = z.enum(['PRINTING_3D', 'GENERAL']);
const pct = z.number().min(0).max(100);

// --- Business ---
export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  type: businessType.optional(),
  currency: currency.optional(),
  defaultAccountId: z.string().min(1).nullable().optional(),
  printerPowerW: z.number().int().min(0).nullable().optional(),
  printerPriceMinor: z.number().int().min(0).nullable().optional(),
  printerLifespanHr: z.number().int().min(1).nullable().optional(),
  electricityRatePerKwhMinor: z.number().int().min(0).nullable().optional(),
  laborRatePerHrMinor: z.number().int().min(0).nullable().optional(),
  failurePct: pct.nullable().optional(),
  markupPct: pct.nullable().optional(),
});

export const updateBusinessSchema = createBusinessSchema
  .partial()
  .extend({ archived: z.boolean().optional() })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const businessIdParam = z.object({ businessId: z.string().min(1) });

// --- Money flows recorded as wallet transactions ---
export const recordSaleSchema = z.object({
  amountMinor,
  accountId: z.string().min(1).nullable().optional(),
  productId: z.string().min(1).nullable().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  payee: z.string().trim().max(120).nullable().optional(),
  transactionDate: isoDate.optional(),
});

export const recordExpenseSchema = z.object({
  amountMinor,
  accountId: z.string().min(1).nullable().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  payee: z.string().trim().max(120).nullable().optional(),
  transactionDate: isoDate.optional(),
});

// --- Calculator ---
const filamentRow = z.object({
  name: z.string().trim().max(120).optional(),
  weightG: z.number().min(0),
  costPerKgMinor: z.number().int().min(0),
});

export const calculateSchema = z.object({
  filaments: z.array(filamentRow).min(1, 'add at least one filament'),
  printTimeHr: z.number().min(0).default(0),
  // Printer / electricity
  printerPowerW: z.number().min(0).default(0),
  electricityRatePerKwhMinor: z.number().int().min(0).default(0),
  printerPriceMinor: z.number().int().min(0).default(0),
  printerLifespanHr: z.number().min(1).default(1),
  // Labor
  laborRatePerHrMinor: z.number().int().min(0).default(0),
  laborTimeHr: z.number().min(0).default(0),
  // Business
  failurePct: pct.default(0),
  markupPct: pct.default(0),
});

// --- Products (saved calculator outputs) ---
export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(120),
  notes: z.string().trim().max(1000).nullable().optional(),
  currency: currency.optional(),
  calculation: calculateSchema,
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    currency: currency.optional(),
    calculation: calculateSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const productIdParam = z.object({
  businessId: z.string().min(1),
  productId: z.string().min(1),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type RecordSaleInput = z.infer<typeof recordSaleSchema>;
export type RecordExpenseInput = z.infer<typeof recordExpenseSchema>;
export type CalculateInput = z.infer<typeof calculateSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
