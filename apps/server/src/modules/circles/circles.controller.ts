import type { Request, Response } from 'express';
import * as circlesService from './circles.service';

export async function list(req: Request, res: Response): Promise<void> {
  const circles = await circlesService.listCircles(req.user!.id);
  res.status(200).json({ circles });
}

export async function create(req: Request, res: Response): Promise<void> {
  const circle = await circlesService.createCircle(req.user!.id, req.body);
  res.status(201).json({ circle });
}

export async function get(req: Request, res: Response): Promise<void> {
  const circle = await circlesService.getCircle(req.user!.id, req.params.circleId);
  res.status(200).json({ circle });
}

export async function members(req: Request, res: Response): Promise<void> {
  const list = await circlesService.listMembers(req.params.circleId);
  res.status(200).json({ members: list });
}
