/**
 * Kai Camp Operations — Hourly Staff SMS + 6 PM Daily Summary
 *
 * Summer camp runs June 1 – Aug 10, Mon–Fri, 8 AM arrival, 9 AM start, 6 PM end (CDT)
 * No field trips weeks 1–2 (June 1–14)
 *
 * Two endpoints:
 *   POST /api/scheduled/kai-camp-hourly   — fires every hour 9 AM–5 PM CDT (14:00–22:00 UTC)
 *   POST /api/scheduled/kai-camp-summary  — fires at 6 PM CDT (23:00 UTC)
 *
 * CDT = UTC-5
 */

import { Request, Response } from "express";
import { invokeLLM } from "./_core/llm";
import { sendSms } from "./sms800";

// ── Staff phone numbers ──────────────────────────────────────────────────────
const STAFF_PHONES = [
  { name: "Vincent", phone: "+12818189288" },
  { name: "Debbie", phone: "+12812369283" },
  { name: "Hector", phone: "+18187454612" },
  { name: "Dominique", phone: "+12406011818" },
  { name: "Clover", phone: "+17034997761" },
];

// ── Weekly themes ────────────────────────────────────────────────────────────
const THEME_WEEKS = [
  { start: "2026-06-01", end: "2026-06-05", theme: "Ninja Warrior Week", desc: "Obstacle courses, speed challenges & ninja games", fieldTrip: false },
  { start: "2026-06-08", end: "2026-06-12", theme: "Water War Week", desc: "Water games, slip n' slide & splash battles", fieldTrip: false },
  { start: "2026-06-15", end: "2026-06-19", theme: "Board Breaking Week", desc: "Break barriers & boards, build power & confidence", fieldTrip: true },
  { start: "2026-06-22", end: "2026-06-26", theme: "Nerf Battle Week", desc: "Team battles, missions & strategy challenges", fieldTrip: true },
  { start: "2026-06-29", end: "2026-07-03", theme: "Glow Night Week", desc: "Glow games, lasers & epic night adventures", fieldTrip: true },
  { start: "2026-07-07", end: "2026-07-11", theme: "Leadership Week", desc: "Life skills, team building & community service", fieldTrip: true },
  { start: "2026-07-14", end: "2026-07-18", theme: "Tournament Prep Week", desc: "Sparring, drills & championship mindset training", fieldTrip: true },
  { start: "2026-07-21", end: "2026-07-25", theme: "Water Gun Fun Week", desc: "Epic water gun battles & outdoor adventures", fieldTrip: true },
  { start: "2026-07-28", end: "2026-08-01", theme: "Black Belt Bootcamp", desc: "Advanced training, board breaks & championship drills", fieldTrip: true },
  { start: "2026-08-04", end: "2026-08-08", theme: "Summer Finale", desc: "Awards ceremony, pizza party & epic memories", fieldTrip: true },
];

function getCurrentTheme(dateStr: string) {
  return THEME_WEEKS.find(w => dateStr >= w.start && dateStr <= w.end) ?? THEME_WEEKS[0];
}

function getCdtDateStr(now: Date): string {
  // CDT = UTC-5
  const cdt = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return cdt.toISOString().slice(0, 10);
}

function getCdtHour(now: Date): number {
  const cdt = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return cdt.getUTCHours();
}

function getDayOfWeek(now: Date): number {
  const cdt = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return cdt.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
}

