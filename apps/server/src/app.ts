import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRouter } from './modules/auth/auth.routes';
import { circlesRouter } from './modules/circles/circles.routes';
import { inviteAcceptRouter } from './modules/invites/invites.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';
import { shoppingListRouter } from './modules/shopping-list/shopping-list.routes';
import { walletRouter } from './modules/wallet/wallet.routes';
import assetsRouter from './modules/assets/assets.routes';
import recurringExpensesRouter from './modules/recurring-expenses/recurring-expenses.routes';
import vehiclesRouter from './modules/vehicles/vehicles.routes';
import maintenanceRouter from './modules/maintenance/maintenance.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  if (!env.isProd) app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'taskettle', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/circles', circlesRouter);
  app.use('/api/invites', inviteAcceptRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/shopping-list', shoppingListRouter);
  app.use('/api/wallet', walletRouter);
  app.use('/api/notifications', notificationsRouter);

  // Phase 2: Household Management
  app.use('/api/assets', assetsRouter);
  app.use('/api/recurring-expenses', recurringExpensesRouter);
  app.use('/api/vehicles', vehiclesRouter);
  app.use('/api/maintenance', maintenanceRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
