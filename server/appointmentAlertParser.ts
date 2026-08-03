/**
 * Appointment Alert Parser
 * Detects and parses incoming SMS appointment alert notifications from 800.com
 * (sent from +1 832 610 2103) and saves them as leads in the trialSignups table.
 *
 * Expected format:
 * [Auto Reminder] New Appointment Alert:
 * Name: John Cunningham
 * Email: elzzifj@gmail.com
 * Phone: (828) 778-0430
 * Appointment Date: August 4, 2026
 * Appointment Time: 5:30 PM
 * Notes:
 * How many people are coming to class: 2
 * Why is the lead interested in joining: They love it
 */

import { getDb } from "./db";
import { trialSignups } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// The phone number that sends appointment alerts from 800.com
const APPOINTMENT_ALERT_SENDER = "+18326102103";

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Parse a line like "Name: John Cunningham" → "John Cunningham"
 */
function extractField(lines: string[], ...keys: string[]): string | null {
  for (const key of keys) {
    const lower = key.toLowerCase();
    const line = lines.find(l => l.toLowerCase().startsWith(lower + ":"));
    if (line) {
      const val = line.substring(line.indexOf(":") + 1).trim();
      if (val && val !== "NA" && val !== "N/A") return val;
    }
  }
  return null;
}

/**
 * Parse appointment date + time into a Date object
 */
function parseAppointmentDate(dateStr: string | null, timeStr: string | null): Date | null {
  if (!dateStr) return null;
  try {
    const combined = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    const d = new Date(combined);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  return null;
}

/**
 * Detect if the SMS body is an appointment alert notification
 */
export function isAppointmentAlert(body: string): boolean {
  const lower = body.toLowerCase();
  return (
    lower.includes("new appointment alert") ||
    lower.includes("[auto reminder]") ||
    (lower.includes("appointment date:") && lower.includes("name:") && lower.includes("phone:"))
  );
}

/**
 * Parse the appointment alert SMS body and save the lead to the database.
 * Returns true if a lead was saved, false otherwise.
 */
export async function parseAndSaveAppointmentLead(
  body: string,
  senderPhone: string
): Promise<boolean> {
  try {
    const lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const name = extractField(lines, "Name");
    const email = extractField(lines, "Email");
    const rawPhone = extractField(lines, "Phone");
    const dateStr = extractField(lines, "Appointment Date");
    const timeStr = extractField(lines, "Appointment Time");
    const interestReason = extractField(lines, "Why is the lead interested in joining", "Why interested", "Reason");
    const peopleCount = extractField(lines, "How many people are coming to class", "How many people", "People coming");

    // Phone is required — fall back to sender if not in message
    const phone = rawPhone ? normalizePhone(rawPhone) : normalizePhone(senderPhone);

    if (!name && !phone) {
      console.log("[AppointmentAlert] Could not extract name or phone — skipping");
      return false;
    }

    const db = await getDb();
    if (!db) return false;

    // Check for duplicate by phone + scheduled time to avoid double-inserts
    const scheduledTime = parseAppointmentDate(dateStr, timeStr);

    if (phone) {
      const existing = await db
        .select({ id: trialSignups.id })
        .from(trialSignups)
        .where(
          scheduledTime
            ? and(eq(trialSignups.phone, phone), eq(trialSignups.scheduledTime, scheduledTime))
            : eq(trialSignups.phone, phone)
        )
        .limit(1)
        .execute();

      if (existing.length > 0) {
        console.log(`[AppointmentAlert] Duplicate lead for ${phone} — skipping`);
        return false;
      }
    }

    // Build notes from available context
    const notesParts: string[] = [];
    if (interestReason) notesParts.push(`Interest: ${interestReason}`);
    if (peopleCount) notesParts.push(`People coming: ${peopleCount}`);
    if (dateStr) notesParts.push(`Appointment: ${dateStr}${timeStr ? ` at ${timeStr}` : ""}`);
    notesParts.push(`Source: 800.com appointment alert from ${senderPhone}`);

    // Insert the lead
    await db.insert(trialSignups).values({
      name: name ?? "Unknown",
      email: email ?? null,
      phone: phone,
      program: "Not Sure",
      location: "MyDojo HQ",
      preferredContactMethod: "phone",
      status: "scheduled",
      pipelineStage: "intro_scheduled",
      source: "800com_appointment",
      scheduledTime: scheduledTime ?? undefined,
      notes: notesParts.join("\n"),
    } as any);

    console.log(`[AppointmentAlert] ✅ Lead saved: ${name} (${phone}) — appt ${dateStr} ${timeStr}`);

    // Notify owner
    await notifyOwner({
      title: `📅 New Appointment Lead: ${name ?? phone}`,
      content: `A new appointment was booked via 800.com.\n\nName: ${name ?? "Unknown"}\nPhone: ${phone}\nEmail: ${email ?? "N/A"}\nDate: ${dateStr ?? "N/A"} ${timeStr ?? ""}\nInterest: ${interestReason ?? "N/A"}\nPeople: ${peopleCount ?? "1"}`,
    });

    return true;
  } catch (err) {
    console.error("[AppointmentAlert] Error parsing/saving lead:", err);
    return false;
  }
}
