/**
 * Intro Reminder Job
 *
 * Runs every 30 minutes. Finds leads whose scheduled intro class is between
 * 23 and 25 hours from now and who haven't received a reminder yet, then
 * sends them a personalised SMS reminder via 800.com.
 */

import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { sendSms } from "./sms800";
export async function runIntroReminderJob(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[IntroReminder] Database unavailable, skipping job.");
    return;
  }

  console.log(`[IntroReminder] Running at ${new Date().toISOString()} - checking for leads with intro in 23-25h window`);

  // Use DB-relative NOW() to avoid server/DB timezone mismatch
  // The DB may run in a different timezone than the Node server
  const leads = await db
    .select()
    .from(schema.trialSignups)
    .where(
      sql`${schema.trialSignups.scheduledTime} IS NOT NULL
          AND ${schema.trialSignups.reminderSentAt} IS NULL
          AND ${schema.trialSignups.status} != 'cancelled'
          AND ${schema.trialSignups.scheduledTime} BETWEEN DATE_ADD(NOW(), INTERVAL 23 HOUR) AND DATE_ADD(NOW(), INTERVAL 25 HOUR)`
    );

  console.log(`[IntroReminder] Found ${leads.length} lead(s) to remind.`);

  for (const lead of leads) {
    if (!lead.phone || !lead.scheduledTime) continue;

    // Skip cancelled leads
    if (lead.status === "cancelled") continue;

    const scheduledDate = new Date(lead.scheduledTime);
    const timeStr = scheduledDate.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const firstName = lead.name.split(" ")[0];
    const message =
      `Hi ${firstName}! 🥋 This is MyDojo reminding you that your FREE intro ${lead.program} class is tomorrow — ${timeStr} (Central Time). ` +
      `We're excited to meet you! Wear comfortable athletic clothes and arrive 5-10 minutes early. ` +
      `Questions? Reply to this text or call us at (877) 4-MYDOJO. See you on the mat!`;

    try {
      const result = await sendSms({ to: lead.phone, message });

      if (result.success) {
        // Stamp reminderSentAt so we don't send again
        await db
          .update(schema.trialSignups)
          .set({ reminderSentAt: new Date() })
          .where(eq(schema.trialSignups.id, lead.id));

        console.log(
          `[IntroReminder] ✓ Reminder sent to ${lead.name} (${lead.phone}) for ${timeStr}`
        );
      } else {
        console.error(
          `[IntroReminder] ✗ Failed to send reminder to ${lead.name}: ${result.error}`
        );
      }
    } catch (err) {
      console.error(`[IntroReminder] ✗ Error sending to ${lead.name}:`, err);
    }
  }

  console.log("[IntroReminder] Job complete.");
}
