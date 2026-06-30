import { z } from 'zod';

const status = z.enum(['BACKLOG', 'TODO', 'DOING', 'DONE']);
const priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const recurrence = z.enum(['DAILY', 'WEEKLY', 'MONTHLY']);

// Accept ISO date strings or null; transform to Date.
const isoDate = z
  .union([z.string().datetime({ offset: true }), z.string().datetime(), z.null()])
  .optional();

// endAt must not be before dueDate when both are present.
const endAfterStart = (data: { dueDate?: string | null; endAt?: string | null }) =>
  !data.dueDate || !data.endAt || new Date(data.endAt) >= new Date(data.dueDate);

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, 'is required').max(140),
    description: z.string().trim().max(2000).optional(),
    assigneeId: z.string().min(1).nullable().optional(),
    dueDate: isoDate,
    endAt: isoDate,
    allDay: z.boolean().optional(),
    recurrence: recurrence.nullable().optional(),
    recurrenceUntil: isoDate,
    status: status.optional(),
    priority: priority.optional(),
    category: z.string().trim().max(50).nullable().optional(),
  })
  .refine(endAfterStart, { message: 'End time must be after the start', path: ['endAt'] });

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    assigneeId: z.string().min(1).nullable().optional(),
    dueDate: isoDate,
    endAt: isoDate,
    allDay: z.boolean().optional(),
    recurrence: recurrence.nullable().optional(),
    recurrenceUntil: isoDate,
    status: status.optional(),
    priority: priority.optional(),
    category: z.string().trim().max(50).nullable().optional(),
    position: z.number().finite().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })
  .refine(endAfterStart, { message: 'End time must be after the start', path: ['endAt'] });

export const taskIdParam = z.object({ taskId: z.string().min(1) });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
