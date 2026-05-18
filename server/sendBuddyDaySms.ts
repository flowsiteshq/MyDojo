/**
 * One-time SMS blast for Buddy Day Board Breaking Night
 * Wednesday May 20th, 6pm-7:30pm — FREE event, RSVP at mydojoma.com/buddy-day
 */
import { getDb } from "./db";
import { sendSms } from "./sms800";
import { enrollments, users, trialSignups } from "../drizzle/schema";
import { eq, isNotNull, ne, inArray } from "drizzle-orm";

const MESSAGE = `🥋 MyDojo BUDDY DAY — Board Breaking Night!\n\nWed May 20th | 6:00–7:30 PM\nAll ranks & ages welcome. FREE event!\n\nBring a friend & RSVP here:\nhttps://mydojoma.com/buddy-day\n\nSee you on the mat! 🎉`;

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return null;
}

async function main() {
  const db = await getDb();
  if (!db) { console.error("DB unavailable"); process.exit(1); }

  // Collect all phone numbers
  const phoneMap = new Map<string, string>(); // normalized phone -> name

  // Parents from active enrollments
  const parents = await db
    .select({ phone: enrollments.customerPhone, name: enrollments.customerName })
    .from(enrollments)
    .where(eq(enrollments.status, 'active'));
  for (const row of parents) {
    if (!row.phone) continue;
    const norm = normalizePhone(row.phone);
    if (norm) phoneMap.set(norm, row.name || '');
  }

  // Admin/staff users
  const staffUsers = await db
    .select({ phone: users.phone, name: users.name })
    .from(users)
    .where(inArray(users.role, ['admin', 'staff']));
  for (const row of staffUsers) {
    if (!row.phone) continue;
    const norm = normalizePhone(row.phone);
    if (norm) phoneMap.set(norm, row.name || '');
  }

  // Leads
  const leads = await db
    .select({ phone: trialSignups.phone, name: trialSignups.name })
    .from(trialSignups);
  for (const row of leads) {
    if (!row.phone) continue;
    const norm = normalizePhone(row.phone);
    if (norm) phoneMap.set(norm, row.name || '');
  }

  const allPhones = Array.from(phoneMap.entries());
  console.log(`[BuddyDaySMS] Sending to ${allPhones.length} unique numbers...`);

  let sent = 0;
  let failed = 0;

  for (const [phone, name] of allPhones) {
    const result = await sendSms({ to: phone, message: MESSAGE });
    const ok = result.success;
    if (ok) {
      sent++;
      console.log(`  ✓ Sent to ${name} (${phone})`);
    } else {
      failed++;
      console.log(`  ✗ Failed: ${name} (${phone})`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\n[BuddyDaySMS] Done! Sent: ${sent}, Failed: ${failed}, Total: ${allPhones.length}`);
}

main().catch(console.error);
