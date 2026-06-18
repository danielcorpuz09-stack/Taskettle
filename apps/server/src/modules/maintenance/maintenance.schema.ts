import { z } from 'zod';
import { MaintenanceFrequency } from '../../types/domain';

const FREQUENCIES: readonly MaintenanceFrequency[] = [
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
  'CUSTOM',
];

export const createScheduleSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
  title: z.string().min(1, 'Maintenance title is required').max(255),
  description: z.string().max(1000).optional(),
  frequency: z
    .enum(FREQUENCIES as [MaintenanceFrequency, ...MaintenanceFrequency[]])
    .default('MONTHLY'),
  nextDueDate: z.coerce.date(),
  assigneeId: z.string().cuid('Invalid assignee ID').optional(),
  notes: z.string().max(1000).optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial().omit({
  circleId: true,
});

export const listSchedulesSchema = z.object({
  circleId: z.string().cuid('Invalid circle ID'),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ListSchedulesInput = z.infer<typeof listSchedulesSchema>;
