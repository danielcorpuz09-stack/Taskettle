import type { Prisma, ShoppingListItem } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { assertMember } from '../circles/circles.service';
import type { ShoppingItemStatus } from '../../types/domain';
import type { CreateShoppingItemInput, UpdateShoppingItemInput } from './shopping-list.schema';

export interface ShoppingListItemDto {
  id: string;
  circleId: string;
  inventoryItemId: string | null;
  name: string;
  quantityNeeded: number;
  unit: string | null;
  status: ShoppingItemStatus;
  addedById: string;
  purchasedById: string | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDto(item: ShoppingListItem): ShoppingListItemDto {
  return {
    id: item.id,
    circleId: item.circleId,
    inventoryItemId: item.inventoryItemId,
    name: item.name,
    quantityNeeded: item.quantityNeeded,
    unit: item.unit,
    status: item.status as ShoppingItemStatus,
    addedById: item.addedById,
    purchasedById: item.purchasedById,
    purchasedAt: item.purchasedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function listItems(
  circleId: string,
  filters?: { status?: string }
): Promise<ShoppingListItemDto[]> {
  const where: Prisma.ShoppingListItemWhereInput = { circleId };
  if (filters?.status) where.status = filters.status;

  const items = await prisma.shoppingListItem.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  return items.map(toDto);
}

export async function createItem(
  circleId: string,
  addedById: string,
  input: CreateShoppingItemInput
): Promise<ShoppingListItemDto> {
  const item = await prisma.shoppingListItem.create({
    data: {
      circleId,
      addedById,
      name: input.name,
      quantityNeeded: input.quantityNeeded ?? 1,
      unit: input.unit ?? null,
      inventoryItemId: input.inventoryItemId ?? null,
    },
  });
  return toDto(item);
}

export async function updateItem(
  itemId: string,
  userId: string,
  input: UpdateShoppingItemInput
): Promise<ShoppingListItemDto> {
  const existing = await prisma.shoppingListItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new HttpError(404, 'Shopping list item not found', 'NOT_FOUND');

  await assertMember(userId, existing.circleId);

  const data: Prisma.ShoppingListItemUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.quantityNeeded !== undefined) data.quantityNeeded = input.quantityNeeded;
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === 'PURCHASED') {
      data.purchasedBy = { connect: { id: userId } };
      data.purchasedAt = new Date();
    } else {
      data.purchasedBy = { disconnect: true };
      data.purchasedAt = null;
    }
  }

  const item = await prisma.shoppingListItem.update({ where: { id: itemId }, data });
  return toDto(item);
}

export async function deleteItem(itemId: string, userId: string): Promise<void> {
  const existing = await prisma.shoppingListItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new HttpError(404, 'Shopping list item not found', 'NOT_FOUND');

  await assertMember(userId, existing.circleId);
  await prisma.shoppingListItem.delete({ where: { id: itemId } });
}
