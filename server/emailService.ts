import { Resend } from "resend";
import { ENV } from "./_core/env";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(ENV.RESEND_API_KEY);
  }
  return resendClient;
}

export interface StreakMilestoneEmailParams {
  toEmail: string;
  toName: string;
  streak: number;
  program: string;
  beltRank?: string;
}

const MILESTONE_MESSAGES: Record<number, { subject: string; headline: string; body: string; emoji: string }> = {
  5: {
    emoji: "🔥",
    subject: "You're on a 5-class streak at MyDojo!",
    headline: "5 Classes Strong!",
    body: "You've attended 5 classes in a row — that's real dedication! The first few weeks are the hardest, and you're crushing it. Keep showing up and watch yourself transform.",
  },
  10: {
    emoji: "⚡",
    subject: "10-class streak — you're unstoppable!",
    headline: "10 Classes — You're Unstoppable!",
    body: "Double digits! A 10-class streak means you've built a real habit. Your consistency is showing on the mat, and your instructors have noticed. Keep that energy going!",
  },
  25: {
    emoji: "🥋",
    subject: "25-class streak — you're a true martial artist!",
    headline: "25 Classes — True Martial Artist!",
    body: "25 classes in a row is no small feat. You've shown the discipline and dedication that separates those who dream from those who achieve. You're becoming the student every instructor loves to teach.",
  },
  50: {
    emoji: "🏆",
    subject: "50-class streak — LEGEND STATUS at MyDojo!",
    headline: "50 Classes — Legend Status!",
    body: "FIFTY consecutive classes. You are a legend. The mat is your second home, and your progress is inspiring everyone around you. This is what mastery looks like — one class at a time.",
  },
  100: {
    emoji: "🌟",
    subject: "100-class streak — you've reached the top of the mountain!",
    headline: "100 Classes — The Summit!",
    body: "One hundred consecutive classes. This is extraordinary. You have demonstrated the kind of commitment that black belts are made of. Whatever your goal is, you are well on your way to achieving it. We are honoured to be part of your journey.",
  },
};

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/FULLLOGOBLACK_ccaa34bf.png";
const BOOK_CLASS_URL = "https://mydojoma.com/schedule";

