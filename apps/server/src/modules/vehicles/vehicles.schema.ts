import { z } from 'zod';

export const createVehicleSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
  name: z.string().min(1, 'Vehicle name is required').max(255),
  model: z.string().max(255).optional(),
  plateNumber: z.string().max(50).optional(),
  registrationExpiry: z.coerce.date().optional(),
  insuranceExpiry: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().omit({
  circleId: true,
});

export const listVehiclesSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type ListVehiclesInput = z.infer<typeof listVehiclesSchema>;
