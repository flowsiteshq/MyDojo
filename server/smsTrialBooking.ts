/**
 * SMS Trial Booking State Machine
 *
 * Guides a prospective student through booking a free trial class via SMS.
 * Flow: idle → awaiting_name → awaiting_program → awaiting_time_selection → confirmed
 *
 * After the customer picks a program, the bot fetches the next N real class
 * times from the database and presents them as a numbered menu. The customer
 * picks a number and that specific slot is confirmed and saved.
 *
 * The state is stored in smsConversations.bookingState so it persists
 * across messages. Once confirmed, a trialSignup record is created and
 * staff are notified.
 */
import { getDb } from "./db";
import { smsConversations, trialSignups, classSchedule } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// ─── Timezone helpers (CST/CDT — Tomball, TX) ────────────────────────────────

const TZ = "America/Chicago";

function nowCST(): Date {
  const cstStr = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(cstStr);
}

function isClassTimePassed(startTime: string, nowInCST: Date): boolean {
  const parts = startTime.split(" ");
  if (parts.length < 2) return false;
  const [timePart, ampm] = parts;
  const [hourStr, minStr] = timePart.split(":");
  let classHour = parseInt(hourStr, 10);
  const classMin = parseInt(minStr || "0", 10);
  if (ampm?.toUpperCase() === "PM" && classHour !== 12) classHour += 12;
  if (ampm?.toUpperCase() === "AM" && classHour === 12) classHour = 0;
  const classMinutes = classHour * 60 + classMin;
  const nowMinutes = nowInCST.getHours() * 60 + nowInCST.getMinutes();
  return classMinutes <= nowMinutes + 30; // 30-min buffer
}

// ─── Program options shown to the user ───────────────────────────────────────

export const PROGRAM_OPTIONS = [
  { key: "1", label: "Little Ninjas (ages 3–5)",  dbName: "Little Ninjas" },
  { key: "2", label: "Core Kids (ages 5–12)",      dbName: "Dragon Kids" },
  { key: "3", label: "Teens (ages 13–17)",         dbName: "Teens" },
  { key: "4", label: "Teens & Adults (ages 13+)",  dbName: "Teens & Adults" },
  { key: "5", label: "Kickboxing",                 dbName: "Kickboxing" },
  { key: "6", label: "Not Sure — Help Me Choose",  dbName: null },
];

// Map numeric choice → trialSignups.program enum value
const PROGRAM_ENUM_MAP: Record<string, "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "Not Sure"> = {
  "1": "Little Ninjas",
  "2": "Dragon Kids",
  "3": "Teens",
  "4": "Adult Karate",
  "5": "Kickboxing",
  "6": "Not Sure",
};

// Also accept natural-language program names
function parseProgram(input: string): string | null {
  const lower = input.toLowerCase().trim();
  if (lower === "1" || lower.includes("little ninja") || lower.includes("3-5") || lower.includes("3 to 5")) return "1";
  if (lower === "2" || lower.includes("core kid") || lower.includes("dragon kid") || (lower.includes("kids") && !lower.includes("teen"))) return "2";
  if (lower === "3" || (lower.includes("teen") && !lower.includes("adult"))) return "3";
  if (lower === "4" || (lower.includes("teen") && lower.includes("adult")) || lower.includes("karate") || lower.includes("adult")) return "4";
  if (lower === "5" || lower.includes("kickbox")) return "5";
  if (lower === "6" || lower.includes("not sure") || lower.includes("help") || lower.includes("unsure")) return "6";
  return null;
}

// ─── Fetch next available class slots from DB ─────────────────────────────────

