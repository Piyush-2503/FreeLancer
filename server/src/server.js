import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';
import { startReminderCron } from './jobs/reminderJob.js';

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    if (env.NODE_ENV !== 'test') {
      startReminderCron();
    }
  });
});
