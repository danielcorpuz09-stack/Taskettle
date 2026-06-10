import type { InventoryItem, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { assertMember } from '../circles/circles.service';
import type { InventoryStatus } from '../../types/domain';
import type { CreateInventoryItemInput, UpdateInventoryItemInput } from './inventory.schema';

export interface InventoryItemDto {
  id: string;
  circleId: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number;
  unit: string | null;
  minimumThreshold: number;
  location: string | null;
  notes: string | null;
  status: InventoryStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryDashboardDto {
  totalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentlyUpdated: InventoryItemDto[];
}

function computeStatus(quantity: number, minimumThreshold: number): InventoryStatus {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= minimumThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function toItemDto(item: InventoryItem): InventoryItemDto {
  return {
    id: item.id,
    circleId: item.circleId,
    name: item.name,
    description: item.description,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    minimumThreshold: item.minimumThreshold,
    location: item.location,
    notes: item.notes,
    status: item.status as InventoryStatus,
    createdById: item.createdById,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function listItems(
  circleId: string,
  filters?: { status?: string; category?: string; search?: string }
): Promise<InventoryItemDto[]> {
  const where: Prisma.InventoryItemWhereInput = { circleId };

  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;
  if (filters?.search) {
    where.name = { contains: filters.search };
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });
  return items.map(toItemDto);
}

export async function getDashboard(circleId: string): Promise<InventoryDashboardDto> {
  const [totalCount, lowStockCount, outOfStockCount, recentlyUpdated] = await Promise.all([
    prisma.inventoryItem.count({ where: { circleId } }),
    prisma.inventoryItem.count({ where: { circleId, status: 'LOW_STOCK' } }),
    prisma.inventoryItem.count({ where: { circleId, status: 'OUT_OF_STOCK' } }),
    prisma.inventoryItem.findMany({
      where: { circleId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    totalCount,
    lowStockCount,
    outOfStockCount,
    recentlyUpdated: recentlyUpdated.map(toItemDto),
  };
}

export async function createItem(
  circleId: string,
  createdById: string,
  input: CreateInventoryItemInput
): Promise<InventoryItemDto> {
  const quantity = input.quantity ?? 0;
  const minimumThreshold = input.minimumThreshold ?? 0;
  const status = computeStatus(quantity, minimumThreshold);

  const item = await prisma.inventoryItem.create({
    data: {
      circleId,
      createdById,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? null,
      quantity,
      unit: input.unit ?? null,
      minimumThreshold,
      location: input.location ?? null,
      notes: input.notes ?? null,
      status,
    },
  });

  return toItemDto(item);
}

export async function updateItem(
  itemId: string,
  userId: string,
  input: UpdateInventoryItemInput
): Promise<InventoryItemDto> {
  const existing = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new HttpError(404, 'Item not found', 'NOT_FOUND');

  await assertMember(userId, existing.circleId);

  const quantity = input.quantity ?? existing.quantity;
  const minimumThreshold = input.minimumThreshold ?? existing.minimumThreshold;
  const status = computeStatus(quantity, minimumThreshold);

  const data: Prisma.InventoryItemUpdateInput = { status };
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.category !== undefined) data.category = input.category;
  if (input.quantity !== undefined) data.quantity = input.quantity;
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.minimumThreshold !== undefined) data.minimumThreshold = input.minimumThreshold;
  if (input.location !== undefined) data.location = input.location;
  if (input.notes !== undefined) data.notes = input.notes;

  const item = await prisma.inventoryItem.update({ where: { id: itemId }, data });
  return toItemDto(item);
}

export async function deleteItem(itemId: string, userId: string): Promise<void> {
  const existing = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new HttpError(404, 'Item not found', 'NOT_FOUND');

  await assertMember(userId, existing.circleId);
  await prisma.inventoryItem.delete({ where: { id: itemId } });
}

export async function addToShoppingList(
  itemId: string,
  userId: string
): Promise<void> {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'Item not found', 'NOT_FOUND');

  await assertMember(userId, item.circleId);

  const quantityNeeded = item.minimumThreshold > 0
    ? Math.max(item.minimumThreshold - item.quantity, 1)
    : 1;

  await prisma.shoppingListItem.create({
    data: {
      circleId: item.circleId,
      inventoryItemId: item.id,
      name: item.name,
      quantityNeeded,
      unit: item.unit,
      addedById: userId,
    },
  });
}

export async function createTaskFromItem(
  itemId: string,
  userId: string,
  assigneeId?: string | null
): Promise<string> {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new HttpError(404, 'Item not found', 'NOT_FOUND');

  await assertMember(userId, item.circleId);
  if (assigneeId) await assertMember(assigneeId, item.circleId);

  // Find max position in TODO column to append
  const lastTask = await prisma.task.findFirst({
    where: { circleId: item.circleId, status: 'TODO' },
    orderBy: { position: 'desc' },
  });
  const position = (lastTask?.position ?? 0) + 1024;

  const task = await prisma.task.create({
    data: {
      circleId: item.circleId,
      createdById: userId,
      title: `Buy ${item.name}`,
      description: item.quantity <= 0
        ? `${item.name} is out of stock. Replenish supply.`
        : `${item.name} is running low (${item.quantity} ${item.unit ?? 'units'} remaining). Minimum: ${item.minimumThreshold}.`,
      status: 'TODO',
      priority: item.quantity <= 0 ? 'HIGH' : 'MEDIUM',
      assigneeId: assigneeId ?? null,
      position,
    },
  });

  return task.id;
}
