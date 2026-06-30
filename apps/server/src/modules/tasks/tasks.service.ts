import type { Prisma, Task } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { assertMember } from '../circles/circles.service';
import type { TaskStatus, TaskPriority, TaskRecurrence } from '../../types/domain';
import type { CreateTaskInput, UpdateTaskInput } from './tasks.schema';

const POSITION_STEP = 1024;

type TaskWithAssignee = Prisma.TaskGetPayload<{
  include: {
    assignee: { select: { id: true; name: true; avatarColor: true } };
  };
}>;

const withAssignee = {
  assignee: { select: { id: true, name: true, avatarColor: true } },
} satisfies Prisma.TaskInclude;

export interface TaskDto {
  id: string;
  circleId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  assignee: { userId: string; name: string; avatarColor: string } | null;
  dueDate: string | null;
  endAt: string | null;
  allDay: boolean;
  recurrence: TaskRecurrence | null;
  recurrenceUntil: string | null;
  position: number;
  createdById: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listTasks(circleId: string): Promise<TaskDto[]> {
  const tasks = await prisma.task.findMany({
    where: { circleId },
    include: withAssignee,
    orderBy: [{ status: 'asc' }, { position: 'asc' }],
  });
  return tasks.map(toTaskDto);
}

export async function createTask(
  circleId: string,
  createdById: string,
  input: CreateTaskInput
): Promise<TaskDto> {
  if (input.assigneeId) await assertMember(input.assigneeId, circleId);

  const status = input.status ?? 'TODO';
  const position = await nextPosition(circleId, status);

  const task = await prisma.task.create({
    data: {
      circleId,
      createdById,
      title: input.title,
      description: input.description ?? null,
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      endAt: input.endAt ? new Date(input.endAt) : null,
      allDay: input.allDay ?? true,
      recurrence: input.recurrence ?? null,
      recurrenceUntil: input.recurrenceUntil ? new Date(input.recurrenceUntil) : null,
      status,
      priority: input.priority ?? 'MEDIUM',
      category: input.category ?? null,
      position,
      completedAt: status === 'DONE' ? new Date() : null,
    },
    include: withAssignee,
  });

  return toTaskDto(task);
}

export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput
): Promise<TaskDto> {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) throw new HttpError(404, 'Task not found', 'NOT_FOUND');

  // Authorization: caller must be a member of the task's circle.
  await assertCircleMember(userId, existing.circleId);

  if (input.assigneeId) await assertMember(input.assigneeId, existing.circleId);

  const data: Prisma.TaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.position !== undefined) data.position = input.position;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.category !== undefined) data.category = input.category;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.endAt !== undefined) data.endAt = input.endAt ? new Date(input.endAt) : null;
  if (input.allDay !== undefined) data.allDay = input.allDay;
  if (input.recurrence !== undefined) data.recurrence = input.recurrence ?? null;
  if (input.recurrenceUntil !== undefined)
    data.recurrenceUntil = input.recurrenceUntil ? new Date(input.recurrenceUntil) : null;
  if (input.assigneeId !== undefined) {
    data.assignee = input.assigneeId
      ? { connect: { id: input.assigneeId } }
      : { disconnect: true };
  }
  if (input.status !== undefined) {
    data.status = input.status;
    data.completedAt = input.status === 'DONE' ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
    include: withAssignee,
  });
  return toTaskDto(task);
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) throw new HttpError(404, 'Task not found', 'NOT_FOUND');
  await assertCircleMember(userId, existing.circleId);
  await prisma.task.delete({ where: { id: taskId } });
}

async function nextPosition(circleId: string, status: TaskStatus): Promise<number> {
  const last = await prisma.task.findFirst({
    where: { circleId, status },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (last?.position ?? 0) + POSITION_STEP;
}

async function assertCircleMember(userId: string, circleId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: { userId_circleId: { userId, circleId } },
    select: { id: true },
  });
  if (!membership) throw new HttpError(403, 'You are not a member of this circle', 'NOT_A_MEMBER');
}

export function toTaskDto(task: TaskWithAssignee | Task): TaskDto {
  const assignee = 'assignee' in task ? task.assignee : null;
  return {
    id: task.id,
    circleId: task.circleId,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    category: task.category,
    assignee: assignee
      ? { userId: assignee.id, name: assignee.name, avatarColor: assignee.avatarColor }
      : null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    endAt: task.endAt ? task.endAt.toISOString() : null,
    allDay: task.allDay,
    recurrence: (task.recurrence as TaskRecurrence | null) ?? null,
    recurrenceUntil: task.recurrenceUntil ? task.recurrenceUntil.toISOString() : null,
    position: task.position,
    createdById: task.createdById,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
