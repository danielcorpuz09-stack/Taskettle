import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80),
  email: z.string().trim().toLowerCase().email('must be a valid email'),
  password: z.string().min(8, 'must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('must be a valid email'),
  password: z.string().min(1, 'is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(80).optional(),
  email: z.string().trim().toLowerCase().email('must be a valid email').optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex color').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
