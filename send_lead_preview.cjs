const { Resend } = require('resend');
const resend = new Resend('re_idXYYsNm_AVdwtT4bhD4x2Xnn3eFuakCN');

const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/FULLLOGOBLACK_ccaa34bf.png';
const SITE_URL = 'https://mydojoma.com';
const BOOK_TRIAL_URL = SITE_URL + '/locations/hq';
const programDisplay = 'Kickboxing';
const toName = 'Vincent';

const scheduleRows = [
  { dayOfWeek: 'Monday', startTime: '6:00 PM', endTime: '7:00 PM' },
  { dayOfWeek: 'Wednesday', startTime: '6:00 PM', endTime: '7:00 PM' },
  { dayOfWeek: 'Friday', startTime: '6:00 PM', endTime: '7:00 PM' },
  { dayOfWeek: 'Saturday', startTime: '10:00 AM', endTime: '11:00 AM' },
];

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const byDay = {};
for (const row of scheduleRows) {
  if (!byDay[row.dayOfWeek]) byDay[row.dayOfWeek] = [];
  byDay[row.dayOfWeek].push(row);
}
const sortedDays = DAY_ORDER.filter(d => byDay[d]);
const tableRows = sortedDays.map(day => {
  const times = byDay[day].map(r => r.startTime + ' &ndash; ' + r.endTime).join(' &amp; ');
  return '<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 16px;font-size:14px;font-weight:700;color:#1f2937;width:110px;">' + day + '</td><td style="padding:10px 16px;font-size:14px;color:#374151;">' + times + '</td></tr>';
}).join('');

const scheduleSection = `
<tr><td style="padding:0 0 28px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:10px;border:2px solid #dc2626;overflow:hidden;">
    <tr><td style="background:#dc2626;padding:14px 20px;">
      <p style="margin:0;font-size:14px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">&#128197; ${programDisplay} Class Schedule</p>
    </td></tr>
    <tr><td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="background:#f9fafb;">
          <td style="padding:8px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Day</td>
          <td style="padding:8px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Time</td>
        </tr>
        ${tableRows}
      </table>
    </td></tr>
  </table>
</td></tr>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Thanks for reaching out!</title></head>
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
          <h1 style="margin:0 0 8px;font-size:30px;font-weight:900;color:#ffffff;line-height:1.2;">Thanks, ${toName}!</h1>
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
                      <td style="padding:0 0 16px;vertical-align:top;width:40px;"><div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:800;">1</div></td>
                      <td style="padding:0 0 16px 12px;font-size:14px;color:#374151;line-height:1.6;vertical-align:top;"><strong style="color:#111827;">We'll reach out soon</strong><br/>A MyDojo team member will call or text you shortly to answer any questions.</td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 16px;vertical-align:top;width:40px;"><div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:800;">2</div></td>
                      <td style="padding:0 0 16px 12px;font-size:14px;color:#374151;line-height:1.6;vertical-align:top;"><strong style="color:#111827;">Book your FREE trial class</strong><br/>No commitment required &mdash; come try a class on us!</td>
                    </tr>
                    <tr>
                      <td style="padding:0;vertical-align:top;width:40px;"><div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:800;">3</div></td>
                      <td style="padding:0 0 0 12px;font-size:14px;color:#374151;line-height:1.6;vertical-align:top;"><strong style="color:#111827;">Join the MyDojo family</strong><br/>Meet our world-class instructors and start your martial arts journey!</td>
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
                      <td style="padding:0 0 10px;vertical-align:top;width:24px;font-size:16px;">&#128205;</td>
                      <td style="padding:0 0 10px 10px;font-size:14px;color:#e5e7eb;line-height:1.5;">
                        <strong style="color:#ffffff;">MyDojo Martial Arts &amp; Fitness</strong><br/>
                        14027 FM 2920, Tomball, TX 77377
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 10px;vertical-align:top;font-size:16px;">&#128222;</td>
                      <td style="padding:0 0 10px 10px;font-size:14px;">
                        <a href="tel:+12818189288" style="color:#dc2626;text-decoration:none;font-weight:700;">(281) 818-9288</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 10px;vertical-align:top;font-size:16px;">&#127760;</td>
                      <td style="padding:0 0 10px 10px;font-size:14px;">
                        <a href="${SITE_URL}" style="color:#dc2626;text-decoration:none;font-weight:700;">mydojoma.com</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0;vertical-align:top;font-size:16px;">&#128336;</td>
                      <td style="padding:0 0 0 10px;font-size:14px;color:#e5e7eb;line-height:1.6;">
                        <strong style="color:#ffffff;">Office Hours:</strong><br/>
                        Mon&ndash;Fri: 4:00 PM &ndash; 8:00 PM<br/>
                        Saturday: 9:00 AM &ndash; 1:00 PM
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
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
            <tr>
              <td style="padding:0 8px;"><a href="https://www.facebook.com/MyDojoMartialArts" style="display:inline-block;background:#1877f2;color:#fff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 14px;border-radius:4px;">Facebook</a></td>
              <td style="padding:0 8px;"><a href="https://www.instagram.com/mydojomartialarts" style="display:inline-block;background:#e1306c;color:#fff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 14px;border-radius:4px;">Instagram</a></td>
              <td style="padding:0 8px;"><a href="${SITE_URL}" style="display:inline-block;background:#dc2626;color:#fff;font-size:12px;font-weight:700;text-decoration:none;padding:8px 14px;border-radius:4px;">Website</a></td>
            </tr>
          </table>
          <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.8;">
            MyDojo Martial Arts &amp; Fitness &middot; 14027 FM 2920, Tomball, TX 77377<br/>
            &copy; 2026 MyDojo. All rights reserved.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

resend.emails.send({
  from: 'MyDojo <noreply@mydojoma.com>',
  to: 'Vincent.Holmes00@gmail.com',
  subject: 'We got your request, Vincent! - MyDojo',
  html: html
}).then(r => {
  console.log('SENT:', JSON.stringify(r.data));
}).catch(e => {
  console.error('ERR:', e.message);
});
