/**
 * Birthday Party Reminder Handler
 * Abraham Palacio's 10th Birthday — Sunday July 26, 4:00–6:00 PM CST
 * Location: MyDojo Martial Arts, 11721 Spring Cypress Rd, Tomball TX 77377
 *
 * Fires 3 times via Heartbeat cron:
 *  1. Friday July 24, 2:00 PM CST (19:00 UTC)  — "Party is this Sunday!"
 *  2. Saturday July 25, 2:00 PM CST (19:00 UTC) — "Party is TOMORROW!"
 *  3. Sunday July 26, 2:00 PM CST (19:00 UTC)   — "Party starts in 2 hours!"
 */

import type { Request, Response } from "express";
import { sendSms, normalizePhone } from "./sms800";
import { Resend } from "resend";
import { ENV } from "./_core/env";

const ECARD_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/Abraham-Birthday-eCard-36Hr3hSeAEozax3zrHUY6R.png";

interface Family {
  name: string;
  phone: string;
  email?: string;
  children?: string;
  isOwner?: boolean;
}

const FAMILIES: Family[] = [
  { name: "Christine Correa", phone: "+12817364710", children: "Lorelai and Andres" },
  { name: "Denise", phone: "+18324530911", children: "Ethan" },
  { name: "Aly Hudson", phone: "+17133596582", email: "mrs.alyhudson@gmail.com", children: "Haden" },
  { name: "Brenda Gálvez", phone: "+18326655442", email: "galvez503brenda@gmail.com", children: "Pepe and siblings" },
  { name: "Daniela Flores", phone: "+18328575061", children: "Gabriel" },
  { name: "Stephanie", phone: "+18322944950", children: "Omar" },
  { name: "Patricia", phone: "+18322534847", children: "Matthew" },
  { name: "Suriema", phone: "+18327163159", children: "Briseis" },
  { name: "Ms. Lin", phone: "+12818382293", children: "Aiden" },
  { name: "Vincent", phone: "+12818189288", email: "sensei30002003@gmail.com", isOwner: true },
];

function getReminderType(): "friday" | "saturday" | "sunday" | null {
  // All times in CST (UTC-5 in July / CDT = UTC-5)
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const utcHour = now.getUTCHours();
  const utcDate = now.getUTCDate();
  const utcMonth = now.getUTCMonth(); // 0-indexed, July = 6

  // July 24 (Friday) at 19:00 UTC = 2:00 PM CST
  if (utcMonth === 6 && utcDate === 24 && utcHour >= 19 && utcHour < 20) return "friday";
  // July 25 (Saturday) at 19:00 UTC = 2:00 PM CST
  if (utcMonth === 6 && utcDate === 25 && utcHour >= 19 && utcHour < 20) return "saturday";
  // July 26 (Sunday) at 19:00 UTC = 2:00 PM CST (2 hours before 4 PM party)
  if (utcMonth === 6 && utcDate === 26 && utcHour >= 19 && utcHour < 20) return "sunday";

  return null;
}

function buildSmsMessage(family: Family, reminderType: "friday" | "saturday" | "sunday"): string {
  const firstName = family.name.split(" ")[0];
  const childLine = family.children ? `\nWe hope to see ${family.children} there! 🥋` : "";

  if (family.isOwner) {
    const dayText = reminderType === "friday" ? "this Sunday" : reminderType === "saturday" ? "TOMORROW" : "TODAY in 2 hours";
    return `🎉 Reminder: Abraham Palacio's 10th Birthday Party is ${dayText} — July 26, 4–6 PM at MyDojo Tomball (11721 Spring Cypress Rd). 🥋🎂`;
  }

  if (reminderType === "friday") {
    return `🎉 Hi ${firstName}! Reminder: Abraham's 10th Birthday Karate Bash is THIS SUNDAY July 26, 4–6 PM at MyDojo Tomball (11721 Spring Cypress Rd).${childLine}\nRSVP: (877) 4-MYDOJO`;
  } else if (reminderType === "saturday") {
    return `🎉 Hi ${firstName}! Don't forget — Abraham's 10th Birthday Karate Bash is TOMORROW Sunday July 26, 4–6 PM at MyDojo Tomball (11721 Spring Cypress Rd).${childLine}\nSee you there! 🥋`;
  } else {
    return `🎉 Hi ${firstName}! Abraham's 10th Birthday Karate Bash starts in 2 HOURS — TODAY 4–6 PM at MyDojo Tomball (11721 Spring Cypress Rd).${childLine}\nWe can't wait to celebrate! 🥋🎂`;
  }
}

