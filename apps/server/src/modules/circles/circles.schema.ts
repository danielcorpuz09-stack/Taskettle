import { z } from 'zod';

export const createCircleSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(60),
  icon: z.string().trim().max(40).optional(),
});

export const updateCircleSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(60).optional(),
  icon: z.string().trim().max(40).optional(),
});

export const circleIdParam = z.object({
  circleId: z.string().min(1),
});

export const memberParam = z.object({
  circleId: z.string().min(1),
  userId: z.string().min(1),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
