import { z } from 'zod';

const shoppingStatus = z.enum(['PENDING', 'PURCHASED']);

export const createShoppingItemSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(140),
  quantityNeeded: z.number().finite().min(0).optional(),
  unit: z.string().trim().max(30).nullable().optional(),
  inventoryItemId: z.string().min(1).nullable().optional(),
});

export const updateShoppingItemSchema = z
  .object({
    name: z.string().trim().min(1).max(140).optional(),
    quantityNeeded: z.number().finite().min(0).optional(),
    unit: z.string().trim().max(30).nullable().optional(),
    status: shoppingStatus.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });

export const shoppingItemIdParam = z.object({ itemId: z.string().min(1) });

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;
export type UpdateShoppingItemInput = z.infer<typeof updateShoppingItemSchema>;