function buildMilestoneEmail(params: StreakMilestoneEmailParams): string {
  const msg = MILESTONE_MESSAGES[params.streak] ?? {
    emoji: "🔥",
    headline: `${params.streak}-Class Streak!`,
    body: `You've reached a ${params.streak}-class streak at MyDojo. Your dedication is truly inspiring — keep it up!`,
    subject: `You've hit a ${params.streak}-class streak at MyDojo!`,
  };

  const beltLine = params.beltRank && params.beltRank !== 'No Belt'
    ? `<p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Current Belt: <strong style="color:#374151;">${params.beltRank}</strong></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${msg.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;">

          <!-- Logo bar -->
          <tr>
            <td style="background:#ffffff;padding:24px 40px 16px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <img src="${LOGO_URL}" alt="MyDojo Martial Arts" width="180" style="display:block;margin:0 auto;height:auto;" />
            </td>
          </tr>

          <!-- Red header -->
          <tr>
            <td style="background:#dc2626;padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:52px;line-height:1;">${msg.emoji}</p>
              <h1 style="margin:14px 0 0;color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">${msg.headline}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;text-transform:uppercase;letter-spacing:2px;">${params.program}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 24px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">
                Hi <strong>${params.toName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.7;">
                ${msg.body}
              </p>

              <!-- Streak + belt badge row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Streak tile -->
                        <td style="padding:0 8px 0 0;">
                          <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:20px 32px;text-align:center;min-width:120px;">
                            <p style="margin:0;font-size:11px;color:#92400e;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Streak</p>
                            <p style="margin:6px 0 2px;font-size:52px;font-weight:900;color:#b45309;line-height:1;">${params.streak}</p>
                            <p style="margin:0;font-size:12px;color:#92400e;">classes in a row</p>
                          </div>
                        </td>
                        <!-- Belt tile (only if belt rank is set) -->
                        ${params.beltRank && params.beltRank !== 'No Belt' ? `
                        <td style="padding:0 0 0 8px;">
                          <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px 32px;text-align:center;min-width:120px;">
                            <p style="margin:0;font-size:11px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Belt Rank</p>
                            <p style="margin:6px 0 2px;font-size:18px;font-weight:800;color:#15803d;line-height:1.2;">${params.beltRank}</p>
                            <p style="margin:0;font-size:12px;color:#166534;">current rank</p>
                          </div>
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${BOOK_CLASS_URL}"
                       style="display:inline-block;background:#dc2626;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.5px;">
                      Book Your Next Class &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">
                See you on the mat,<br/>
                <strong>The MyDojo Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                MyDojo Martial Arts &amp; Fitness &middot; Tomball, TX<br/>
                You're receiving this because you're an active member.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a streak milestone congratulation email to a student.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendStreakMilestoneEmail(params: StreakMilestoneEmailParams): Promise<boolean> {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping milestone email");
    return false;
  }

  const msg = MILESTONE_MESSAGES[params.streak] ?? {
    subject: `You've hit a ${params.streak}-class streak at MyDojo!`,
  };

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject: msg.subject,
      html: buildMilestoneEmail(params),
    });

    if (error) {
      console.error("[Email] Resend error sending milestone email:", error);
      return false;
    }

    console.log(`[Email] Streak milestone email sent to ${params.toEmail} (streak: ${params.streak})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send milestone email:", err);
    return false;
  }
}

/** The streak values that trigger a milestone notification */
export const STREAK_MILESTONES = [5, 10, 25, 50, 100];

/**
 * Check if a streak value just crossed a milestone boundary.
 * Returns the milestone number if crossed, null otherwise.
 */
export function checkStreakMilestone(previousStreak: number, newStreak: number): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (previousStreak < milestone && newStreak >= milestone) {
      return milestone;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Enrollment Confirmation Email
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrollmentConfirmationParams {
  toEmail: string;
  customerName: string;
  studentName: string;
  packageName: string;
  monthlyPrice?: number | null;
  enrollmentFee?: number | null;
  totalDueToday: number;
  nextBillingDate?: string | null;
  isSummerCamp?: boolean;
  summerCampWeek?: string | null;
  transactionId?: string | null;
  waiverReason?: string;
}

function buildEnrollmentConfirmationHtml(p: EnrollmentConfirmationParams): string {
  const greeting =
    p.studentName && p.studentName !== p.customerName
      ? `Hi ${p.customerName},<br/>We&#39;re thrilled to welcome <strong>${p.studentName}</strong> to the MyDojo family!`
      : `Hi ${p.customerName},<br/>Welcome to the MyDojo family!`;

  const monthlyRow = !p.isSummerCamp
    ? `<tr>
        <td style="padding:8px 0;color:#374151;font-size:15px;">First month &#8212; ${p.packageName}</td>
        <td style="padding:8px 0;color:#374151;font-size:15px;text-align:right;">$${(p.monthlyPrice ?? 0).toFixed(2)}</td>
       </tr>`
    : `<tr>
        <td style="padding:8px 0;color:#374151;font-size:15px;">Summer Camp &#8212; ${p.summerCampWeek ?? "Registration"}</td>
        <td style="padding:8px 0;color:#374151;font-size:15px;text-align:right;">$199.00</td>
       </tr>`;

  const feeWaived = p.waiverReason !== undefined;
  const feeRow = `<tr>
    <td style="padding:8px 0;color:#374151;font-size:15px;">
      One-time enrollment fee
      ${feeWaived ? `<span style="margin-left:8px;font-size:11px;font-weight:700;color:#16a34a;background:#dcfce7;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:0.05em;">WAIVED${p.waiverReason ? ' &mdash; ' + p.waiverReason : ''}</span>` : ''}
    </td>
    <td style="padding:8px 0;font-size:15px;text-align:right;${feeWaived ? 'color:#16a34a;text-decoration:line-through;' : 'color:#374151;'}">
      $${feeWaived ? (99).toFixed(2) : (p.enrollmentFee ?? 99).toFixed(2)}
    </td>
  </tr>
  ${feeWaived ? `<tr><td colspan="2" style="padding:0 0 8px;font-size:13px;color:#16a34a;">&#10003; Enrollment fee waived &mdash; $0.00 charged</td></tr>` : ''}`;

  const totalRow = `<tr style="border-top:2px solid #e5e7eb;">
    <td style="padding:12px 0 8px;font-size:16px;font-weight:700;color:#111827;">Total charged today</td>
    <td style="padding:12px 0 8px;font-size:16px;font-weight:700;color:#dc2626;text-align:right;">$${p.totalDueToday.toFixed(2)}</td>
  </tr>`;

  const recurringNote =
    !p.isSummerCamp && p.monthlyPrice && p.nextBillingDate
      ? `<p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Your next monthly charge of <strong>$${p.monthlyPrice.toFixed(2)}</strong> will be billed on <strong>${p.nextBillingDate}</strong> and monthly thereafter.</p>`
      : "";

  const txNote = p.transactionId
    ? `<p style="margin:0 0 24px;font-size:13px;color:#9ca3af;">Transaction ID: ${p.transactionId}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to MyDojo!</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:#dc2626;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">MYDOJO</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fecaca;letter-spacing:1px;text-transform:uppercase;">Martial Arts &amp; Fitness</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 20px;font-size:17px;color:#111827;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.7;">Your enrollment in <strong>${p.packageName}</strong> is confirmed. Here is a summary of your payment:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 28px;">
      <tr style="background:#f9fafb;">
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Description</td>
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;text-align:right;">Amount</td>
      </tr>
      <tr style="border-top:1px solid #e5e7eb;"><td colspan="2" style="padding:0 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${monthlyRow}
          ${feeRow}
          ${totalRow}
        </table>
      </td></tr>
    </table>
    ${recurringNote}
    ${txNote}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr><td align="center">
        <a href="https://www.mydojoma.com" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.5px;">Visit MyDojo &#8594;</a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">We can&#39;t wait to see you on the mat!<br/><strong>The MyDojo Team</strong></p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">MyDojo Martial Arts &amp; Fitness &#183; Tomball, TX<br/>Questions? Call us at (877) 4-MYDOJO</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Send an enrollment confirmation email to a new member.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendEnrollmentConfirmationEmail(
  params: EnrollmentConfirmationParams
): Promise<boolean> {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping enrollment confirmation email");
    return false;
  }
  try {
    const resend = getResend();
    const subject = params.isSummerCamp
      ? "Summer Camp Registration Confirmed — MyDojo"
      : `Welcome to MyDojo! Your ${params.packageName} enrollment is confirmed`;
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject,
      html: buildEnrollmentConfirmationHtml(params),
    });
    if (error) {
      console.error("[Email] Resend error sending enrollment confirmation:", error);
      return false;
    }
    console.log(`[Email] Enrollment confirmation sent to ${params.toEmail} (package: ${params.packageName})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send enrollment confirmation:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Renewal Success Email
// ─────────────────────────────────────────────────────────────────────────────

export interface RenewalSuccessParams {
  toEmail: string;
  customerName: string;
  studentName: string;
  packageName: string;
  amountCharged: number;
  transactionId?: string | null;
  /** Date the payment was processed (defaults to now if omitted) */
  paymentDate?: Date | null;
}

function buildRenewalSuccessHtml(p: RenewalSuccessParams): string {
  const paymentDateStr = p.paymentDate
    ? p.paymentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Chicago",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Chicago",
      });

  const txNote = p.transactionId
    ? `<tr><td style="padding:10px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Transaction ID</td><td style="padding:10px 0;color:#9ca3af;font-size:13px;text-align:right;">${p.transactionId}</td></tr>`
    : "";

  const greeting =
    p.studentName && p.studentName !== p.customerName
      ? `Hi ${p.customerName}, this is a receipt for <strong>${p.studentName}</strong>&#39;s monthly membership payment.`
      : `Hi ${p.customerName}, this is a receipt for your monthly membership payment.`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Receipt — MyDojo</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#15803d 0%,#16a34a 100%);padding:36px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:3px;text-transform:uppercase;">MYDOJO</p>
    <p style="margin:0;font-size:12px;color:#bbf7d0;letter-spacing:2px;text-transform:uppercase;">Payment Receipt</p>
  </td></tr>

  <!-- Checkmark banner -->
  <tr><td style="background:#f0fdf4;border-bottom:1px solid #dcfce7;padding:20px 40px;text-align:center;">
    <p style="margin:0;font-size:22px;font-weight:800;color:#15803d;">&#10003; Payment Confirmed</p>
    <p style="margin:4px 0 0;font-size:14px;color:#4ade80;">${paymentDateStr}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 40px 28px;">
    <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.7;">${greeting}</p>

    <!-- Receipt table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:0 0 28px;">
      <tr style="background:#f9fafb;">
        <td colspan="2" style="padding:12px 20px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Receipt Details</td>
      </tr>
      <tr style="border-top:1px solid #e5e7eb;">
        <td style="padding:14px 20px;color:#374151;font-size:15px;">Monthly membership &mdash; ${p.packageName}</td>
        <td style="padding:14px 20px;color:#374151;font-size:15px;text-align:right;font-weight:600;">$${p.amountCharged.toFixed(2)}</td>
      </tr>
      <tr style="border-top:2px solid #e5e7eb;background:#f9fafb;">
        <td style="padding:14px 20px;font-size:16px;font-weight:700;color:#111827;">Total Charged</td>
        <td style="padding:14px 20px;font-size:16px;font-weight:800;color:#16a34a;text-align:right;">$${p.amountCharged.toFixed(2)}</td>
      </tr>
      ${txNote}
    </table>

    <!-- Portal link -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:10px;margin:0 0 28px;">
      <tr><td style="padding:18px 24px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">View Payment History</p>
        <p style="margin:0 0 14px;font-size:14px;color:#1e40af;line-height:1.6;">You can view all your past payments anytime in your student portal.</p>
        <a href="https://www.mydojoma.com/member-dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">View My Portal &rarr;</a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">Thank you for being part of the MyDojo family. See you on the mat!<br/><br/><strong>The MyDojo Team</strong></p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.8;">MyDojo Martial Arts &amp; Fitness &bull; Tomball, TX<br/>Questions? Call us at (877) 4-MYDOJO &bull; <a href="https://www.mydojoma.com" style="color:#16a34a;text-decoration:none;">www.mydojoma.com</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Send a monthly renewal receipt email.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendRenewalSuccessEmail(
  params: RenewalSuccessParams
): Promise<boolean> {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping renewal receipt email");
    return false;
  }
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject: `Payment received — MyDojo ${params.packageName}`,
      html: buildRenewalSuccessHtml(params),
    });
    if (error) {
      console.error("[Email] Resend error sending renewal receipt:", error);
      return false;
    }
    console.log(`[Email] Renewal receipt sent to ${params.toEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send renewal receipt:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Failure (Dunning) Email
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentFailureParams {
  toEmail: string;
  customerName: string;
  studentName: string;
  amountFailed: number;
  failureReason: string;
  retryCount: number;
}

function buildPaymentFailureHtml(p: PaymentFailureParams): string {
  const retryNote =
    p.retryCount === 0
      ? "Fluid Pay will automatically retry your payment. Please ensure your card details are up to date."
      : `This is retry attempt ${p.retryCount}. Please update your payment method to avoid service interruption.`;

  const greeting =
    p.studentName && p.studentName !== p.customerName
      ? `Hi ${p.customerName},<br/>We were unable to process the monthly membership payment for <strong>${p.studentName}</strong>.`
      : `Hi ${p.customerName},<br/>We were unable to process your monthly membership payment.`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Issue — MyDojo</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:#dc2626;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">MYDOJO</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fecaca;letter-spacing:1px;text-transform:uppercase;">Action Required — Payment Issue</p>
  </td></tr>
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 20px;font-size:17px;color:#111827;line-height:1.6;">${greeting}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fecaca;border-radius:8px;background:#fff5f5;margin:0 0 28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.8px;">Payment Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#6b7280;">Amount</td>
            <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">$${p.amountFailed.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#6b7280;">Reason</td>
            <td style="padding:6px 0;font-size:14px;color:#dc2626;font-weight:600;text-align:right;">${p.failureReason}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">${retryNote}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
      To update your payment method or resolve this issue, please contact us directly or call <strong>(877) 4-MYDOJO</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr><td align="center">
        <a href="https://www.mydojoma.com/contact" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.5px;">Contact Us &#8594;</a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">We value your membership and want to help resolve this quickly.<br/><strong>The MyDojo Team</strong></p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">MyDojo Martial Arts &amp; Fitness &#183; Tomball, TX<br/>Questions? Call us at (877) 4-MYDOJO</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Send a payment failure dunning email.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendPaymentFailureEmail(
  params: PaymentFailureParams
): Promise<boolean> {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping payment failure email");
    return false;
  }
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject: "Action required: Payment issue with your MyDojo membership",
      html: buildPaymentFailureHtml(params),
    });
    if (error) {
      console.error("[Email] Resend error sending payment failure email:", error);
      return false;
    }
    console.log(`[Email] Payment failure email sent to ${params.toEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send payment failure email:", err);
    return false;
  }
}