// ── Hourly handler ───────────────────────────────────────────────────────────
export async function handleKaiCampHourly(req: Request, res: Response) {
  try {
    const now = new Date();
    const dow = getDayOfWeek(now);
    const cdtHour = getCdtHour(now);
    const dateStr = getCdtDateStr(now);

    // Only Mon–Fri
    if (dow < 1 || dow > 5) {
      return res.json({ ok: true, skipped: "weekend" });
    }
    // Only during camp hours 9 AM–5 PM CDT
    if (cdtHour < 9 || cdtHour > 17) {
      return res.json({ ok: true, skipped: "outside-camp-hours" });
    }
    // Only during camp season June 1 – Aug 10
    if (dateStr < "2026-06-01" || dateStr > "2026-08-10") {
      return res.json({ ok: true, skipped: "outside-camp-season" });
    }

    const week = getCurrentTheme(dateStr);
    const hourLabel = cdtHour <= 12 ? `${cdtHour}:00 AM` : `${cdtHour - 12}:00 PM`;

    // Build context for Kai
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[dow];

    const systemPrompt = `You are Kai, the AI operations assistant for MyDojo Martial Arts & Fitness Summer Camp in Tomball, TX.
Your job is to send brief, energetic, actionable hourly instructions to camp staff via SMS.

Camp facts:
- Kids arrive 8 AM, camp runs 9 AM–6 PM CDT, Mon–Fri
- Ages: 3–5 (Little Ninjas), 6–11 (Dragon Kids), 12+ (Teen Warriors)
- This week's theme: ${week.theme} — ${week.desc}
- No field trips this week: ${!week.fieldTrip ? "YES, stay at dojo" : "Field trips may be scheduled"}
- Today: ${dayName}, ${dateStr}
- Current time: ${hourLabel} CDT

Hour-by-hour camp structure:
- 8:00 AM: Arrival, check-in, free play
- 9:00 AM: Morning assembly, warm-up, theme intro
- 10:00 AM: Martial arts training block 1
- 11:00 AM: Theme activity block 1
- 12:00 PM: Lunch break + rest
- 1:00 PM: Theme activity block 2 / free choice
- 2:00 PM: Martial arts training block 2
- 3:00 PM: Snack + cool-down games
- 4:00 PM: Theme activity block 3 / team challenges
- 5:00 PM: Wind-down, cleanup, parent pickup prep

Write a SHORT, punchy SMS (max 160 chars) from Kai telling staff exactly what to do RIGHT NOW at ${hourLabel}.
Be specific to the theme. Use action verbs. No emojis. Sign off as "— Kai".`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the ${hourLabel} staff instruction SMS for today's ${week.theme}.` }
      ]
    });

    const message = (response as any)?.choices?.[0]?.message?.content ?? 
      `[Kai] ${hourLabel} — ${week.theme}: Keep energy high, stay on schedule. Check in with each age group. — Kai`;

    // Send to all staff
    const results = await Promise.allSettled(
      STAFF_PHONES.map(s => sendSms({ to: s.phone, message: String(message).slice(0, 600) }))
    );

    const sent = results.filter(r => r.status === "fulfilled" && (r as any).value?.success).length;
    console.log(`[Kai Camp Hourly] ${hourLabel} — Sent to ${sent}/${STAFF_PHONES.length} staff`);

    return res.json({ ok: true, hour: hourLabel, theme: week.theme, sent, total: STAFF_PHONES.length });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[Kai Camp Hourly] Error:", error);
    return res.status(500).json({ error, stack: (err as any)?.stack, timestamp: new Date().toISOString() });
  }
}

// ── Daily summary handler ────────────────────────────────────────────────────
export async function handleKaiCampSummary(req: Request, res: Response) {
  try {
    const now = new Date();
    const dow = getDayOfWeek(now);
    const dateStr = getCdtDateStr(now);

    // Only Mon–Fri
    if (dow < 1 || dow > 5) {
      return res.json({ ok: true, skipped: "weekend" });
    }
    // Only during camp season
    if (dateStr < "2026-06-01" || dateStr > "2026-08-10") {
      return res.json({ ok: true, skipped: "outside-camp-season" });
    }

    const week = getCurrentTheme(dateStr);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[dow];

    // Get tomorrow's theme (skip weekend)
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDow = getDayOfWeek(tomorrowDate);
    const tomorrowDateStr = getCdtDateStr(tomorrowDate);
    const tomorrowWeek = getCurrentTheme(tomorrowDateStr);
    const isFriday = dow === 5;

    const systemPrompt = `You are Kai, the AI operations assistant for MyDojo Martial Arts & Fitness Summer Camp in Tomball, TX.
It is 6 PM CDT — end of camp day. Write a daily summary SMS for staff.

Today: ${dayName}, ${dateStr}
Today's theme: ${week.theme} — ${week.desc}
${isFriday ? "Tomorrow is Saturday — no camp. Next camp day is Monday." : `Tomorrow: ${dayNames[tomorrowDow]}, ${tomorrowDateStr}, Theme: ${tomorrowWeek.theme} — ${tomorrowWeek.desc}`}
No field trips weeks 1–2: ${!week.fieldTrip ? "YES, stay at dojo" : "Field trips may be scheduled"}

Write a 2-part SMS (max 600 chars total):
PART 1 — Today's summary: 2–3 sentences recapping what was accomplished today, energy level, any highlights.
PART 2 — Tomorrow's equipment/prep list: Bullet list of 4–6 specific items staff need to prepare or bring for tomorrow's theme. Be very specific (e.g., "Set up 4 obstacle course stations in main mat area", "Fill 20 water balloons", "Prepare belt ceremony certificates").
${isFriday ? "Since tomorrow is the weekend, give a prep list for Monday instead." : ""}

Sign off as "— Kai | MyDojo Camp"`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the 6 PM end-of-day summary and tomorrow's prep list for ${week.theme}.` }
      ]
    });

    const message = (response as any)?.choices?.[0]?.message?.content ??
      `[Kai] Great day of ${week.theme}! Tomorrow: prepare equipment, review schedule, brief staff. — Kai | MyDojo Camp`;

    // Send to all staff
    const results = await Promise.allSettled(
      STAFF_PHONES.map(s => sendSms({ to: s.phone, message: String(message).slice(0, 600) }))
    );

    const sent = results.filter(r => r.status === "fulfilled" && (r as any).value?.success).length;
    console.log(`[Kai Camp Summary] ${dateStr} — Sent to ${sent}/${STAFF_PHONES.length} staff`);

    return res.json({ ok: true, date: dateStr, theme: week.theme, sent, total: STAFF_PHONES.length });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[Kai Camp Summary] Error:", error);
    return res.status(500).json({ error, stack: (err as any)?.stack, timestamp: new Date().toISOString() });
  }
}
