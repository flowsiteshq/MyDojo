/**
 * Newsletter email templates for MyDojo parent communications.
 */

export function getAugust2026NewsletterHtml(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyDojo August 2026 Newsletter</title>
  <style>
    body { margin: 0; padding: 0; background: #111; font-family: Arial, sans-serif; color: #ffffff; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #1a1a1a; }
    .header { background: #000; padding: 32px 24px; text-align: center; border-bottom: 4px solid #e11d48; }
    .header img { height: 60px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #fff; }
    .header p { margin: 6px 0 0; color: #e11d48; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .intro { padding: 28px 24px 12px; }
    .intro p { color: #ccc; font-size: 15px; line-height: 1.7; margin: 0; }
    .section { padding: 20px 24px; }
    .event-card { background: #222; border-left: 4px solid #e11d48; border-radius: 6px; padding: 18px 20px; margin-bottom: 16px; }
    .event-card .date { font-size: 12px; font-weight: bold; color: #e11d48; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .event-card h3 { margin: 0 0 8px; font-size: 18px; font-weight: 900; text-transform: uppercase; color: #fff; }
    .event-card p { margin: 0 0 12px; color: #bbb; font-size: 14px; line-height: 1.6; }
    .event-card .tag { display: inline-block; background: #e11d48; color: #fff; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 3px 8px; border-radius: 3px; margin-right: 6px; margin-bottom: 6px; }
    .event-card .tag.gold { background: #b45309; }
    .event-card .tag.purple { background: #7c3aed; }
    .cta-btn { display: inline-block; background: #e11d48; color: #fff !important; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 12px 24px; border-radius: 4px; margin-top: 10px; }
    .reminder-box { background: #1f1f1f; border: 1px solid #333; border-radius: 6px; padding: 18px 20px; margin: 0 24px 20px; }
    .reminder-box h4 { margin: 0 0 12px; font-size: 13px; font-weight: bold; color: #e11d48; text-transform: uppercase; letter-spacing: 1px; }
    .reminder-box ul { margin: 0; padding-left: 18px; color: #bbb; font-size: 13px; line-height: 1.9; }
    .reminder-box ul li strong { color: #fff; }
    .divider { height: 1px; background: #333; margin: 4px 24px; }
    .footer { background: #000; padding: 24px; text-align: center; border-top: 1px solid #333; }
    .footer p { color: #666; font-size: 12px; margin: 4px 0; }
    .footer a { color: #e11d48; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <img src="https://mydojoma.com/images/mydojo-logo.png" alt="MyDojo" onerror="this.style.display='none'" />
      <h1>August 2026</h1>
      <p>Parent Newsletter &amp; Events Calendar</p>
    </div>

    <!-- Intro -->
    <div class="intro">
      <p>Dear MyDojo Families,</p>
      <p style="margin-top:12px;">August is packed with exciting events and important milestones! Please read through carefully so you don't miss any deadlines. We look forward to seeing your family on the mat!</p>
    </div>

    <div class="divider"></div>

    <!-- Events Section -->
    <div class="section">
      <h2 style="margin:0 0 16px;font-size:13px;font-weight:bold;color:#e11d48;text-transform:uppercase;letter-spacing:1px;">📅 This Month's Events</h2>

      <!-- Belt Test -->
      <div class="event-card">
        <div class="date">August 15th, 2026</div>
        <h3>🥋 Belt Test</h3>
        <span class="tag">$49 Fee</span>
        <span class="tag gold">Deadline: Aug 10th</span>
        <p>Is your child ready to advance to the next rank? The August Belt Test is on <strong>August 15th</strong>. The <strong>Intent to Promote form must be submitted and paid ($49) before August 10th</strong> to reserve your student's spot.</p>
        <p style="color:#bbb;font-size:13px;">📌 <strong>Spotlight Week: August 10–14</strong> — Testing Preparation classes all week. Don't miss it!<br/>
        👕 Uniforms must be ordered before Aug 10th — Extra Black or Red Gi available.<br/>
        🥊 Pre-order Sparring Gear, T-Shirts &amp; Apparel also available.</p>
        <a href="${baseUrl}/belt-test-intent" class="cta-btn">Submit Intent to Promote →</a>
      </div>

      <!-- Parents Night Out -->
      <div class="event-card">
        <div class="date">August 21st, 2026 · 6:00 PM – 9:30 PM</div>
        <h3>🌟 Parents Night Out</h3>
        <span class="tag purple">Ninja Warrior Glow Night</span>
        <p>Drop off the kids and enjoy a night out! We're hosting a <strong>Ninja Warrior Course Glow Night</strong> on August 21st from 6–9:30 PM.</p>
        <p style="color:#bbb;font-size:13px;">🎟️ <strong>Admission:</strong> Bring a Friend = FREE &nbsp;|&nbsp; $15 per child without a friend<br/>
        Fun, safe, and supervised — kids will love it!</p>
        <a href="${baseUrl}/parents-night-out-aug" class="cta-btn">RSVP Now →</a>
      </div>

      <!-- Master Yaeger Seminar -->
      <div class="event-card">
        <div class="date">August 22nd, 2026 · 11:00 AM – 2:00 PM</div>
        <h3>🏆 Seminar with Master Yaeger</h3>
        <span class="tag gold">$29 Registration</span>
        <p>A rare opportunity to train with <strong>Master Yaeger</strong> — an elite seminar open to all students. Saturday, August 22nd from 11 AM to 2 PM.</p>
        <p style="color:#bbb;font-size:13px;">🎓 All levels welcome. Registration is $29 per student.</p>
        <a href="${baseUrl}/master-yaeger-seminar" class="cta-btn">Register Now →</a>
      </div>

      <!-- Bo Staff -->
      <div class="event-card" style="border-left-color:#4ade80;">
        <div class="date" style="color:#4ade80;">Starting This Month</div>
        <h3 style="color:#4ade80;">🥢 Bo Staff Training Begins!</h3>
        <p>In-class Bo Staff training starts this month. Students will need their own Bo Staff — available for purchase at the front desk. Ask your instructor for details!</p>
      </div>
    </div>

    <!-- Key Reminders -->
    <div class="reminder-box">
      <h4>⚠️ Important Reminders &amp; Deadlines</h4>
      <ul>
        <li><strong>Aug 10:</strong> Intent to Promote form + $49 fee deadline</li>
        <li><strong>Aug 10:</strong> Uniform orders must be placed (Extra Black or Red Gi)</li>
        <li><strong>Aug 10–14:</strong> Spotlight Week — Testing Preparation classes</li>
        <li><strong>Aug 15:</strong> Belt Test Day 🥋</li>
        <li><strong>Aug 21:</strong> Parents Night Out — Ninja Warrior Glow Night (6–9:30 PM)</li>
        <li><strong>Aug 22:</strong> Master Yaeger Seminar (11 AM – 2 PM, $29)</li>
      </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong style="color:#fff;">MyDojo Martial Arts &amp; Fitness</strong></p>
      <p><a href="tel:8774693656">(877) 4-MYDOJO</a> &nbsp;|&nbsp; <a href="mailto:info@mydojoma.com">info@mydojoma.com</a></p>
      <p><a href="https://mydojoma.com">mydojoma.com</a></p>
      <p style="margin-top:12px;color:#444;font-size:11px;">You're receiving this because you're a MyDojo family member. Reply STOP to unsubscribe from SMS.</p>
    </div>
  </div>
</body>
</html>`;
}

export function getAugust2026NewsletterText(): string {
  return `🥋 MyDojo August 2026 Newsletter

Dear MyDojo Families — August is packed! Here's what's coming up:

📅 AUG 15 — BELT TEST
Intent to Promote form + $49 fee due by Aug 10th.
Spotlight Week: Aug 10–14 (Testing Prep classes)
Uniforms must be ordered before Aug 10.
👉 Submit form: mydojoma.com/belt-test-intent

🌟 AUG 21 — PARENTS NIGHT OUT
Ninja Warrior Glow Night · 6–9:30 PM
Bring a Friend = FREE | $15 admission
👉 RSVP: mydojoma.com/parents-night-out-aug

🏆 AUG 22 — MASTER YAEGER SEMINAR
11 AM – 2 PM · $29/student
👉 Register: mydojoma.com/master-yaeger-seminar

🥢 Bo Staff training starts this month!

Questions? Call (877) 4-MYDOJO or visit mydojoma.com`;
}

export function getAugust2026SmsBlast(baseUrl: string): string {
  return `🥋 MyDojo August Events!

📅 Belt Test – Aug 15 (form due Aug 10, $49)
👉 ${baseUrl}/belt-test-intent

🌟 Parents Night Out – Aug 21, 6–9:30PM (Ninja Warrior Glow Night, bring a friend = FREE)
👉 ${baseUrl}/parents-night-out-aug

🏆 Master Yaeger Seminar – Aug 22, $29
👉 ${baseUrl}/master-yaeger-seminar

Reply STOP to opt out.`;
}
