import { Request, Response } from "express";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, or, and, isNotNull, ne } from "drizzle-orm";
import { sendSms, normalizePhone } from "./sms800";

const MESSAGE =
  "MyDojo Tomball 🥋 Reminder: Summer Camp Open House is TOMORROW Wed May 28th at 6PM! " +
  "Come meet the coaches, see the facility & register your child before spots are gone. " +
  "Details & register: https://www.mydojoma.com/summer-camp/open-house";

// May 27 is the Open House — we send May 23, 24, 25, 26 at 9 AM CDT (14:00 UTC)
// After May 26 the handler will still be called but will skip (date guard)
export async function handleSummerCampReminder(req: Request, res: Response) {
  try {
    const now = new Date();
    // Only fire May 23–26 2026 (UTC dates cover 9 AM CDT = 14:00 UTC)
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // 1-indexed
    const day = now.getUTCDate();

    if (year !== 2026 || month !== 5 || day < 23 || day > 26) {
      console.log(`[SummerCampReminder] Skipping — outside campaign window (${now.toISOString()})`);
      return res.json({ ok: true, skipped: "outside-campaign-window" });
    }

    // Collect unique phone numbers: enrolled students + staff/admin
    const phoneSet = new Set<string>();
    const contacts: { phone: string; name: string }[] = [];

    const db = await getDb();
    if (!db) throw new Error("DB connection unavailable");

    // Enrolled students (active, non-opted-out)
    const activeEnrollments = await db
      .select({
        phone: schema.enrollments.customerPhone,
        name: schema.enrollments.customerName,
      })
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.status, "active"),
          isNotNull(schema.enrollments.customerPhone),
          ne(schema.enrollments.customerPhone, "")
        )
      );

    for (const e of activeEnrollments) {
      if (e.phone && !phoneSet.has(e.phone)) {
        phoneSet.add(e.phone);
        contacts.push({ phone: e.phone, name: e.name || "Student" });
      }
    }

    // Staff and admin users
    const staffUsers = await db
      .select({ phone: schema.users.phone, name: schema.users.name })
      .from(schema.users)
      .where(or(eq(schema.users.role, "staff"), eq(schema.users.role, "admin")));

    for (const u of staffUsers) {
      if (u.phone && !phoneSet.has(u.phone)) {
        phoneSet.add(u.phone);
        contacts.push({ phone: u.phone, name: u.name || "Staff" });
      }
    }

    console.log(`[SummerCampReminder] Sending to ${contacts.length} contacts on ${year}-${month}-${day}`);

    let sent = 0;
    let failed = 0;
    for (const contact of contacts) {
      try {
        const phone = normalizePhone(contact.phone);
        await sendSms({ to: phone, message: MESSAGE });
        sent++;
        // 150ms delay between sends to avoid rate limiting
        await new Promise(r => setTimeout(r, 150));
      } catch (err) {
        console.error(`[SummerCampReminder] Failed to send to ${contact.phone}:`, err);
        failed++;
      }
    }

    console.log(`[SummerCampReminder] Done — sent: ${sent}, failed: ${failed}`);
    return res.json({ ok: true, sent, failed, date: `${year}-${month}-${day}` });
  } catch (err) {
    console.error("[SummerCampReminder] Handler error:", err);
    return res.status(500).json({
      error: String(err),
      timestamp: new Date().toISOString(),
    });
  }
}
