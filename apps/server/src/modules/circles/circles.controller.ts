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

export async function update(req: Request, res: Response): Promise<void> {
  const circle = await circlesService.updateCircle(req.user!.id, req.params.circleId, req.body);
  res.status(200).json({ circle });
}

export async function archive(req: Request, res: Response): Promise<void> {
  const result = await circlesService.archiveCircle(req.user!.id, req.params.circleId);
  res.status(200).json(result);
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const result = await circlesService.removeMember(req.user!.id, req.params.circleId, req.params.userId);
  res.status(200).json(result);
}

export async function leaveCircle(req: Request, res: Response): Promise<void> {
  const result = await circlesService.leaveCircle(req.user!.id, req.params.circleId);
  res.status(200).json(result);
}
