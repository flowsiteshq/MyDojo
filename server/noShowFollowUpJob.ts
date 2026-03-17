/**
 * No-Show Follow-Up Job
 *
 * Runs every 30 minutes. Finds leads who:
 *   1. Had a scheduled intro class (scheduledTime IS NOT NULL)
 *   2. The appointment was in the past (at least 1 hour ago)
 *   3. Their pipeline stage is still "intro_scheduled" (they didn't show up / weren't moved to "showed_up")
 *   4. Haven't been cancelled
 *   5. Haven't already received a no-show follow-up SMS
 *
 * Sends a friendly re-engagement SMS offering to reschedule, and moves them to the "nurture" stage.
 */
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { sendSms } from "./sms800";

export async function runNoShowFollowUpJob(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[NoShowFollowUp] Database unavailable, skipping job.");
    return;
  }

  console.log(
    `[NoShowFollowUp] Running at ${new Date().toISOString()} - checking for no-show leads`
  );

  // Find leads whose scheduled intro has passed (>1h ago), still in intro_scheduled stage,
  // not cancelled, and haven't received a no-show SMS yet.
  const leads = await db
    .select()
    .from(schema.trialSignups)
    .where(
      sql`${schema.trialSignups.scheduledTime} IS NOT NULL
          AND ${schema.trialSignups.noShowSentAt} IS NULL
          AND ${schema.trialSignups.pipelineStage} = 'intro_scheduled'
          AND ${schema.trialSignups.status} != 'cancelled'
          AND ${schema.trialSignups.scheduledTime} < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    );

  console.log(`[NoShowFollowUp] Found ${leads.length} no-show lead(s) to follow up.`);

  for (const lead of leads) {
    if (!lead.phone) continue;

    const firstName = lead.name.split(" ")[0];
    const message =
      `Hi ${firstName}! 🥋 This is MyDojo — we missed you at your intro ${lead.program} class today! ` +
      `Life happens, no worries at all. We'd love to get you rescheduled for a FREE class at your convenience. ` +
      `Just reply to this text or call us at (877) 4-MYDOJO and we'll find a time that works for you. ` +
      `We look forward to meeting you on the mat! 🙏`;

    try {
      const result = await sendSms({ to: lead.phone, message });

      if (result.success) {
        // Stamp noShowSentAt and move to nurture stage
        await db
          .update(schema.trialSignups)
          .set({
            noShowSentAt: new Date(),
            pipelineStage: "nurture",
          })
          .where(eq(schema.trialSignups.id, lead.id));

        console.log(
          `[NoShowFollowUp] ✓ Follow-up sent to ${lead.name} (${lead.phone}) — moved to nurture`
        );
      } else {
        console.error(
          `[NoShowFollowUp] ✗ Failed to send to ${lead.name}: ${result.error}`
        );
      }
    } catch (err) {
      console.error(`[NoShowFollowUp] ✗ Error sending to ${lead.name}:`, err);
    }
  }

  console.log("[NoShowFollowUp] Job complete.");
}
