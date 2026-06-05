import type { Request, Response } from 'express';
import * as service from './notifications.service';

export async function list(req: Request, res: Response): Promise<void> {
  const result = await service.listNotifications(req.user!.id);
  res.status(200).json(result);
}

export async function read(req: Request, res: Response): Promise<void> {
  const notification = await service.markRead(req.user!.id, req.params.id);
  res.status(200).json({ notification });
}

export async function readAll(req: Request, res: Response): Promise<void> {
  const updated = await service.markAllRead(req.user!.id);
  res.status(200).json({ updated });
}
