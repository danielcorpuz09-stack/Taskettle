import type { Request, Response } from 'express';
import * as inventoryService from './inventory.service';

export async function list(req: Request, res: Response): Promise<void> {
  const { status, category, search, location, businessId } = req.query as Record<string, string | undefined>;
  const items = await inventoryService.listItems(req.params.circleId, {
    status,
    category,
    search,
    location,
    businessId,
  });
  res.status(200).json({ items });
}

export async function dashboard(req: Request, res: Response): Promise<void> {
  const data = await inventoryService.getDashboard(req.params.circleId);
  res.status(200).json({ dashboard: data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await inventoryService.createItem(req.params.circleId, req.user!.id, req.body);
  res.status(201).json({ item });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await inventoryService.updateItem(req.params.itemId, req.user!.id, req.body);
  res.status(200).json({ item });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await inventoryService.deleteItem(req.params.itemId, req.user!.id);
  res.status(204).send();
}

export async function addToShoppingList(req: Request, res: Response): Promise<void> {
  await inventoryService.addToShoppingList(req.params.itemId, req.user!.id);
  res.status(201).json({ message: 'Added to shopping list' });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const taskId = await inventoryService.createTaskFromItem(
    req.params.itemId,
    req.user!.id,
    req.body.assigneeId
  );
  res.status(201).json({ taskId });
}
