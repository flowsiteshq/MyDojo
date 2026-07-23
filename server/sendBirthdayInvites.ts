/**
 * One-time script: Send Abraham Palacio's 10th Birthday Party invitations
 * Party: Sunday July 27, 2025, 4:00 PM – 6:00 PM CST
 * Location: MyDojo Martial Arts, 11721 Spring Cypress Rd, Tomball, TX 77377
 * Run: npx tsx server/sendBirthdayInvites.ts
 */

import 'dotenv/config';
import { sendSms, normalizePhone } from './sms800';
import { Resend } from 'resend';

const ECARD_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/Abraham-Birthday-eCard-36Hr3hSeAEozax3zrHUY6R.png';

interface Family {
  name: string;
  phone: string;
  email?: string;
  children?: string;
  isOwner?: boolean;
}

const families: Family[] = [
  { name: 'Christine Correa', phone: '+12817364710', children: 'Lorelai and Andres' },
  { name: 'Denise', phone: '+18324530911', children: 'Ethan' },
  { name: 'Aly Hudson', phone: '+17133596582', email: 'mrs.alyhudson@gmail.com', children: 'Haden' },
  { name: 'Brenda Gálvez', phone: '+18326655442', email: 'galvez503brenda@gmail.com', children: 'Pepe and siblings' },
  { name: 'Daniela Flores', phone: '+18328575061', children: 'Gabriel' },
  { name: 'Stephanie', phone: '+18322944950', children: 'Omar' },
  { name: 'Patricia', phone: '+18322534847', children: 'Matthew' },
  { name: 'Suriema', phone: '+18327163159', children: 'Briseis' },
  { name: 'Ms. Lin', phone: '+12818382293', children: 'Aiden' },
  // Owner
  { name: 'Vincent', phone: '+12818189288', email: 'sensei30002003@gmail.com', isOwner: true },
];

function buildEmailHtml(firstName: string, children?: string): string {
  const childLine = children
    ? `<p style="color:#555;font-size:15px;margin:8px 0;">We'd love to see <strong>${children}</strong> there! 🥋</p>`
    : '';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);">
    <img src="${ECARD_URL}" alt="Abraham's 10th Birthday Party" style="width:100%;display:block;" />
    <div style="padding:30px;text-align:center;">
      <h2 style="color:#c0392b;font-size:22px;margin-bottom:8px;">🎉 You're Invited, ${firstName}!</h2>
      <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 8px;">Abraham Palacio is turning <strong>10</strong> and we're celebrating with a Karate Birthday Bash!</p>
      ${childLine}
      <div style="background:#1a1a1a;color:#fff;border-radius:10px;padding:20px;margin:20px 0;text-align:left;">
        <p style="margin:8px 0;font-size:15px;">📅 <strong>Sunday, July 27th</strong></p>
        <p style="margin:8px 0;font-size:15px;">⏰ <strong>4:00 PM – 6:00 PM</strong></p>
        <p style="margin:8px 0;font-size:15px;">📍 <strong>MyDojo Martial Arts</strong><br>&nbsp;&nbsp;&nbsp;&nbsp;11721 Spring Cypress Rd<br>&nbsp;&nbsp;&nbsp;&nbsp;Tomball, TX 77377</p>
      </div>
      <p style="color:#888;font-size:14px;margin-top:16px;">Questions? Call <strong>(877) 4-MYDOJO</strong></p>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;">
        <p style="color:#aaa;font-size:12px;">MyDojo Martial Arts &amp; Fitness | 11721 Spring Cypress Rd, Tomball TX 77377</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.VITE_EMAIL_FROM || 'MyDojo Martial Arts <noreply@mydojoma.com>';

  console.log("🎂 Sending Abraham's 10th Birthday Party Invitations...\n");

  for (const family of families) {
    const firstName = family.name.split(' ')[0];
    const childrenMsg = family.children ? `\nWe'd love to see ${family.children} there! 🥋` : '';

    const smsText = family.isOwner
      ? `🎉 FYI: Abraham Palacio's 10th Birthday Party is THIS SUNDAY July 27, 4–6 PM at MyDojo Tomball (11721 Spring Cypress Rd). Invites sent to all families! 🥋🎂`
      : `🎉 Hi ${firstName}! You're invited to Abraham Palacio's 10th Birthday Karate Bash! 🥋🎂\n\n📅 Sunday, July 27th\n⏰ 4:00 PM – 6:00 PM\n📍 MyDojo Martial Arts\n11721 Spring Cypress Rd, Tomball TX 77377${childrenMsg}\n\nRSVP: (877) 4-MYDOJO`;

    // Send SMS
    const smsResult = await sendSms({ to: normalizePhone(family.phone), message: smsText });
    if (smsResult.success) {
      console.log(`✅ SMS sent → ${family.name} (${family.phone})`);
    } else {
      console.log(`❌ SMS FAILED → ${family.name}: ${smsResult.error}`);
    }

    // Send email if available
    if (family.email) {
      try {
        const emailResult = await resend.emails.send({
          from: fromEmail,
          to: [family.email],
          subject: "🎉 You're Invited! Abraham's 10th Birthday Karate Bash – Sunday July 27th",
          html: buildEmailHtml(firstName, family.children),
        });
        if (emailResult.error) {
          console.log(`❌ Email FAILED → ${family.name} (${family.email}): ${emailResult.error.message}`);
        } else {
          console.log(`✅ Email sent → ${family.name} (${family.email})`);
        }
      } catch (err: any) {
        console.log(`❌ Email FAILED → ${family.name}: ${err.message}`);
      }
    } else {
      console.log(`ℹ️  No email on file for ${family.name} — SMS only`);
    }

    // Small delay between sends
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n🎉 All invitations sent!');
}

main().catch(console.error);
