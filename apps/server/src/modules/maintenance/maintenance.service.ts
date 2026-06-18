import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import {
  CreateScheduleInput,
  UpdateScheduleInput,
  ListSchedulesInput,
} from './maintenance.schema';

export class MaintenanceService {
  static async createSchedule(data: CreateScheduleInput, userId: string) {
    // Verify circle membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    // If assigneeId provided, verify they're also a member
    if (data.assigneeId) {
      const assigneeMembership = await prisma.membership.findFirst({
        where: { circleId: data.circleId, userId: data.assigneeId },
      });
      if (!assigneeMembership) {
        throw new HttpError(403, 'Assignee is not a member of this circle', 'FORBIDDEN');
      }
    }

    // Create maintenance schedule
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        circleId: data.circleId,
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
        assigneeId: data.assigneeId,
        notes: data.notes,
        createdById: userId,
      },
    });

    // Auto-create the first task
    await this.createTaskFromSchedule(schedule, userId);

    return schedule;
  }

  static async createTaskFromSchedule(
    schedule: {
      id: string;
      circleId: string;
      title: string;
      description: string | null;
      nextDueDate: Date;
      assigneeId: string | null;
    },
    userId: string
  ) {
    // Create a task on the board for this maintenance
    const task = await prisma.task.create({
      data: {
        circleId: schedule.circleId,
        title: schedule.title,
        description: schedule.description || undefined,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: schedule.nextDueDate,
        assigneeId: schedule.assigneeId,
        createdById: userId,
      },
    });

    // Update schedule with lastTaskId
    await prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: { lastTaskId: task.id },
    });

    return task;
  }

  static async getSchedule(scheduleId: string, userId: string) {
    const schedule = await prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new HttpError(404, 'Maintenance schedule not found', 'NOT_FOUND');
    }

    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: schedule.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return schedule;
  }

  static async listSchedules(data: ListSchedulesInput, userId: string) {
    // Verify membership
    const membership = await prisma.membership.findFirst({
      where: { circleId: data.circleId, userId },
    });
    if (!membership) {
      throw new HttpError(403, 'Not a member of this circle', 'FORBIDDEN');
    }

    return await prisma.maintenanceSchedule.findMany({
      where: { circleId: data.circleId },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  static async updateSchedule(
    scheduleId: string,
    data: UpdateScheduleInput,
    userId: string
  ) {
    const schedule = await this.getSchedule(scheduleId, userId);

    // If assigneeId changed, verify new assignee is a member
    if (data.assigneeId !== undefined && data.assigneeId !== schedule.assigneeId) {
      if (data.assigneeId) {
        const assigneeMembership = await prisma.membership.findFirst({
          where: { circleId: schedule.circleId, userId: data.assigneeId },
        });
        if (!assigneeMembership) {
          throw new HttpError(403, 'Assignee is not a member of this circle', 'FORBIDDEN');
        }
      }
    }

    return await prisma.maintenanceSchedule.update({
      where: { id: scheduleId },
      data,
    });
  }

  static async deleteSchedule(scheduleId: string, userId: string) {
    const schedule = await this.getSchedule(scheduleId, userId);

    // Delete the last created task (optional; could also cascade)
    if (schedule.lastTaskId) {
      await prisma.task.delete({
        where: { id: schedule.lastTaskId },
      }).catch(() => {
        // Task may already be deleted
      });
    }

    return await prisma.maintenanceSchedule.delete({
      where: { id: scheduleId },
    });
  }
}
