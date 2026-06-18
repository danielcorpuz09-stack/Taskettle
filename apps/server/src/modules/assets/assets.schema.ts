import { z } from 'zod';
import { HomeAssetCategory } from '../../types/domain';

const ASSET_CATEGORIES: readonly HomeAssetCategory[] = [
  'APPLIANCE',
  'ELECTRONICS',
  'FURNITURE',
  'POWER_TOOL',
  'OTHER',
];

export const createAssetSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
  name: z.string().min(1, 'Asset name is required').max(255),
  category: z
    .enum(ASSET_CATEGORIES as [HomeAssetCategory, ...HomeAssetCategory[]])
    .default('OTHER'),
  purchaseDate: z.coerce.date().optional(),
  warrantyExpiration: z.coerce.date().optional(),
  serialNumber: z.string().max(255).optional(),
  receiptPhotoUrls: z.array(z.string().url()).optional(),
  currentValue: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateAssetSchema = createAssetSchema.partial().omit({
  circleId: true,
});

export const listAssetsSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
  category: z.enum(ASSET_CATEGORIES as [HomeAssetCategory, ...HomeAssetCategory[]]).optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsInput = z.infer<typeof listAssetsSchema>;
