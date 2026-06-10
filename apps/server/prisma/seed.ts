import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USD = 'USD';

async function main(): Promise<void> {
  // Idempotent-ish: clear demo data first.
  await prisma.notification.deleteMany();
  await prisma.debtPayment.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.walletCategory.deleteMany();
  await prisma.walletAccount.deleteMany();
  await prisma.task.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.circle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const mei = await prisma.user.create({
    data: { name: 'Mei', email: 'mei@taskettle.app', passwordHash, avatarColor: '#8fa998' },
  });
  const satsuki = await prisma.user.create({
    data: { name: 'Satsuki', email: 'satsuki@taskettle.app', passwordHash, avatarColor: '#ecbbba' },
  });
  const tatsuo = await prisma.user.create({
    data: { name: 'Tatsuo', email: 'tatsuo@taskettle.app', passwordHash, avatarColor: '#cec2d9' },
  });

  // A shared family circle so the wallet demo has somewhere to live.
  const circle = await prisma.circle.create({
    data: {
      name: 'Kusakabe Family',
      icon: 'family_history',
      memberships: {
        create: [
          { userId: mei.id, role: 'OWNER' },
          { userId: satsuki.id, role: 'MEMBER' },
          { userId: tatsuo.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // --- Wallet accounts ---
  const checking = await prisma.walletAccount.create({
    data: { circleId: circle.id, name: 'Household Checking', type: 'BANK', currency: USD, ownerId: tatsuo.id },
  });
  const cash = await prisma.walletAccount.create({
    data: { circleId: circle.id, name: 'Cash Jar', type: 'CASH', currency: USD },
  });

  // --- Categories ---
  const groceries = await prisma.walletCategory.create({
    data: { circleId: circle.id, name: 'Groceries', type: 'EXPENSE', color: '#8fa998', icon: 'shopping_cart' },
  });
  const utilities = await prisma.walletCategory.create({
    data: { circleId: circle.id, name: 'Utilities', type: 'EXPENSE', color: '#aa9eb5', icon: 'bolt' },
  });
  const salary = await prisma.walletCategory.create({
    data: { circleId: circle.id, name: 'Salary', type: 'INCOME', color: '#4c6455', icon: 'payments' },
  });

  // --- Transactions (amounts in minor units / cents) ---
  const now = new Date();
  const thisMonth = (day: number): Date => new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);

  await prisma.walletTransaction.createMany({
    data: [
      {
        circleId: circle.id, accountId: checking.id, type: 'INCOME', amountMinor: 320000,
        currency: USD, categoryId: salary.id, payee: 'Monthly salary',
        transactionDate: thisMonth(1), createdById: tatsuo.id,
      },
      {
        circleId: circle.id, accountId: checking.id, type: 'EXPENSE', amountMinor: 8450,
        currency: USD, categoryId: groceries.id, note: 'Weekly groceries', payee: 'Corner Market',
        transactionDate: thisMonth(3), createdById: mei.id,
      },
      {
        circleId: circle.id, accountId: checking.id, type: 'EXPENSE', amountMinor: 12000,
        currency: USD, categoryId: utilities.id, note: 'Electricity bill',
        transactionDate: thisMonth(5), createdById: satsuki.id,
      },
      {
        circleId: circle.id, accountId: cash.id, type: 'EXPENSE', amountMinor: 2300,
        currency: USD, categoryId: groceries.id, note: 'Vegetables', payee: 'Farm stand',
        transactionDate: thisMonth(7), createdById: mei.id,
      },
    ],
  });

  // --- Budgets ---
  await prisma.budget.create({
    data: {
      circleId: circle.id, name: 'Monthly Groceries', categoryId: groceries.id,
      amountMinor: 40000, currency: USD, period: 'MONTHLY', createdById: mei.id,
    },
  });
  await prisma.budget.create({
    data: {
      circleId: circle.id, name: 'Monthly Utilities', categoryId: utilities.id,
      amountMinor: 20000, currency: USD, period: 'MONTHLY', createdById: tatsuo.id,
    },
  });

  // --- Debts ---
  // Satsuki owes Mei, partially paid.
  const debt1 = await prisma.debt.create({
    data: {
      circleId: circle.id, lenderId: mei.id, borrowerId: satsuki.id, amountMinor: 5000,
      currency: USD, reason: 'Concert ticket', status: 'PARTIALLY_PAID',
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), createdById: mei.id,
    },
  });
  await prisma.debtPayment.create({
    data: { debtId: debt1.id, amountMinor: 2000, currency: USD, paidById: satsuki.id, paidToId: mei.id },
  });

  // Tatsuo owes Mei, due soon and unpaid (will trigger a reminder).
  await prisma.debt.create({
    data: {
      circleId: circle.id, lenderId: mei.id, borrowerId: tatsuo.id, amountMinor: 1500,
      currency: USD, reason: 'Lunch', status: 'OPEN',
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), createdById: mei.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log('🌱 Seeded users, circle, and wallet demo. Login: mei@taskettle.app / password123');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
