/**
 * dailyClassRosterJob.ts
 *
 * Sends a daily SMS to every admin/staff user (with a phone number)
 * listing all students who have signed up for classes that day.
 *
 * Runs once per day at 7:00 AM local time (America/Chicago / CDT).
 * Registered in server/_core/index.ts.
 *
 * SMS format per class:
 *   🥋 TODAY'S CLASSES — Fri May 16
 *   ─────────────────────────────
 *   5:00 PM · Little Ninjas (3 students)
 *     • Emma S. | Lynn N. (832-230-9914)
 *     • Jake P. | Palacios Family (310-291-1889)
 *     • Izzy G. | Videlis G. (832-361-8786)
 *   ─────────────────────────────
 *   6:00 PM · Dragon Kids (2 students)
 *     • ...
 *   ─────────────────────────────
 *   Total sign-ups: 5
 *   View full roster: mydojoma.com/admin/class-roster
 */

import { getDb } from "./db";
import { sendSms } from "./sms800";
import * as schema from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export async function runDailyClassRosterJob(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[DailyRoster] Database unavailable — skipping");
      return;
    }

    // Today's date in YYYY-MM-DD (server is UTC, convert to CDT = UTC-5/6)
    const now = new Date();
    const cdt = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const todayStr = cdt.toISOString().slice(0, 10);
    const todayLabel = cdt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    console.log(`[DailyRoster] Building roster for ${todayStr}`);

    // Fetch all confirmed reservations for today
    const reservations = await db
      .select()
      .from(schema.classReservations)
      .where(
        and(
          eq(schema.classReservations.classDate, todayStr),
          eq(schema.classReservations.status, "confirmed")
        )
      )
      .orderBy(schema.classReservations.startTime, schema.classReservations.studentName);

    if (reservations.length === 0) {
      console.log("[DailyRoster] No sign-ups for today — sending brief notice to staff");
      // Still send a "no sign-ups" message so staff know the system is running
      await sendRosterToStaff(db, `🥋 ${todayLabel} — No class sign-ups yet.\nStudents can sign up at mydojoma.com/classes`);
      return;
    }

    // Group by class (startTime + program)
    const grouped: Map<string, {
      program: string;
      startTime: string;
      endTime: string | null;
      instructor: string | null;
      location: string;
      students: typeof reservations;
    }> = new Map();

    for (const r of reservations) {
      const key = `${r.startTime}|${r.program}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          program: r.program,
          startTime: r.startTime,
          endTime: r.endTime ?? null,
          instructor: r.instructor ?? null,
          location: r.location,
          students: [],
        });
      }
      grouped.get(key)!.students.push(r);
    }

    // Build SMS message
    const lines: string[] = [`🥋 TODAY'S CLASSES — ${todayLabel}`];
    lines.push("─────────────────────────");

    for (const cls of Array.from(grouped.values())) {
      const timeRange = cls.endTime ? `${cls.startTime}–${cls.endTime}` : cls.startTime;
      const instrNote = cls.instructor ? ` (${cls.instructor})` : "";
      lines.push(`${timeRange} · ${cls.program}${instrNote} — ${cls.students.length} student${cls.students.length !== 1 ? "s" : ""}`);

      for (const s of cls.students) {
        const parentInfo = s.parentPhone ? `${s.parentName ?? "Parent"} ${s.parentPhone}` : (s.parentName ?? "");
        lines.push(`  • ${s.studentName}${parentInfo ? ` | ${parentInfo}` : ""}`);
      }
      lines.push("─────────────────────────");
    }

    lines.push(`Total: ${reservations.length} sign-up${reservations.length !== 1 ? "s" : ""}`);
    lines.push(`Roster: mydojoma.com/admin/class-roster`);

    const message = lines.join("\n");
    await sendRosterToStaff(db, message);

    console.log(`[DailyRoster] Sent roster for ${todayStr} — ${reservations.length} sign-ups across ${grouped.size} classes`);
  } catch (err) {
    console.error("[DailyRoster] Unexpected error:", err);
  }
}

async function sendRosterToStaff(db: Awaited<ReturnType<typeof getDb>>, message: string): Promise<void> {
  if (!db) return;

  const staffList = await db
    .select({ id: schema.users.id, name: schema.users.name, phone: schema.users.phone })
    .from(schema.users)
    .where(
      sql`${schema.users.role} IN ('staff', 'admin') AND ${schema.users.phone} IS NOT NULL AND ${schema.users.phone} != ''`
    );

  if (staffList.length === 0) {
    console.log("[DailyRoster] No staff with phone numbers — skipping SMS");
    return;
  }

  const results = await Promise.allSettled(
    staffList.map((staff) =>
      sendSms({ to: staff.phone!, message }).then((res) => {
        if (res.success) {
          console.log(`[DailyRoster] SMS sent to ${staff.name} (${staff.phone})`);
        } else {
          console.warn(`[DailyRoster] SMS failed for ${staff.name}: ${res.error}`);
        }
        return res;
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;
  console.log(`[DailyRoster] Notified ${sent}/${staffList.length} staff members`);
}

/**
 * Schedule the daily roster job to run at 7:00 AM CDT every day.
 * Uses a 1-minute polling interval to check if it's time to send.
 */
let lastSentDate = "";

export function startDailyClassRosterJob(): void {
  const checkAndRun = async () => {
    const now = new Date();
    const cdt = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = cdt.getHours();
    const minute = cdt.getMinutes();
    const todayStr = cdt.toISOString().slice(0, 10);

    // Run at 7:00 AM CDT (between 7:00 and 7:01) and only once per day
    if (hour === 7 && minute === 0 && lastSentDate !== todayStr) {
      lastSentDate = todayStr;
      console.log(`[DailyRoster] Triggering daily roster SMS for ${todayStr}`);
      await runDailyClassRosterJob();
    }
  };

  // Check every minute
  setInterval(checkAndRun, 60 * 1000);
  console.log("[DailyRoster] Scheduled — will send at 7:00 AM CDT daily");
}
