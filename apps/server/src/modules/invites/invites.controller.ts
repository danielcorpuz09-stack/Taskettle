import type { Request, Response } from 'express';
import * as invitesService from './invites.service';

export async function create(req: Request, res: Response): Promise<void> {
  const invite = await invitesService.createInvite(
    req.params.circleId,
    req.user!.id,
    req.body.email
  );
  res.status(201).json({ invite });
}

export async function accept(req: Request, res: Response): Promise<void> {
  const circle = await invitesService.acceptInvite(req.params.token, req.user!);
  res.status(200).json({ circle });
}