function buildEmailHtml(family: Family, reminderType: "friday" | "saturday" | "sunday"): string {
  const firstName = family.name.split(" ")[0];
  const childLine = family.children
    ? `<p style="color:#555;font-size:15px;">We hope to see <strong>${family.children}</strong> there! 🥋</p>`
    : "";

  const subjectLine =
    reminderType === "friday"
      ? "🎉 Reminder: Abraham's Birthday Party is THIS SUNDAY!"
      : reminderType === "saturday"
      ? "🎉 Tomorrow! Abraham's Birthday Karate Bash"
      : "🎉 TODAY in 2 hours! Abraham's Birthday Party";

  const bodyLine =
    reminderType === "friday"
      ? "Just a reminder — the party is <strong>this Sunday</strong>!"
      : reminderType === "saturday"
      ? "The party is <strong>TOMORROW</strong> — don't miss it!"
      : "The party starts in <strong>2 hours</strong> — see you soon!";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);">
    <img src="${ECARD_URL}" alt="Abraham's 10th Birthday Party" style="width:100%;display:block;" />
    <div style="padding:30px;text-align:center;">
      <h2 style="color:#c0392b;font-size:22px;margin-bottom:8px;">🎉 Hi ${firstName}!</h2>
      <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 8px;">${bodyLine}</p>
      ${childLine}
      <div style="background:#1a1a1a;color:#fff;border-radius:10px;padding:20px;margin:20px 0;text-align:left;">
        <p style="margin:8px 0;font-size:15px;">📅 <strong>Sunday, July 26th</strong></p>
        <p style="margin:8px 0;font-size:15px;">⏰ <strong>4:00 PM – 6:00 PM</strong></p>
        <p style="margin:8px 0;font-size:15px;">📍 <strong>MyDojo Martial Arts</strong><br>&nbsp;&nbsp;&nbsp;&nbsp;11721 Spring Cypress Rd<br>&nbsp;&nbsp;&nbsp;&nbsp;Tomball, TX 77377</p>
      </div>
      <p style="color:#888;font-size:14px;">Questions? Call <strong>(877) 4-MYDOJO</strong></p>
    </div>
  </div>
</body>
</html>`;
}

export async function handleBirthdayReminder(req: Request, res: Response) {
  const reminderType = getReminderType();

  if (!reminderType) {
    console.log("[BirthdayReminder] Fired outside expected window — skipping.");
    return res.json({ ok: true, skipped: true, reason: "outside reminder window" });
  }

  console.log(`[BirthdayReminder] Sending ${reminderType} reminders...`);

  const resend = new Resend(ENV.RESEND_API_KEY);
  const fromEmail = ENV.EMAIL_FROM || "MyDojo Martial Arts <noreply@mydojoma.com>";
  const results: { name: string; sms: string; email?: string }[] = [];

  for (const family of FAMILIES) {
    const smsText = buildSmsMessage(family, reminderType);

    // Send SMS
    let smsStatus = "ok";
    try {
      const smsResult = await sendSms({ to: normalizePhone(family.phone), message: smsText });
      if (!smsResult.success) smsStatus = `failed: ${smsResult.error}`;
    } catch (err: any) {
      smsStatus = `error: ${err.message}`;
    }

    // Send email if available
    let emailStatus: string | undefined;
    if (family.email) {
      try {
        const emailSubject =
          reminderType === "friday"
            ? "🎉 Reminder: Abraham's Birthday Party is THIS SUNDAY!"
            : reminderType === "saturday"
            ? "🎉 Tomorrow! Abraham's 10th Birthday Karate Bash"
            : "🎉 TODAY in 2 hours! Abraham's Birthday Party";

        const emailResult = await resend.emails.send({
          from: fromEmail,
          to: [family.email],
          subject: emailSubject,
          html: buildEmailHtml(family, reminderType),
        });
        emailStatus = emailResult.error ? `failed: ${emailResult.error.message}` : "ok";
      } catch (err: any) {
        emailStatus = `error: ${err.message}`;
      }
    }

    results.push({ name: family.name, sms: smsStatus, email: emailStatus });
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("[BirthdayReminder] Done:", JSON.stringify(results));
  return res.json({ ok: true, reminderType, results });
}
