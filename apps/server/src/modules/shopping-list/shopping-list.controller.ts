import type { Request, Response } from 'express';
import * as shoppingListService from './shopping-list.service';

export async function list(req: Request, res: Response): Promise<void> {
  const { status } = req.query as Record<string, string | undefined>;
  const items = await shoppingListService.listItems(req.params.circleId, { status });
  res.status(200).json({ items });
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await shoppingListService.createItem(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await shoppingListService.updateItem(req.params.itemId, req.user!.id, req.body);
  res.status(200).json({ item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await shoppingListService.deleteItem(req.params.itemId, req.user!.id);
  res.status(204).send();
}
