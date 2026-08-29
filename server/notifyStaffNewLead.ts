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
import { normalizePhone, sendSms } from "./sms800";
import { getOrCreateConversation, saveMessage } from "./aiSms";
import * as schema from "../drizzle/schema";
import { sql } from "drizzle-orm";

export interface NewLeadInfo {
  name: string;
  phone?: string;
  program?: string;
  source?: string;
}

export interface StaffLeadNotificationResult {
  recipients: number;
  sent: number;
  failed: number;
  errors: string[];
}

const CANONICAL_LEAD_ALERT_NAMES: Record<string, string> = {
  "+12818189288": "Master Vincent Holmes",
  "+17034997761": "Sensei Kamil Ahmed",
  "+18187454612": "Sensei Hector Diosdado",
  "+12406011818": "Sensei Dominique Griggs",
};

function getLeadAlertRecipientName(staff: { name: string | null; email: string | null; phone?: string | null }) {
  const normalizedPhone = staff.phone ? normalizePhone(staff.phone) : "";
  if (CANONICAL_LEAD_ALERT_NAMES[normalizedPhone]) return CANONICAL_LEAD_ALERT_NAMES[normalizedPhone];
  if (staff.email?.toLowerCase() === "cloverdojo@gmail.com") return "Sensei Kamil Ahmed";
  return staff.name ?? "Staff";
}

/**
 * Notify all staff/admin members who have a phone + leadSmsNotify=1.
 * Returns an operational summary. Callers can await it without allowing an
 * SMS failure to discard the underlying website form submission.
 */
export async function notifyStaffNewLead(lead: NewLeadInfo): Promise<StaffLeadNotificationResult> {
  try {
    const db = await getDb();
    if (!db) return { recipients: 0, sent: 0, failed: 0, errors: ["Database unavailable"] };

    // Fetch all staff/admin with a phone number and notifications enabled
    const staffList = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        leadSmsNotify: schema.users.leadSmsNotify,
      })
      .from(schema.users)
      .where(sql`${schema.users.role} IN ('staff', 'admin') AND ${schema.users.phone} IS NOT NULL AND ${schema.users.phone} != '' AND ${schema.users.leadSmsNotify} = 1`);

    if (staffList.length === 0) {
      console.log("[LeadNotify] No staff with phone numbers configured — skipping SMS");
      return { recipients: 0, sent: 0, failed: 0, errors: [] };
    }

    // Deduplicate by phone number — only send one SMS per unique phone
    const seenPhones = new Set<string>();
    const uniqueStaff = staffList.filter((s) => {
      if (!s.phone) return false;
      const normalizedPhone = normalizePhone(s.phone);
      if (seenPhones.has(normalizedPhone)) return false;
      seenPhones.add(normalizedPhone);
      return true;
    });
    console.log(`[LeadNotify] Sending to ${uniqueStaff.length} unique phone(s) (${staffList.length} staff records total)`);

    const programLine = lead.program && lead.program !== "Not Sure" ? ` | Program: ${lead.program}` : "";
    const sourceLine = lead.source ? ` | Source: ${lead.source}` : "";
    const phoneLine = lead.phone ? ` | Phone: ${lead.phone}` : "";

    const message =
      `🥋 New Lead: ${lead.name}${phoneLine}${programLine}${sourceLine}\n` +
      `Log in to MyDojo admin to follow up.`;

    const results = await Promise.allSettled(
      uniqueStaff.map(async (staff) => {
        const normalizedPhone = normalizePhone(staff.phone!);
        const recipientName = getLeadAlertRecipientName(staff);
        const result = await sendSms({ to: normalizedPhone, message });

        // Persist every attempted lead alert, including a provider-side failure.
        // This makes staff notification failures visible in the MyDojo SMS history.
        try {
          const conversation = await getOrCreateConversation(normalizedPhone, recipientName);
          await saveMessage(
            conversation.id,
            "outbound",
            "campaign",
            message,
            result.messageId,
            result.success ? "sent" : "failed"
          );
        } catch (auditError) {
          console.error(`[LeadNotify] Could not persist alert audit for ${recipientName}:`, auditError);
        }

        if (result.success) {
          console.log(`[LeadNotify] SMS sent to ${recipientName} (${normalizedPhone})`);
        } else {
          console.warn(`[LeadNotify] SMS failed for ${recipientName}: ${result.error}`);
        }
        return result;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;
    const errors = results.flatMap((result, index) => {
      const recipientName = uniqueStaff[index] ? getLeadAlertRecipientName(uniqueStaff[index]) : "Staff";
      if (result.status === "rejected") return [`${recipientName}: ${String(result.reason)}`];
      return result.value.success ? [] : [`${recipientName}: ${result.value.error ?? "SMS delivery failed"}`];
    });
    console.log(`[LeadNotify] Notified ${sent}/${uniqueStaff.length} unique phone(s) about new lead: ${lead.name}`);
    return { recipients: uniqueStaff.length, sent, failed: uniqueStaff.length - sent, errors };
  } catch (err) {
    console.error("[LeadNotify] Unexpected error in notifyStaffNewLead:", err);
    return { recipients: 0, sent: 0, failed: 0, errors: [err instanceof Error ? err.message : String(err)] };
  }
}
