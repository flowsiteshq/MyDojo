/**
 * Student Appointment Reminder Job
 *
 * Runs every 15 minutes. Finds student appointments scheduled between
 * 1h 45m and 2h 15m from now (a 30-minute window around the 2-hour mark)
 * that haven't received a reminder yet, then sends a personalized SMS
 * reminder via 800.com.
 */
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { sendSms } from "./sms800";

export async function runStudentReminderJob(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[StudentReminder] Database unavailable, skipping job.");
    return;
  }

  console.log(
    `[StudentReminder] Running at ${new Date().toISOString()} - checking for appointments in 1h45m-2h15m window`
  );

  // Find appointments scheduled ~2 hours from now that haven't been reminded yet
  const appointments = await db
    .select()
    .from(schema.studentAppointments)
    .where(
      sql`${schema.studentAppointments.scheduledTime} IS NOT NULL
          AND ${schema.studentAppointments.reminderSentAt} IS NULL
          AND ${schema.studentAppointments.status} = 'scheduled'
          AND ${schema.studentAppointments.scheduledTime} BETWEEN DATE_ADD(NOW(), INTERVAL 105 MINUTE) AND DATE_ADD(NOW(), INTERVAL 135 MINUTE)`
    );

  console.log(`[StudentReminder] Found ${appointments.length} appointment(s) to remind.`);

  for (const apt of appointments) {
    if (!apt.studentPhone || !apt.scheduledTime) continue;

    const scheduledDate = new Date(apt.scheduledTime);
    const timeStr = scheduledDate.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const firstName = apt.studentName.split(" ")[0];
    const instructorNote = apt.instructor ? ` with ${apt.instructor}` : "";
    const message =
      `Hi ${firstName}! 🥋 Reminder from MyDojo — your ${apt.program} class${instructorNote} is in about 2 hours (${timeStr} CT). ` +
      `See you on the mat! Questions? Call us at (877) 4-MYDOJO or reply to this text.`;

    try {
      const result = await sendSms({ to: apt.studentPhone, message });
      if (result.success) {
        // Stamp reminderSentAt so we don't send again
        await db
          .update(schema.studentAppointments)
          .set({ reminderSentAt: new Date() })
          .where(eq(schema.studentAppointments.id, apt.id));

        console.log(
          `[StudentReminder] ✓ Reminder sent to ${apt.studentName} (${apt.studentPhone}) for ${timeStr}`
        );
      } else {
        console.error(
          `[StudentReminder] ✗ Failed to send reminder to ${apt.studentName}: ${result.error}`
        );
      }
    } catch (err) {
      console.error(`[StudentReminder] ✗ Error sending to ${apt.studentName}:`, err);
    }
  }

  console.log("[StudentReminder] Job complete.");
}