export async function getUpcomingSlots(
  dbProgramName: string,
  location: string = "Tomball HQ",
  limit: number = 5
): Promise<Array<{ dayOfWeek: string; startTime: string; endTime: string; instructor: string | null }>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const classes = await db
      .select()
      .from(classSchedule)
      .where(
        and(
          eq(classSchedule.program, dbProgramName as any),
          eq(classSchedule.location, location),
          eq(classSchedule.isActive, 1)
        )
      )
      .execute();

    if (classes.length === 0) return [];

    const now = nowCST();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = daysOfWeek[now.getDay()];
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const currentDayIndex = dayOrder.indexOf(currentDay);

    const sorted = classes.sort((a, b) => {
      const aDayIndex = dayOrder.indexOf(a.dayOfWeek);
      const bDayIndex = dayOrder.indexOf(b.dayOfWeek);
      let daysUntilA = (aDayIndex - currentDayIndex + 7) % 7;
      let daysUntilB = (bDayIndex - currentDayIndex + 7) % 7;
      if (daysUntilA === 0 && isClassTimePassed(a.startTime, now)) daysUntilA = 7;
      if (daysUntilB === 0 && isClassTimePassed(b.startTime, now)) daysUntilB = 7;
      if (daysUntilA !== daysUntilB) return daysUntilA - daysUntilB;
      return a.startTime.localeCompare(b.startTime);
    });

    return sorted.slice(0, limit);
  } catch (err) {
    console.error("[SMS Booking] Failed to fetch class slots:", err);
    return [];
  }
}

// Format a slot for display: "Monday at 5:00 PM – 6:00 PM"
function formatSlot(slot: { dayOfWeek: string; startTime: string; endTime: string }): string {
  return `${slot.dayOfWeek} at ${slot.startTime} – ${slot.endTime}`;
}

// Build the time selection menu message
function buildTimeMenu(programLabel: string, slots: Array<{ dayOfWeek: string; startTime: string; endTime: string; instructor: string | null }>): string {
  if (slots.length === 0) {
    return `Here are the available times for ${programLabel}:\n\nReply with your preferred day and time and we'll get you set up!`;
  }
  const lines = slots.map((s, i) => {
    const instructor = s.instructor ? ` (${s.instructor})` : "";
    return `${i + 1}. ${formatSlot(s)}${instructor}`;
  });
  lines.push(`${slots.length + 1}. Different time — I'll suggest one`);
  return `Here are the next available ${programLabel} classes:\n\n${lines.join("\n")}\n\nReply with a number to pick your slot!`;
}

// Parse which slot number the user picked
function parseSlotChoice(input: string, count: number): number | null {
  const trimmed = input.trim();
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= count + 1) return num;
  return null;
}

// ─── State machine messages ───────────────────────────────────────────────────

export const BOOKING_MESSAGES = {
  start: `Awesome! Let's get you set up for a FREE trial class 🥋\n\nFirst, what's your name?`,

  askProgram: (name: string) =>
    `Nice to meet you, ${name}! Which program are you interested in?\n\n1. Little Ninjas (ages 3–5)\n2. Core Kids (ages 5–12)\n3. Teens (ages 13–17)\n4. Teens & Adults (ages 13+)\n5. Kickboxing\n6. Not Sure — Help Me Choose\n\nReply with a number or the program name.`,

  confirm: (name: string, program: string, time: string) =>
    `You're all set, ${name}! ✅\n\nFREE Trial: ${program}\nTime: ${time}\n\nWe'll send you a reminder before your class. See you on the mat! 🥋\n\nQuestions? Call (877) 4-MYDOJO`,

  alreadyBooked: `You already have a free trial scheduled! Call us at (877) 4-MYDOJO if you need to make any changes.`,

  cancel: `No problem! If you ever want to book a free trial, just say "book a trial" and we'll get you set up. 😊`,

  notSureHelp: (name: string) =>
    `No worries, ${name}! Here's a quick guide:\n\n🥋 Ages 3–5 → Little Ninjas\n🥋 Ages 5–12 → Core Kids\n🥋 Ages 13–17 → Teens\n🥋 Ages 13+ → Teens & Adults\n🥊 All ages → Kickboxing\n\nWhich sounds like the best fit? Reply with a number 1–5.`,
};

// ─── Booking intent detector ──────────────────────────────────────────────────

