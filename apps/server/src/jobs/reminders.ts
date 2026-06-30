import cron from 'node-cron';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import type { NotificationType } from '../types/domain';

/**
 * Scans for tasks that are due soon or overdue and creates one notification
 * per (assignee, task, type). The unique constraint on
 * (userId, taskId, type) makes this idempotent, so re-running never spams.
 *
 * Only tasks with an assignee and a dueDate, not DONE or BACKLOG, are considered.
 */
export async function runReminderScan(now: Date = new Date()): Promise<number> {
  const dueSoonCutoff = new Date(now.getTime() + env.reminderDueSoonHours * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      status: { notIn: ['DONE', 'BACKLOG'] },
      assigneeId: { not: null },
      dueDate: { not: null, lte: dueSoonCutoff },
    },
    select: { id: true, title: true, dueDate: true, assigneeId: true },
  });

  let created = 0;
  for (const task of tasks) {
    if (!task.assigneeId || !task.dueDate) continue;

    const overdue = task.dueDate.getTime() < now.getTime();
    const type: NotificationType = overdue ? 'OVERDUE' : 'DUE_SOON';
    const message = overdue
      ? `“${task.title}” is overdue`
      : `“${task.title}” is due soon`;

    try {
      // The unique index (userId, taskId, type) makes this idempotent:
      // a duplicate throws P2002 which we treat as "already notified".
      await prisma.notification.create({
        data: { userId: task.assigneeId, taskId: task.id, type, message },
      });
      created += 1;
    } catch {
      // Already notified (unique constraint) or transient error — skip.
    }
  }

  return created;
}

interface DebtReminderRow {
  id: string;
  reason: string | null;
  dueDate: Date | null;
  amountMinor: number;
  lenderId: string;
  borrowerId: string;
  payments: { amountMinor: number }[];
}

async function notifyDebtParties(debt: DebtReminderRow, now: Date): Promise<number> {
  if (!debt.dueDate) return 0;

  const paid = debt.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  if (paid >= debt.amountMinor) return 0; // already settled

  const overdue = debt.dueDate.getTime() < now.getTime();
  const type: NotificationType = overdue ? 'DEBT_OVERDUE' : 'DEBT_DUE_SOON';
  const label = debt.reason ? `“${debt.reason}”` : 'A debt';
  const suffix = overdue ? 'is overdue' : 'is due soon';

  const targets: [string, string][] = [
    [debt.borrowerId, `${label} you owe ${suffix}`],
    [debt.lenderId, `${label} owed to you ${suffix}`],
  ];

  let created = 0;
  for (const [userId, message] of targets) {
    try {
      // Unique index (userId, debtId, type) makes this idempotent.
      await prisma.notification.create({ data: { userId, debtId: debt.id, type, message } });
      created += 1;
    } catch {
      // Already notified or transient error — skip.
    }
  }
  return created;
}

/**
 * Scans for open debts that are due soon or overdue and notifies the borrower
 * and lender once per (user, debt, type). Settled debts are skipped.
 */
export async function runDebtReminderScan(now: Date = new Date()): Promise<number> {
  const dueSoonCutoff = new Date(now.getTime() + env.reminderDueSoonHours * 60 * 60 * 1000);

  const debts = await prisma.debt.findMany({
    where: {
      status: { in: ['OPEN', 'PARTIALLY_PAID'] },
      dueDate: { not: null, lte: dueSoonCutoff },
    },
    select: {
      id: true,
      reason: true,
      dueDate: true,
      amountMinor: true,
      lenderId: true,
      borrowerId: true,
      payments: { select: { amountMinor: true } },
    },
  });

  let created = 0;
  for (const debt of debts) {
    created += await notifyDebtParties(debt, now);
  }
  return created;
}

export function startReminderJob(): void {
  if (!cron.validate(env.reminderCron)) {
    // eslint-disable-next-line no-console
    console.warn(`[reminders] invalid REMINDER_CRON "${env.reminderCron}", reminders disabled`);
    return;
  }

  cron.schedule(env.reminderCron, () => {
    runReminderScan()
      .then((count) => {
        if (count > 0) {
          // eslint-disable-next-line no-console
          console.log(`[reminders] created ${count} notification(s)`);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[reminders] scan failed', err);
      });

    runDebtReminderScan()
      .then((count) => {
        if (count > 0) {
          // eslint-disable-next-line no-console
          console.log(`[reminders] created ${count} debt notification(s)`);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[reminders] debt scan failed', err);
      });
  });

  // eslint-disable-next-line no-console
  console.log(`[reminders] scanner scheduled (${env.reminderCron})`);
}
