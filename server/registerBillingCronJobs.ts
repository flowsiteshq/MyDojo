/**
 * One-time script to register the daily billing health check and retry Heartbeat jobs.
 * Run with: npx tsx server/registerBillingCronJobs.ts
 *
 * Jobs:
 *   1. billingHealthCheck — fires daily at 9 AM CDT (14:00 UTC)
 *      Scans for missing/broken subscriptions and open payment failures
 *   2. billingRetry — fires daily at 10 AM CDT (15:00 UTC)
 *      Retries declined card charges and sends SMS to parents on 2nd failure
 */

import dotenv from "dotenv";
dotenv.config();

import { createHeartbeatJob } from "./_core/heartbeat";

const JOBS = [
  {
    name: "billing-health-check-daily",
    cron: "0 0 14 * * *",  // Daily at 14:00 UTC = 9 AM CDT
    path: "/api/scheduled/billingHealthCheck",
    description: "Daily billing health check — finds missing/broken subscriptions and unresolved payment failures",
  },
  {
    name: "billing-retry-daily",
    cron: "0 0 15 * * *",  // Daily at 15:00 UTC = 10 AM CDT
    path: "/api/scheduled/billingRetry",
    description: "Daily billing retry — retries declined cards, sends SMS to parents on repeated failures",
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
  console.log("\nDone. Both billing cron jobs are now registered.");
  console.log("• billingHealthCheck: daily at 9 AM CDT (14:00 UTC) → /api/scheduled/billingHealthCheck");
  console.log("• billingRetry: daily at 10 AM CDT (15:00 UTC) → /api/scheduled/billingRetry");
}

main();
