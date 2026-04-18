/**
 * notifyStaffNewEnrollment.ts
 *
 * Sends an SMS to every admin/staff user who has a phone number stored
 * and has enrollSmsNotify = 1 (enabled).
 *
 * Called from:
 *  - createEnrollmentCheckout (main enrollment flow)
 *  - familyKickboxingAddOns enrollment
 *  - Any other enrollment completion point
 */
import { getDb } from "./db";
import { sendSms } from "./sms800";
import * as schema from "../drizzle/schema";
import { sql } from "drizzle-orm";

export interface NewEnrollmentInfo {
  studentName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  packageName: string;
  amountCharged: number;
  program?: string;
}

/**
 * Notify all staff/admin members who have a phone + enrollSmsNotify=1.
 * Fires-and-forgets — errors are logged but never thrown.
 */
export async function notifyStaffNewEnrollment(enrollment: NewEnrollmentInfo): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Fetch all staff/admin with a phone number and enrollment notifications enabled
    const staffList = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
        enrollSmsNotify: schema.users.enrollSmsNotify,
      })
      .from(schema.users)
      .where(
        sql`${schema.users.role} IN ('staff', 'admin') AND ${schema.users.phone} IS NOT NULL AND ${schema.users.phone} != '' AND ${schema.users.enrollSmsNotify} = 1`
      );

    if (staffList.length === 0) {
      console.log("[EnrollNotify] No staff with enrollment SMS notifications configured — skipping");
      return;
    }

    const studentLine =
      enrollment.studentName && enrollment.studentName !== enrollment.customerName
        ? `Student: ${enrollment.studentName} | `
        : "";
    const phoneLine = enrollment.customerPhone ? ` | Phone: ${enrollment.customerPhone}` : "";
    const programLine = enrollment.program ? ` | Program: ${enrollment.program}` : "";

    const message =
      `🎉 GREAT JOB TEAM! New enrollment just came in!\n` +
      `${studentLine}Member: ${enrollment.customerName}${phoneLine}\n` +
      `Plan: ${enrollment.packageName} | Paid: $${enrollment.amountCharged.toFixed(2)}${programLine}\n` +
      `Keep up the amazing work — let's keep growing! 💪🥋`;

    const results = await Promise.allSettled(
      staffList.map((staff) =>
        sendSms({ to: staff.phone!, message }).then((res) => {
          if (res.success) {
            console.log(`[EnrollNotify] SMS sent to ${staff.name} (${staff.phone})`);
          } else {
            console.warn(`[EnrollNotify] SMS failed for ${staff.name}: ${res.error}`);
          }
          return res;
        })
      )
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && (r.value as any).success
    ).length;
    console.log(
      `[EnrollNotify] Notified ${sent}/${staffList.length} staff members about new enrollment: ${enrollment.studentName}`
    );
  } catch (err) {
    console.error("[EnrollNotify] Unexpected error in notifyStaffNewEnrollment:", err);
  }
}