// ─── Cancellation Confirmation Email ──────────────────────────────────────────

interface CancellationConfirmationParams {
  toEmail: string;
  customerName: string;
  finalBillingDate: string;
  reason?: string;
}

function buildCancellationConfirmationHtml(params: CancellationConfirmationParams): string {
  const { customerName, finalBillingDate, reason } = params;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cancellation Request Received</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111111;padding:28px 40px;text-align:center;">
            <span style="color:#e11d48;font-size:28px;font-weight:900;letter-spacing:2px;">MYDOJO</span>
            <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;letter-spacing:1px;">MARTIAL ARTS &amp; FITNESS</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111;">Cancellation Request Received</h2>
            <p style="color:#4b5563;margin:0 0 24px;">Hi ${customerName},</p>
            <p style="color:#4b5563;margin:0 0 16px;">
              We've received your request to cancel your MyDojo membership. We're sorry to see you go!
            </p>
            <p style="color:#4b5563;margin:0 0 24px;">
              As outlined in your membership agreement, a <strong>30-day notice period</strong> is required.
              Your membership will remain active and <strong>one final monthly payment</strong> will be
              processed on the date below.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Final Billing Date</p>
                  <p style="margin:0;font-size:20px;font-weight:700;color:#e11d48;">${finalBillingDate}</p>
                  <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">No further charges will be made after this date.</p>
                </td>
              </tr>
            </table>
            ${reason ? `<p style="color:#4b5563;margin:0 0 16px;"><strong>Reason provided:</strong> ${reason}</p>` : ''}
            <p style="color:#4b5563;margin:0 0 16px;">
              You are welcome to continue attending classes until your membership ends. If you change your
              mind, please contact us at
              <a href="mailto:info@mydojoma.com" style="color:#e11d48;">info@mydojoma.com</a> or
              call <strong>(877) 4-MYDOJO</strong>.
            </p>
            <p style="color:#4b5563;margin:0 0 4px;">Thank you for being part of the MyDojo family.</p>
            <p style="color:#4b5563;margin:0;">We hope to see you back on the mat someday!</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              MyDojo Martial Arts &amp; Fitness &bull; (877) 4-MYDOJO &bull;
              <a href="mailto:info@mydojoma.com" style="color:#e11d48;">info@mydojoma.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendCancellationConfirmationEmail(params: CancellationConfirmationParams): Promise<boolean> {
  if (!params.toEmail) return false;
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject: "Your MyDojo Cancellation Request Has Been Received",
      html: buildCancellationConfirmationHtml(params),
    });
    if (error) {
      console.error("[Email] Resend error sending cancellation confirmation:", error);
      return false;
    }
    console.log(`[Email] Cancellation confirmation sent to ${params.toEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send cancellation confirmation:", err);
    return false;
  }
}

// ─── Belt Ready Notification ──────────────────────────────────────────────────

export interface BeltReadyEmailParams {
  to: string;
  studentName: string;
  currentBelt: string;
  nextBelt: string;
}

function beltColor(belt: string): string {
  const map: Record<string, string> = {
    'No Belt':            '#6b7280',
    'White Belt':         '#d1d5db',
    'Yellow Belt':        '#fbbf24',
    'Orange Belt':        '#f97316',
    'Green Belt':         '#22c55e',
    'Advanced Green':     '#16a34a',
    'Blue Belt':          '#3b82f6',
    'Advanced Blue':      '#1d4ed8',
    'Purple Belt':        '#a855f7',
    'Advanced Purple':    '#7e22ce',
    'Brown Belt':         '#92400e',
    'Advanced Brown':     '#78350f',
    'Probationary Black': '#1f2937',
    'Black Belt 1st Dan': '#111827',
  };
  return map[belt] ?? '#dc2626';
}

function buildBeltReadyHtml(params: BeltReadyEmailParams): string {
  const { studentName, currentBelt, nextBelt } = params;
  const nextColor = beltColor(nextBelt);
  const isNoBelt = currentBelt === 'No Belt';
  const headline = isNoBelt
    ? `Welcome to the mat, ${studentName}!`
    : `Great news, ${studentName}!`;
  const subline = isNoBelt
    ? `You completed your first class at MyDojo. Your <strong>White Belt</strong> will be awarded during your next class!`
    : `You've met the attendance requirement to receive your <strong style="color:${nextColor}">${nextBelt}</strong>. Your instructor will present it to you during your next class!`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;">
        <tr>
          <td style="background:#111827;padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:2px;color:#ffffff;">MY<span style="color:#dc2626;">DOJO</span></div>
            <div style="color:#9ca3af;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Belt Achievement Notification</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="display:inline-block;background:${nextColor};width:80px;height:14px;border-radius:7px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.15);"></div>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#111827;">${headline}</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:1.6;">${subline}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:8px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Current Belt</td>
                      <td style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;text-align:right;">Next Belt</td>
                    </tr>
                    <tr>
                      <td style="font-size:18px;font-weight:700;color:#111827;">${currentBelt}</td>
                      <td style="font-size:18px;font-weight:700;color:${nextColor};text-align:right;">${nextBelt} 🎉</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
              Keep up the amazing work! Consistent attendance is the key to mastery.
              See you on the mat — your instructor is looking forward to recognizing your achievement.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">MyDojo Martial Arts &amp; Fitness &middot; <a href="https://www.mydojoma.com" style="color:#dc2626;text-decoration:none;">mydojoma.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendBeltReadyEmail(params: BeltReadyEmailParams): Promise<boolean> {
  if (!params.to) return false;
  try {
    const resend = getResend();
    const isNoBelt = params.currentBelt === 'No Belt';
    const subject = isNoBelt
      ? `🥋 Welcome to MyDojo — Your White Belt Awaits!`
      : `🎉 Belt Achievement Unlocked — Your ${params.nextBelt} is Ready!`;
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.to,
      subject,
      html: buildBeltReadyHtml(params),
    });
    if (error) {
      console.error('[Email] Resend error sending belt-ready email:', error);
      return false;
    }
    console.log(`[Email] Belt-ready email sent to ${params.to} (${params.currentBelt} → ${params.nextBelt})`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send belt-ready email:', err);
    return false;
  }
}

