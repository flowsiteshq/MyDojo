import { getDb } from "./db";
import { trialSignups } from "../drizzle/schema";
import { submitLeadToDojoFlow } from "./dojoFlowClient";
import { eq, and, or, lt, isNull } from "drizzle-orm";

/**
 * Background job to retry failed DojoFlow syncs
 * 
 * This job runs periodically to find leads that haven't been synced to DojoFlow
 * and retries the sync with exponential backoff.
 * 
 * Features:
 * - Automatically detects unsynced leads (status: pending or failed)
 * - Respects retry limits (max 5 attempts)
 * - Uses exponential backoff (waits longer between retries)
 * - Updates sync status and error messages
 * - Logs all sync attempts for debugging
 */

const MAX_SYNC_ATTEMPTS = 5;
const RETRY_DELAY_MINUTES = [0, 5, 15, 60, 240]; // 0min, 5min, 15min, 1hr, 4hr

export async function runDojoFlowSyncJob() {
  console.log("[DojoFlow Sync Job] Starting background sync job...");
  
  try {
    // Find leads that need syncing:
    // 1. Status is 'pending' or 'failed'
    // 2. Attempts < MAX_SYNC_ATTEMPTS
    // 3. Either never attempted OR enough time has passed since last attempt
    const now = new Date();
    
    const db = await getDb();
    if (!db) {
      console.error("[DojoFlow Sync Job] Database not available");
      return { success: false, error: "Database not available" };
    }

    const unsyncedLeads = await db
      .select()
      .from(trialSignups)
      .where(
        and(
          or(
            eq(trialSignups.dojoFlowSyncStatus, "pending"),
            eq(trialSignups.dojoFlowSyncStatus, "failed")
          ),
          lt(trialSignups.dojoFlowSyncAttempts, MAX_SYNC_ATTEMPTS)
        )
      );

    console.log(`[DojoFlow Sync Job] Found ${unsyncedLeads.length} leads to sync`);

    if (unsyncedLeads.length === 0) {
      console.log("[DojoFlow Sync Job] No leads need syncing. Job complete.");
      return {
        success: true,
        processed: 0,
        synced: 0,
        failed: 0,
      };
    }

    let synced = 0;
    let failed = 0;

    for (const lead of unsyncedLeads) {
      // Check if enough time has passed since last attempt
      if (lead.dojoFlowLastSyncAttempt) {
        const minutesSinceLastAttempt = 
          (now.getTime() - lead.dojoFlowLastSyncAttempt.getTime()) / (1000 * 60);
        const requiredDelay = RETRY_DELAY_MINUTES[lead.dojoFlowSyncAttempts] || 240;
        
        if (minutesSinceLastAttempt < requiredDelay) {
          console.log(
            `[DojoFlow Sync Job] Skipping lead ${lead.id} - not enough time since last attempt ` +
            `(${Math.floor(minutesSinceLastAttempt)}min < ${requiredDelay}min required)`
          );
          continue;
        }
      }

      console.log(
        `[DojoFlow Sync Job] Attempting to sync lead ${lead.id} ` +
        `(${lead.name}, attempt ${lead.dojoFlowSyncAttempts + 1}/${MAX_SYNC_ATTEMPTS})`
      );

      try {
        // Attempt to sync the lead
        await submitLeadToDojoFlow({
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone,
          program: lead.program,
          location: lead.location,
          preferredContactMethod: lead.preferredContactMethod,
          message: lead.message || undefined,
          source: lead.source as "chatbot" | "landing_page" | "trial_form" | "website",
        });

        // Sync successful - update status
        await db
          .update(trialSignups)
          .set({
            dojoFlowSyncStatus: "synced",
            dojoFlowSyncAttempts: lead.dojoFlowSyncAttempts + 1,
            dojoFlowLastSyncAttempt: now,
            dojoFlowSyncError: null,
          })
          .where(eq(trialSignups.id, lead.id));

        console.log(`[DojoFlow Sync Job] ✅ Successfully synced lead ${lead.id}`);
        synced++;
      } catch (error) {
        // Sync failed - update status and error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await db
          .update(trialSignups)
          .set({
            dojoFlowSyncStatus: "failed",
            dojoFlowSyncAttempts: lead.dojoFlowSyncAttempts + 1,
            dojoFlowLastSyncAttempt: now,
            dojoFlowSyncError: errorMessage,
          })
          .where(eq(trialSignups.id, lead.id));

        console.error(
          `[DojoFlow Sync Job] ❌ Failed to sync lead ${lead.id}: ${errorMessage}`
        );
        failed++;
      }
    }

    console.log(
      `[DojoFlow Sync Job] Job complete. Processed: ${unsyncedLeads.length}, ` +
      `Synced: ${synced}, Failed: ${failed}`
    );

    return {
      success: true,
      processed: unsyncedLeads.length,
      synced,
      failed,
    };
  } catch (error) {
    console.error("[DojoFlow Sync Job] Job failed with error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Start the background job with a periodic interval
 * Runs every 5 minutes by default
 */
export function startDojoFlowSyncJob(intervalMinutes: number = 5) {
  console.log(
    `[DojoFlow Sync Job] Starting periodic sync job (every ${intervalMinutes} minutes)`
  );

  // Run immediately on startup
  runDojoFlowSyncJob();

  // Then run periodically
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(() => {
    runDojoFlowSyncJob();
  }, intervalMs);
}
