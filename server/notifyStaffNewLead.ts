/**
 * notifyStaffNewLead.ts
 *
 * Sends an SMS to every admin/staff user who has a phone number stored
 * and has leadSmsNotify = 1 (enabled).
 *
 * Called from:
 *  - GHL webhook (handleGHLWebhook)
 *  - Facebook Lead Ads webhook (handleFacebookWebhook)
 *  - Website join form / popup lead capture (trialSignups.create)
 *  - Admin manual lead creation (admin.createLead)
 *  - Kiosk check-in for new guests
 */

import { getDb } from "./db";
import { sendSms } from "./sms800";
import * as schema from "../drizzle/schema";
import { sql } from "drizzle-orm";

export interface NewLeadInfo {
  name: string;
  phone?: string;
  program?: string;
  source?: string;
}

/**
 * Notify all staff/admin members who have a phone + leadSmsNotify=1.
 * Fires-and-forgets — errors are logged but never thrown.
 */
export async function notifyStaffNewLead(lead: NewLeadInfo): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Fetch all staff/admin with a phone number and notifications enabled
    const staffList = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
        leadSmsNotify: schema.users.leadSmsNotify,
      })
      .from(schema.users)
      .where(sql`${schema.users.role} IN ('staff', 'admin') AND ${schema.users.phone} IS NOT NULL AND ${schema.users.phone} != '' AND ${schema.users.leadSmsNotify} = 1`);

    if (staffList.length === 0) {
      console.log("[LeadNotify] No staff with phone numbers configured — skipping SMS");
      return;
    }

    const programLine = lead.program && lead.program !== "Not Sure" ? ` | Program: ${lead.program}` : "";
    const sourceLine = lead.source ? ` | Source: ${lead.source}` : "";
    const phoneLine = lead.phone ? ` | Phone: ${lead.phone}` : "";

    const message =
      `🥋 New Lead: ${lead.name}${phoneLine}${programLine}${sourceLine}\n` +
      `Log in to MyDojo admin to follow up.`;

    const results = await Promise.allSettled(
      staffList.map((staff) =>
        sendSms({ to: staff.phone!, message }).then((res) => {
          if (res.success) {
            console.log(`[LeadNotify] SMS sent to ${staff.name} (${staff.phone})`);
          } else {
            console.warn(`[LeadNotify] SMS failed for ${staff.name}: ${res.error}`);
          }
          return res;
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;
    console.log(`[LeadNotify] Notified ${sent}/${staffList.length} staff members about new lead: ${lead.name}`);
  } catch (err) {
    console.error("[LeadNotify] Unexpected error in notifyStaffNewLead:", err);
  }
}
