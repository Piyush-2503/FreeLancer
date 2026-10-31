#!/usr/bin/env node
/**
 * Manual reminder trigger script.
 * Usage: npm run reminders:run
 */
import { connectDB } from '../src/config/db.js';
import { runReminderJob } from '../src/jobs/reminderJob.js';

async function main() {
  await connectDB();
  await runReminderJob();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
