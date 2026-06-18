import { Request, Response } from 'express';
import { MaintenanceService } from './maintenance.service';
import {
  CreateScheduleInput,
  UpdateScheduleInput,
  ListSchedulesInput,
} from './maintenance.schema';

export class MaintenanceController {
  static async createSchedule(req: Request, res: Response) {
    const data = req.body as CreateScheduleInput;
    const schedule = await MaintenanceService.createSchedule(data, req.user!.id);
    res.status(201).json(schedule);
  }

  static async getSchedule(req: Request, res: Response) {
    const { scheduleId } = req.params;
    const schedule = await MaintenanceService.getSchedule(scheduleId, req.user!.id);
    res.json(schedule);
  }

  static async listSchedules(req: Request, res: Response) {
    const data = req.body as ListSchedulesInput;
    const schedules = await MaintenanceService.listSchedules(data, req.user!.id);
    res.json(schedules);
  }

  static async updateSchedule(req: Request, res: Response) {
    const { scheduleId } = req.params;
    const data = req.body as UpdateScheduleInput;
    const schedule = await MaintenanceService.updateSchedule(
      scheduleId,
      data,
      req.user!.id
    );
    res.json(schedule);
  }

  static async deleteSchedule(req: Request, res: Response) {
    const { scheduleId } = req.params;
    await MaintenanceService.deleteSchedule(scheduleId, req.user!.id);
    res.status(204).send();
  }
}
