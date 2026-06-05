import { z } from 'zod';

export const createCircleSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(60),
  icon: z.string().trim().max(40).optional(),
});

export const circleIdParam = z.object({
  circleId: z.string().min(1),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
