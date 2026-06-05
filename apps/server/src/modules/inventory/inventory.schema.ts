import { z } from 'zod';

const inventoryStatus = z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']);

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(140),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(50).nullable().optional(),
  quantity: z.number().finite().min(0).optional(),
  unit: z.string().trim().max(30).nullable().optional(),
  minimumThreshold: z.number().finite().min(0).optional(),
  location: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const updateInventoryItemSchema = z
  .object({
    name: z.string().trim().min(1).max(140).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    category: z.string().trim().max(50).nullable().optional(),
    quantity: z.number().finite().min(0).optional(),
    unit: z.string().trim().max(30).nullable().optional(),
    minimumThreshold: z.number().finite().min(0).optional(),
    location: z.string().trim().max(100).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

export const inventoryItemIdParam = z.object({ itemId: z.string().min(1) });

export const inventoryQuerySchema = z.object({
  status: inventoryStatus.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const createTaskFromItemSchema = z.object({
  assigneeId: z.string().min(1).nullable().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