// ─── Belt Exam Eligibility Notification (Orange Belt → Green Belt) ────────────

export interface BeltExamEligibleEmailParams {
  /** Recipient email address */
  to: string;
  /** Student's name (used in greeting) */
  studentName: string;
  /** The belt the student currently holds (e.g. "Orange Belt") */
  currentBelt: string;
  /** The belt they are testing for (e.g. "Green Belt") */
  examBelt: string;
  /** Exam fee in dollars (e.g. 49) */
  examFeeDollars: number;
  /** Direct Stripe Checkout URL for paying the exam fee */
  checkoutUrl: string;
}

function buildBeltExamEligibleHtml(p: BeltExamEligibleEmailParams): string {
  const { studentName, currentBelt, examBelt, examFeeDollars, checkoutUrl } = p;

  // Belt color map
  const beltColorMap: Record<string, string> = {
    'Orange Belt':        '#f97316',
    'Green Belt':         '#22c55e',
    'Advanced Green':     '#16a34a',
    'Blue Belt':          '#3b82f6',
    'Advanced Blue':      '#1d4ed8',
    'Purple Belt':        '#a855f7',
    'Advanced Purple':    '#7e22ce',
    'Brown Belt':         '#92400e',
    'Advanced Brown':     '#78350f',
    'Probationary Black': '#1f2937',
    'Black Belt 1st Dan': '#111827',
  };
  const currentColor = beltColorMap[currentBelt] ?? '#f97316';
  const examColor    = beltColorMap[examBelt]    ?? '#22c55e';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've Earned Your ${examBelt} Exam!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;">

          <!-- Logo bar -->
          <tr>
            <td style="background:#ffffff;padding:24px 40px 16px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <img src="${LOGO_URL}" alt="MyDojo Martial Arts" width="180" style="display:block;margin:0 auto;height:auto;" />
            </td>
          </tr>

          <!-- Hero header -->
          <tr>
            <td style="background:#111827;padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 12px;font-size:56px;line-height:1;">🥋</p>
              <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px;line-height:1.2;">
                Belt Exam Unlocked!
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.75);font-size:14px;text-transform:uppercase;letter-spacing:2px;">
                You've earned the right to test for your ${examBelt}
              </p>
            </td>
          </tr>

          <!-- Belt transition visual -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <!-- Current belt pill -->
                  <td style="padding:0 12px 0 0;">
                    <div style="background:${currentColor};border-radius:999px;padding:10px 22px;display:inline-block;">
                      <span style="color:#ffffff;font-size:14px;font-weight:700;">${currentBelt}</span>
                    </div>
                  </td>
                  <!-- Arrow -->
                  <td style="padding:0 12px 0 0;vertical-align:middle;">
                    <span style="font-size:22px;color:#9ca3af;">&#8594;</span>
                  </td>
                  <!-- Exam belt pill (highlighted) -->
                  <td>
                    <div style="background:${examColor};border-radius:999px;padding:10px 22px;display:inline-block;box-shadow:0 0 0 3px rgba(34,197,94,0.25);">
                      <span style="color:#ffffff;font-size:14px;font-weight:700;">${examBelt} 🎉</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body copy -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
                Hi <strong>${studentName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
                Congratulations — you've completed all the required stripe phases on your <strong style="color:${currentColor};">${currentBelt}</strong>! That takes real dedication and consistency, and your instructors are proud of your progress.
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.7;">
                You are now eligible to test for your <strong style="color:${examColor};">${examBelt}</strong>. To register, simply pay the <strong>$${examFeeDollars} exam fee</strong> using the button below. Once payment is confirmed, your instructor will schedule your evaluation.
              </p>
            </td>
          </tr>

          <!-- What to expect box -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:1px;">What to Expect</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:28px;font-size:16px;">✅</td>
                        <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">A one-on-one evaluation with your instructor</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;font-size:16px;">✅</td>
                        <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">Demonstration of your current belt's required techniques</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;font-size:16px;">✅</td>
                        <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">Belt certificate presented at a class ceremony</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;font-size:16px;">💰</td>
                        <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">One-time exam fee: <strong>$${examFeeDollars}</strong></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding:0 40px 36px;text-align:center;">
              <a href="${checkoutUrl}"
                 style="display:inline-block;background:#22c55e;color:#ffffff;font-size:17px;font-weight:800;text-decoration:none;padding:18px 48px;border-radius:8px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(34,197,94,0.35);">
                Pay $${examFeeDollars} Exam Fee &rarr;
              </a>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
                Secure payment via Stripe &middot; Takes less than 2 minutes
              </p>
            </td>
          </tr>

          <!-- Questions row -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;text-align:center;">
                Questions? Reply to this email or call us at <strong>(877) 4-MYDOJO</strong>.<br />
                We can't wait to see you earn that ${examBelt}!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                MyDojo Martial Arts &amp; Fitness &middot;
                <a href="https://www.mydojoma.com" style="color:#dc2626;text-decoration:none;">mydojoma.com</a>
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
                You received this email because you are an active MyDojo member.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends the belt exam eligibility notification email.
 * Called automatically when a student completes all stripe phases on an exam belt (e.g. Orange Belt).
 * Includes a direct Stripe Checkout payment link for the $49 exam fee.
 */
export async function sendBeltExamEligibleEmail(params: BeltExamEligibleEmailParams): Promise<boolean> {
  if (!params.to) return false;
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.to,
      subject: `🥋 You've Earned Your ${params.examBelt} Exam — Register Now!`,
      html: buildBeltExamEligibleHtml(params),
    });
    if (error) {
      console.error('[Email] Resend error sending belt exam eligible email:', error);
      return false;
    }
    console.log(`[Email] Belt exam eligible email sent to ${params.to} (${params.currentBelt} → ${params.examBelt})`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send belt exam eligible email:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Belt Exam Paid — Instructor / Admin Notification Email
// ─────────────────────────────────────────────────────────────────────────────

export interface BeltExamPaidInstructorEmailParams {
  studentName: string;
  beltRank: string;       // the belt the student is currently on (e.g. "Orange Belt")
  customerEmail: string;  // student's email for reference
  enrollmentId: number;
  amountPaid: number;     // in dollars
}

function buildBeltExamPaidInstructorHtml(params: BeltExamPaidInstructorEmailParams): string {
  const { studentName, beltRank, customerEmail, enrollmentId, amountPaid } = params;
  const adminUrl = `https://www.mydojoma.com/admin/students`;
  const paidAt = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'short' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Belt Exam Fee Paid</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:28px 40px;text-align:center;">
              <p style="margin:0;color:#e11d48;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">MyDojo Instructor Alert</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                🥋 Belt Exam Fee Paid
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                A student has completed payment for their belt examination. Please schedule their evaluation at your earliest convenience.
              </p>

              <!-- Student Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:140px;">Student</td>
                        <td style="padding:6px 0;color:#111827;font-size:15px;font-weight:700;">${studentName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</td>
                        <td style="padding:6px 0;color:#374151;font-size:15px;">${customerEmail || '—'}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Current Belt</td>
                        <td style="padding:6px 0;">
                          <span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:700;">${beltRank}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Amount Paid</td>
                        <td style="padding:6px 0;color:#059669;font-size:15px;font-weight:700;">$${amountPaid.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Paid At</td>
                        <td style="padding:6px 0;color:#374151;font-size:14px;">${paidAt} (CT)</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Enrollment ID</td>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">#${enrollmentId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;color:#1e40af;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Next Steps</p>
                    <ol style="margin:0;padding-left:18px;color:#1e3a8a;font-size:14px;line-height:1.8;">
                      <li>Contact <strong>${studentName}</strong> to schedule their belt evaluation.</li>
                      <li>Confirm they have completed all required stripe phases.</li>
                      <li>Conduct the evaluation and award the belt upon passing.</li>
                      <li>Use the <strong>Promote Belt</strong> button in the admin panel to advance their rank.</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.5px;">
                      View Student in Admin Panel →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                This is an automated notification from the MyDojo management system.<br />
                <a href="https://www.mydojoma.com" style="color:#e11d48;text-decoration:none;">www.mydojoma.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a belt exam fee paid notification to the instructor / admin.
 * Sends to the EMAIL_FROM address (the dojo's own email) so it lands in the instructor's inbox.
 */
export async function sendBeltExamPaidInstructorEmail(
  params: BeltExamPaidInstructorEmailParams
): Promise<boolean> {
  try {
    const resend = getResend();
    const instructorEmail = process.env.INSTRUCTOR_NOTIFY_EMAIL || ENV.EMAIL_FROM;
    const { error } = await resend.emails.send({
      from: `MyDojo System <${ENV.EMAIL_FROM}>`,
      to: instructorEmail,
      subject: `🥋 Belt Exam Fee Paid — ${params.studentName} (${params.beltRank})`,
      html: buildBeltExamPaidInstructorHtml(params),
    });
    if (error) {
      console.error('[Email] Resend error sending instructor belt exam notification:', error);
      return false;
    }
    console.log(`[Email] Instructor belt exam notification sent for ${params.studentName}`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send instructor belt exam notification:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Intro Offer Welcome Email
// ─────────────────────────────────────────────────────────────────────────────

export interface IntroOfferWelcomeEmailParams {
  toEmail: string;
  customerName: string;
  program: string;
  amountPaid: number;
  isSummerCamp?: boolean;
}

function buildIntroOfferWelcomeHtml(p: IntroOfferWelcomeEmailParams): string {
  const isSummerCamp = p.isSummerCamp || p.program.toLowerCase().includes("summer camp");

  const scheduleSection = isSummerCamp
    ? `
      <tr>
        <td style="padding:0 0 24px;">
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">Summer Camp Details</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:8px;border:1px solid #f59e0b;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:14px;color:#92400e;font-weight:700;">3-Day Martial Arts Camp</p>
                <p style="margin:0 0 4px;font-size:13px;color:#78350f;">Ages 5–14 &middot; All skill levels welcome</p>
                <p style="margin:0;font-size:13px;color:#78350f;">Our team will contact you within 24 hours to confirm your camp dates and schedule.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : `
      <tr>
        <td style="padding:0 0 24px;">
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">Class Schedule</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:700;">Monday, Wednesday, Friday</p>
                <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Morning classes: 9:00 AM – 10:00 AM</p>
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Evening classes: 6:00 PM – 7:00 PM</p>
                <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:700;">Saturday</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">10:00 AM – 11:30 AM (All levels)</p>
              </td>
            </tr>
          </table>
          <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Our team will reach out within 24 hours to confirm your first class time.</p>
        </td>
      </tr>`;

  const whatToBringSection = isSummerCamp
    ? `
      <tr>
        <td style="padding:0 0 24px;">
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">What to Bring</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${["Comfortable athletic clothing", "Water bottle", "Snacks for breaks", "Positive attitude and energy!"].map((item) => `
            <tr>
              <td style="padding:6px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:24px;vertical-align:top;">
                      <div style="width:20px;height:20px;background:#dc2626;border-radius:50%;text-align:center;line-height:20px;">
                        <span style="color:#fff;font-size:11px;font-weight:700;">&#10003;</span>
                      </div>
                    </td>
                    <td style="padding-left:8px;font-size:14px;color:#374151;">${item}</td>
                  </tr>
                </table>
              </td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>`
    : `
      <tr>
        <td style="padding:0 0 24px;">
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">What to Bring</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${["Comfortable athletic clothing (we provide your uniform!)", "Water bottle", "Athletic shoes or bare feet on the mat", "Positive attitude — we'll handle the rest!"].map((item) => `
            <tr>
              <td style="padding:6px 0;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:24px;vertical-align:top;">
                      <div style="width:20px;height:20px;background:#dc2626;border-radius:50%;text-align:center;line-height:20px;">
                        <span style="color:#fff;font-size:11px;font-weight:700;">&#10003;</span>
                      </div>
                    </td>
                    <td style="padding-left:8px;font-size:14px;color:#374151;">${item}</td>
                  </tr>
                </table>
              </td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to MyDojo!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;">

          <!-- Logo bar -->
          <tr>
            <td style="background:#ffffff;padding:24px 40px 16px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <img src="${LOGO_URL}" alt="MyDojo Martial Arts" width="180" style="display:block;margin:0 auto;height:auto;" />
            </td>
          </tr>

          <!-- Red header -->
          <tr>
            <td style="background:#dc2626;padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:900;letter-spacing:-0.5px;line-height:1.2;">
                ${isSummerCamp ? "WELCOME TO SUMMER CAMP!" : "YOU'RE IN!"}
              </h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">
                ${isSummerCamp
                  ? "Your 3-Day Summer Camp spot is confirmed."
                  : `Your 2-class intro offer for <strong>${p.program}</strong> is confirmed.`}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Greeting -->
                <tr>
                  <td style="padding:0 0 20px;">
                    <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">
                      Hi <strong>${p.customerName}</strong>,
                    </p>
                    <p style="margin:12px 0 0;font-size:16px;color:#374151;line-height:1.7;">
                      ${isSummerCamp
                        ? `We're thrilled to have your child joining us for <strong>Summer Camp</strong> at MyDojo! Get ready for 3 incredible days of martial arts training, fun, and new friendships.`
                        : `Welcome to <strong>MyDojo Martial Arts &amp; Fitness</strong>! We're so excited to have you join us for your <strong>${p.program}</strong> intro experience. You've taken the first step toward a stronger, more confident you.`}
                    </p>
                  </td>
                </tr>

                <!-- Confirmation badge -->
                <tr>
                  <td style="padding:0 0 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;border:1px solid #86efac;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Confirmed</p>
                          <p style="margin:0;font-size:15px;color:#15803d;font-weight:600;">
                            ${isSummerCamp ? "3-Day Summer Camp Pass" : `2 Classes + Uniform — ${p.program}`}
                          </p>
                          <p style="margin:4px 0 0;font-size:13px;color:#166534;">Amount paid: <strong>$${p.amountPaid}</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${scheduleSection}
                ${whatToBringSection}

                <!-- Location -->
                <tr>
                  <td style="padding:0 0 24px;">
                    <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">Our Location</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:14px;color:#374151;font-weight:700;">MyDojo Martial Arts &amp; Fitness</p>
                          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">14027 FM 2920, Tomball, TX 77377</p>
                          <p style="margin:0;font-size:13px;color:#6b7280;">Phone: (281) 818-9288</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding:0 0 28px;text-align:center;">
                    <a href="${BOOK_CLASS_URL}"
                       style="display:inline-block;background:#dc2626;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.5px;">
                      View Class Schedule &rarr;
                    </a>
                  </td>
                </tr>

                <!-- Sign off -->
                <tr>
                  <td>
                    <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">
                      See you on the mat,<br/>
                      <strong>The MyDojo Team</strong>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                MyDojo Martial Arts &amp; Fitness &middot; 14027 FM 2920, Tomball, TX 77377<br/>
                Questions? Call us at (281) 818-9288 or reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a welcome email to a new intro offer purchaser.
 * Includes class schedule, what to bring, and location info.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendIntroOfferWelcomeEmail(params: IntroOfferWelcomeEmailParams): Promise<boolean> {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping intro offer welcome email");
    return false;
  }

  const isSummerCamp = params.isSummerCamp || params.program.toLowerCase().includes("summer camp");
  const subject = isSummerCamp
    ? `Your Summer Camp spot is confirmed — see you at MyDojo!`
    : `Welcome to MyDojo — your intro classes are confirmed!`;

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject,
      html: buildIntroOfferWelcomeHtml(params),
    });

    if (error) {
      console.error("[Email] Resend error sending intro offer welcome email:", error);
      return false;
    }

    console.log(`[Email] Intro offer welcome email sent to ${params.toEmail} (program: ${params.program})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send intro offer welcome email:", err);
    return false;
  }
}


// ─── Program/Payment Confirmation Email with QR Code ─────────────────────────

export interface ProgramConfirmationEmailParams {
  toEmail: string;
  customerName: string;
  program: string;
  amountPaid?: number;
  /** Pre-generated QR code as a base64 data URL (png) */
  qrCodeDataUrl: string;
  /** Class schedule rows for this program */
  scheduleRows: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string;
    instructor?: string | null;
  }>;
  /** Optional: membership/enrollment ID for reference */
  referenceId?: string | number;
  /** Optional: special/promo name */
  specialName?: string;
}

function buildProgramConfirmationHtml(p: ProgramConfirmationEmailParams): string {
  const BOOK_CLASS_URL = "https://mydojoma.com/locations/hq";
  const greeting = p.specialName
    ? `You've successfully signed up for the <strong>${p.specialName}</strong> special!`
    : `You're now enrolled in <strong>${p.program}</strong> at MyDojo!`;

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const byDay: Record<string, typeof p.scheduleRows> = {};
  for (const row of p.scheduleRows) {
    if (!byDay[row.dayOfWeek]) byDay[row.dayOfWeek] = [];
    byDay[row.dayOfWeek].push(row);
  }
  const sortedDays = dayOrder.filter((d) => byDay[d]);

  const scheduleRows = sortedDays.length > 0
    ? sortedDays.map((day) => {
        const classes = byDay[day];
        const times = classes.map((c) =>
          `<div style="font-size:13px;color:#374151;">${c.startTime} – ${c.endTime}${c.instructor ? ` · ${c.instructor}` : ""}</div>`
        ).join("");
        return `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:14px;font-weight:700;color:#1f2937;width:110px;">${day}</td><td>${times}</td></tr></table></td></tr>`;
      }).join("")
    : `<tr><td style="font-size:13px;color:#6b7280;padding:8px 0;">Our team will contact you within 24 hours to confirm your class times.</td></tr>`;

  const amountSection = p.amountPaid != null
    ? `<p style="margin:4px 0 0;font-size:13px;color:#166534;">Amount paid: <strong>$${p.amountPaid}</strong></p>`
    : "";

  const refSection = p.referenceId
    ? `<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Reference #: ${p.referenceId}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to MyDojo!</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#dc2626;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">MyDojo</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#fecaca;letter-spacing:2px;text-transform:uppercase;">Martial Arts &amp; Fitness</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <!-- Greeting -->
            <tr><td style="padding:0 0 24px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1f2937;">Welcome, ${p.customerName.split(" ")[0]}! 🥋</h2>
              <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">${greeting}</p>
            </td></tr>
            <!-- Confirmation badge -->
            <tr><td style="padding:0 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px;border:1px solid #86efac;">
                <tr><td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:1px;">✅ Confirmed</p>
                  <p style="margin:0;font-size:15px;color:#15803d;font-weight:700;">${p.program}</p>
                  ${amountSection}
                  ${refSection}
                </td></tr>
              </table>
            </td></tr>
            <!-- QR Code -->
            <tr><td style="padding:0 0 28px;text-align:center;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">Your Check-In QR Code</h2>
              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Show this at the front desk when you arrive for class.</p>
              <img src="${p.qrCodeDataUrl}" alt="Check-In QR Code" width="200" height="200"
                style="display:block;margin:0 auto;border:4px solid #e5e7eb;border-radius:8px;" />
            </td></tr>
            <!-- Class Schedule -->
            <tr><td style="padding:0 0 28px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">Class Schedule — ${p.program}</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
                <tr><td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${scheduleRows}
                  </table>
                </td></tr>
              </table>
            </td></tr>
            <!-- Location -->
            <tr><td style="padding:0 0 28px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#1f2937;">Our Location</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
                <tr><td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:14px;color:#374151;font-weight:700;">MyDojo Martial Arts &amp; Fitness</p>
                  <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">14027 FM 2920, Tomball, TX 77377</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;">Phone: (281) 818-9288</p>
                </td></tr>
              </table>
            </td></tr>
            <!-- CTA -->
            <tr><td style="padding:0 0 28px;text-align:center;">
              <a href="${BOOK_CLASS_URL}" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.5px;">
                View Full Schedule &rarr;
              </a>
            </td></tr>
            <!-- Sign off -->
            <tr><td style="padding:0 0 32px;">
              <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">
                See you on the mat,<br/>
                <strong>The MyDojo Team</strong>
              </p>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            MyDojo Martial Arts &amp; Fitness &middot; 14027 FM 2920, Tomball, TX 77377<br/>
            Questions? Call us at (281) 818-9288 or reply to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send a program/payment confirmation email with QR code and live class schedule.
 * Call this after any successful payment or enrollment.
 */
export async function sendProgramConfirmationEmail(params: ProgramConfirmationEmailParams): Promise<boolean> {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping program confirmation email");
    return false;
  }
  const subject = params.specialName
    ? `You're confirmed for ${params.specialName} at MyDojo!`
    : `Welcome to MyDojo — ${params.program} enrollment confirmed!`;
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject,
      html: buildProgramConfirmationHtml(params),
    });
    if (error) {
      console.error("[Email] Resend error sending program confirmation email:", error);
      return false;
    }
    console.log(`[Email] Program confirmation email sent to ${params.toEmail} (program: ${params.program})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send program confirmation email:", err);
    return false;
  }
}

// ─── Lead Form Confirmation Email ───────────────────────────────────────────

export interface LeadConfirmationEmailParams {
  toEmail: string;
  toName: string;
  program: string;
  phone?: string;
  scheduleRows?: Array<{ dayOfWeek: string; startTime: string; endTime: string; instructor?: string | null }>;
}

function buildLeadConfirmationHtml(p: LeadConfirmationEmailParams): string {
  const programDisplay = p.program || "Martial Arts";
  const SITE_URL = "https://mydojoma.com";
  const BOOK_TRIAL_URL = `${SITE_URL}/locations/hq`;
  const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  // Build schedule table rows grouped by day
  let scheduleSection = "";
  if (p.scheduleRows && p.scheduleRows.length > 0) {
    const byDay: Record<string, typeof p.scheduleRows> = {};
    for (const row of p.scheduleRows) {
      if (!byDay[row.dayOfWeek]) byDay[row.dayOfWeek] = [];
      byDay[row.dayOfWeek].push(row);
    }
    const sortedDays = DAY_ORDER.filter(d => byDay[d]);
    const rows = sortedDays.map(day => {
      const times = byDay[day].map(r => `${r.startTime} – ${r.endTime}`).join(" &amp; ");
      return `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#1f2937;width:110px;">${day}</td>
        <td style="padding:10px 16px;font-size:14px;color:#374151;">${times}</td>
      </tr>`;
    }).join("");
    scheduleSection = `
    <!-- Class Schedule -->
    <tr><td style="padding:0 0 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:10px;border:2px solid #dc2626;overflow:hidden;">
        <tr><td style="background:#dc2626;padding:14px 20px;">
          <p style="margin:0;font-size:14px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">📅 ${programDisplay} Class Schedule</p>
        </td></tr>
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr style="background:#f9fafb;">
              <td style="padding:8px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Day</td>
              <td style="padding:8px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Time</td>
            </tr>
            ${rows}
          </table>
        </td></tr>
      </table>
    </td></tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Thanks for reaching out — MyDojo!</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- LOGO HEADER -->
        <tr><td style="background:#000000;padding:24px 40px;text-align:center;">
          <img src="${LOGO_URL}" alt="MyDojo Martial Arts &amp; Fitness" width="200" style="display:block;margin:0 auto;height:auto;max-width:200px;"/>
        </td></tr>

        <!-- RED HERO BANNER -->
        <tr><td style="background:#dc2626;padding:32px 40px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:2px;">Request Received</p>
          <h1 style="margin:0 0 8px;font-size:30px;font-weight:900;color:#ffffff;line-height:1.2;">Thanks, ${p.toName}! 🥋</h1>
          <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.5;">We received your interest in <strong>${programDisplay}</strong> and we can't wait to meet you!</p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="padding:36px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">

            <!-- What Happens Next -->
            <tr><td style="padding:0 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
                <tr><td style="padding:24px;">
                  <h3 style="margin:0 0 20px;font-size:15px;font-weight:800;color:#1f2937;text-transform:uppercase;letter-spacing:1px;">What Happens Next</h3>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:0 0 16px;vertical-align:top;width:40px;">
                        <div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:800;">1</div>
                      </td>
                      <td style="padding:0 0 16px 12px;font-size:14px;color:#374151;line-height:1.6;vertical-align:top;">
                        <strong style="color:#111827;">We'll reach out soon</strong><br/>A MyDojo team member will call or text you shortly to answer any questions.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 16px;vertical-align:top;width:40px;">
                        <div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:800;">2</div>
                      </td>
                      <td style="padding:0 0 16px 12px;font-size:14px;color:#374151;line-height:1.6;vertical-align:top;">
                        <strong style="color:#111827;">Book your FREE trial class</strong><br/>No commitment required — come try a class on us!
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0;vertical-align:top;width:40px;">
                        <div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:800;">3</div>
                      </td>
                      <td style="padding:0 0 0 12px;font-size:14px;color:#374151;line-height:1.6;vertical-align:top;">
                        <strong style="color:#111827;">Join the MyDojo family</strong><br/>Meet our world-class instructors and start your martial arts journey!
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td></tr>

            <!-- CTA Button -->
            <tr><td style="padding:0 0 28px;text-align:center;">
              <a href="${BOOK_TRIAL_URL}" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:18px 48px;border-radius:8px;letter-spacing:0.5px;text-transform:uppercase;">
                Book My Free Trial Class &rarr;
              </a>
            </td></tr>

            ${scheduleSection}

            <!-- Contact & Location -->
            <tr><td style="padding:0 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;border-radius:10px;overflow:hidden;">
                <tr><td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Find Us</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:0 0 8px;vertical-align:top;width:20px;font-size:16px;">📍</td>
                      <td style="padding:0 0 8px 10px;font-size:14px;color:#e5e7eb;line-height:1.5;">
                        <strong style="color:#ffffff;">MyDojo Martial Arts &amp; Fitness</strong><br/>
                        14027 FM 2920, Tomball, TX 77377
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 8px;vertical-align:top;font-size:16px;">📞</td>
                      <td style="padding:0 0 8px 10px;font-size:14px;color:#e5e7eb;">
                        <a href="tel:+12818189288" style="color:#dc2626;text-decoration:none;font-weight:700;">(281) 818-9288</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 8px;vertical-align:top;font-size:16px;">🌐</td>
                      <td style="padding:0 0 8px 10px;font-size:14px;">
                        <a href="${SITE_URL}" style="color:#dc2626;text-decoration:none;font-weight:700;">mydojoma.com</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0;vertical-align:top;font-size:16px;">🕐</td>
                      <td style="padding:0 0 0 10px;font-size:14px;color:#e5e7eb;line-height:1.6;">
                        <strong style="color:#ffffff;">Office Hours:</strong><br/>
                        Mon–Fri: 4:00 PM – 8:00 PM<br/>
                        Saturday: 9:00 AM – 1:00 PM
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td></tr>

            <!-- Sign off -->
            <tr><td style="padding:0 0 36px;">
              <p style="margin:0 0 4px;font-size:16px;color:#374151;line-height:1.6;">We look forward to meeting you on the mat,</p>
              <p style="margin:0;font-size:16px;font-weight:800;color:#111827;">The MyDojo Team</p>
            </td></tr>

          </table>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#111827;padding:24px 40px;text-align:center;">
          <!-- Social Links -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
            <tr>
              <td style="padding:0 8px;">
                <a href="https://www.facebook.com/MyDojoMartialArts" style="display:inline-block;background:#1877f2;color:#fff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 14px;border-radius:4px;">Facebook</a>
              </td>
              <td style="padding:0 8px;">
                <a href="https://www.instagram.com/mydojomartialarts" style="display:inline-block;background:#e1306c;color:#fff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 14px;border-radius:4px;">Instagram</a>
              </td>
              <td style="padding:0 8px;">
                <a href="${SITE_URL}" style="display:inline-block;background:#dc2626;color:#fff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 14px;border-radius:4px;">Website</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.8;">
            MyDojo Martial Arts &amp; Fitness &middot; 14027 FM 2920, Tomball, TX 77377<br/>
            &copy; ${new Date().getFullYear()} MyDojo. All rights reserved.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send a confirmation email to a customer who just submitted a lead/interest form.
 * Call this after createTrialSignup succeeds and the customer has an email address.
 */
export async function sendLeadConfirmationEmail(params: LeadConfirmationEmailParams): Promise<boolean> {
  if (!ENV.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping lead confirmation email");
    return false;
  }
  if (!params.toEmail) {
    console.warn("[Email] No email address provided — skipping lead confirmation email");
    return false;
  }
  try {
    // Fetch class schedule for the program from the database
    let scheduleRows = params.scheduleRows;
    if (!scheduleRows) {
      try {
        const { getScheduleForProgram } = await import('./db');
        scheduleRows = await getScheduleForProgram(params.program);
      } catch (schedErr) {
        console.warn('[Email] Could not fetch schedule for lead email:', schedErr);
        scheduleRows = [];
      }
    }
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: `MyDojo <${ENV.EMAIL_FROM}>`,
      to: params.toEmail,
      subject: `We got your request, ${params.toName}! 🥋 — MyDojo`,
      html: buildLeadConfirmationHtml({ ...params, scheduleRows }),
    });
    if (error) {
      console.error("[Email] Resend error sending lead confirmation email:", error);
      return false;
    }
    console.log(`[Email] Lead confirmation email sent to ${params.toEmail} (program: ${params.program})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send lead confirmation email:", err);
    return false;
  }
}