export function isBookingIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("book") ||
    lower.includes("schedule") ||
    lower.includes("sign up") ||
    lower.includes("sign-up") ||
    lower.includes("free trial") ||
    lower.includes("free class") ||
    lower.includes("try a class") ||
    lower.includes("come in") ||
    lower.includes("start") ||
    lower.includes("register") ||
    lower.includes("enroll")
  );
}

export function isCancelBooking(message: string): boolean {
  const lower = message.toLowerCase().trim();
  return lower === "cancel" || lower === "no" || lower === "nevermind" || lower === "never mind" || lower === "stop booking";
}

// ─── Main booking handler ─────────────────────────────────────────────────────

/**
 * Processes a message in the context of the booking state machine.
 * Returns a reply string if the booking flow handled this message,
 * or null if the message should be handled by the normal AI flow.
 */
export async function handleBookingFlow(
  conv: {
    id: number;
    phone: string;
    contactName: string | null;
    bookingState: string | null;
    bookingName: string | null;
    bookingProgram: string | null;
    bookingPreferredTime: string | null;
  },
  inboundMessage: string
): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const state = conv.bookingState ?? "idle";
  const msg = inboundMessage.trim();

  // ── Cancel mid-flow ──────────────────────────────────────────────────────
  if (state !== "idle" && state !== "confirmed" && isCancelBooking(msg)) {
    await db
      .update(smsConversations)
      .set({ bookingState: "idle", bookingName: null, bookingProgram: null, bookingPreferredTime: null })
      .where(eq(smsConversations.id, conv.id));
    return BOOKING_MESSAGES.cancel;
  }

  // ── Already confirmed — don't re-enter flow ──────────────────────────────
  if (state === "confirmed" && isBookingIntent(msg)) {
    return BOOKING_MESSAGES.alreadyBooked;
  }

  // ── IDLE: detect booking intent ──────────────────────────────────────────
  if (state === "idle") {
    if (!isBookingIntent(msg)) return null; // Let normal AI handle it

    await db
      .update(smsConversations)
      .set({ bookingState: "awaiting_name" })
      .where(eq(smsConversations.id, conv.id));

    return BOOKING_MESSAGES.start;
  }

  // ── AWAITING NAME ────────────────────────────────────────────────────────
  if (state === "awaiting_name") {
    const name = msg.replace(/[^a-zA-Z\s'-]/g, "").trim();
    if (!name || name.length < 2) {
      return "I didn't catch that — what's your name?";
    }

    await db
      .update(smsConversations)
      .set({ bookingState: "awaiting_program", bookingName: name })
      .where(eq(smsConversations.id, conv.id));

    return BOOKING_MESSAGES.askProgram(name);
  }

  // ── AWAITING PROGRAM ─────────────────────────────────────────────────────
  if (state === "awaiting_program") {
    const programKey = parseProgram(msg);
    if (!programKey) {
      return `Please reply with a number 1–6 to choose a program:\n1. Little Ninjas (3–5)\n2. Core Kids (5–12)\n3. Teens (13–17)\n4. Teens & Adults (13+)\n5. Kickboxing\n6. Not Sure`;
    }

    const programOption = PROGRAM_OPTIONS.find((p) => p.key === programKey)!;
    const name = conv.bookingName ?? "there";

    // "Not Sure" — give guidance and re-ask
    if (programKey === "6" || !programOption.dbName) {
      return BOOKING_MESSAGES.notSureHelp(name);
    }

    // Fetch real upcoming class slots from DB
    const slots = await getUpcomingSlots(programOption.dbName);

    // Store slots in bookingPreferredTime as JSON so we can reference them in the next step
    const slotsJson = JSON.stringify(slots);

    await db
      .update(smsConversations)
      .set({
        bookingState: "awaiting_time_selection",
        bookingProgram: programOption.label,
        bookingPreferredTime: slotsJson,
      })
      .where(eq(smsConversations.id, conv.id));

    return buildTimeMenu(programOption.label, slots);
  }

  // ── AWAITING TIME SELECTION ──────────────────────────────────────────────
  if (state === "awaiting_time_selection") {
    const name = conv.bookingName ?? "there";
    const programLabel = conv.bookingProgram ?? "the program";

    // Parse stored slots from JSON
    let slots: Array<{ dayOfWeek: string; startTime: string; endTime: string; instructor: string | null }> = [];
    try {
      slots = JSON.parse(conv.bookingPreferredTime ?? "[]");
    } catch {
      slots = [];
    }

    const choice = parseSlotChoice(msg, slots.length);

    if (choice === null) {
      // Couldn't parse — re-show the menu
      return buildTimeMenu(programLabel, slots);
    }

    let confirmedTime: string;

    if (choice === slots.length + 1 || slots.length === 0) {
      // "Different time" or no slots available — ask for free-text preference
      await db
        .update(smsConversations)
        .set({ bookingState: "awaiting_time_freetext", bookingPreferredTime: null })
        .where(eq(smsConversations.id, conv.id));
      return `No problem! What days and times work best for you? (e.g. "Monday evenings" or "Saturday morning")`;
    } else {
      // Valid slot chosen
      const chosen = slots[choice - 1];
      confirmedTime = formatSlot(chosen);
    }

    // Map program label to enum value
    const programEnumValue = (() => {
      const key = PROGRAM_OPTIONS.find((p) => p.label === programLabel)?.key ?? "6";
      return PROGRAM_ENUM_MAP[key] ?? "Not Sure";
    })();

    // Save confirmed state
    await db
      .update(smsConversations)
      .set({
        bookingState: "confirmed",
        bookingPreferredTime: confirmedTime,
        contactName: conv.contactName ?? name,
      })
      .where(eq(smsConversations.id, conv.id));

    // Create the trial signup record
    try {
      await db.insert(trialSignups).values({
        name,
        phone: conv.phone,
        program: programEnumValue,
        preferredDays: "Either",
        message: `Booked via SMS. Slot: ${confirmedTime}`,
        location: "Tomball HQ",
        source: "sms_ai",
        status: "new",
        preferredContactMethod: "text",
      });
    } catch (err) {
      console.error("[SMS Booking] Failed to insert trialSignup:", err);
    }

    // Notify staff
    try {
      await notifyOwner({
        title: "New SMS Trial Booking",
        content: `${name} (${conv.phone}) booked a free trial via SMS.\nProgram: ${programLabel}\nSlot: ${confirmedTime}`,
      });
    } catch (err) {
      console.error("[SMS Booking] Failed to notify owner:", err);
    }

    return BOOKING_MESSAGES.confirm(name, programLabel, confirmedTime);
  }

  // ── AWAITING FREE-TEXT TIME (fallback when no slots or "different time") ─
  if (state === "awaiting_time_freetext") {
    const preferredTime = msg.substring(0, 255);
    const name = conv.bookingName ?? "there";
    const program = conv.bookingProgram ?? "the program";

    const programEnumValue = (() => {
      const key = PROGRAM_OPTIONS.find((p) => p.label === program)?.key ?? "6";
      return PROGRAM_ENUM_MAP[key] ?? "Not Sure";
    })();

    await db
      .update(smsConversations)
      .set({
        bookingState: "confirmed",
        bookingPreferredTime: preferredTime,
        contactName: conv.contactName ?? name,
      })
      .where(eq(smsConversations.id, conv.id));

    try {
      await db.insert(trialSignups).values({
        name,
        phone: conv.phone,
        program: programEnumValue,
        preferredDays: "Either",
        message: `Preferred time (free text): ${preferredTime}`,
        location: "Tomball HQ",
        source: "sms_ai",
        status: "new",
        preferredContactMethod: "text",
      });
    } catch (err) {
      console.error("[SMS Booking] Failed to insert trialSignup:", err);
    }

    try {
      await notifyOwner({
        title: "New SMS Trial Booking",
        content: `${name} (${conv.phone}) booked a free trial via SMS.\nProgram: ${program}\nPreferred time: ${preferredTime}`,
      });
    } catch (err) {
      console.error("[SMS Booking] Failed to notify owner:", err);
    }

    return BOOKING_MESSAGES.confirm(name, program, preferredTime);
  }

  return null; // Not in a booking state — let AI handle it
}
