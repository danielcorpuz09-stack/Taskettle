import { createApp } from './app';
import { env } from './config/env';
import { startReminderJob } from './jobs/reminders';

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`🫖 Taskettle API running at http://localhost:${env.port}/api`);
  startReminderJob();
});
