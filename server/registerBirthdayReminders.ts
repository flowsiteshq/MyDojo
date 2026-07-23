/**
 * One-time script to register the 3 birthday party reminder Heartbeat jobs.
 * Run with: npx tsx server/registerBirthdayReminders.ts
 *
 * Jobs fire at /api/scheduled/birthday-reminder which checks the current date
 * and sends the appropriate reminder message.
 *
 * Schedule (all UTC = CST+5 in July):
 *   Friday  July 25, 19:00 UTC = 2:00 PM CST
 *   Saturday July 26, 19:00 UTC = 2:00 PM CST
 *   Sunday  July 27, 19:00 UTC = 2:00 PM CST (2 hrs before 4 PM party)
 */

import dotenv from "dotenv";
dotenv.config();

import { createHeartbeatJob } from "./_core/heartbeat";

const JOBS = [
  {
    name: "birthday-reminder-friday-2025",
    cron: "0 0 19 25 7 5",  // Friday July 25 at 19:00 UTC
    path: "/api/scheduled/birthday-reminder",
    description: "Abraham 10th Birthday — Friday reminder (party this Sunday)",
  },
  {
    name: "birthday-reminder-saturday-2025",
    cron: "0 0 19 26 7 6",  // Saturday July 26 at 19:00 UTC
    path: "/api/scheduled/birthday-reminder",
    description: "Abraham 10th Birthday — Saturday reminder (party tomorrow)",
  },
  {
    name: "birthday-reminder-sunday-2025",
    cron: "0 0 19 27 7 0",  // Sunday July 27 at 19:00 UTC
    path: "/api/scheduled/birthday-reminder",
    description: "Abraham 10th Birthday — Sunday reminder (party in 2 hours)",
  },
];

async function main() {
  for (const job of JOBS) {
    try {
      const result = await createHeartbeatJob(job, "");  // empty string = project owner identity
      console.log(`✅ Registered: ${job.name}`, result);
    } catch (err: any) {
      console.error(`❌ Failed to register ${job.name}:`, err.message);
    }
  }
}

main();
