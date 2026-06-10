import type { Request, Response } from 'express';
import * as tasksService from './tasks.service';

export async function list(req: Request, res: Response): Promise<void> {
  const tasks = await tasksService.listTasks(req.params.circleId);
  res.status(200).json({ tasks });
}

export async function create(req: Request, res: Response): Promise<void> {
  const task = await tasksService.createTask(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ task });
}

export async function update(req: Request, res: Response): Promise<void> {
  const task = await tasksService.updateTask(req.params.taskId, req.user!.id, req.body);
  res.status(200).json({ task });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await tasksService.deleteTask(req.params.taskId, req.user!.id);
  res.status(204).send();
}
