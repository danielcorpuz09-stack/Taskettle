import type { Notification } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import type { NotificationType } from '../../types/domain';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  message: string;
  taskId: string | null;
  read: boolean;
  createdAt: string;
}

export async function listNotifications(
  userId: string
): Promise<{ notifications: NotificationDto[]; unread: number }> {
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { notifications: notifications.map(toNotificationDto), unread };
}

export async function markRead(userId: string, id: string): Promise<NotificationDto> {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HttpError(404, 'Notification not found', 'NOT_FOUND');
  }
  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  return toNotificationDto(updated);
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return result.count;
}

function toNotificationDto(n: Notification): NotificationDto {
  return {
    id: n.id,
    type: n.type as NotificationType,
    message: n.message,
    taskId: n.taskId,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}
