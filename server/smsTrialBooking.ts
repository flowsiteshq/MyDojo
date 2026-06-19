/**
 * SMS Trial Booking State Machine
 *
 * Guides a prospective student through booking a free trial class via SMS.
 * Flow: idle → awaiting_name → awaiting_program → awaiting_time → confirmed
 *
 * The state is stored in smsConversations.bookingState so it persists
 * across messages. Once confirmed, a trialSignup record is created and
 * staff are notified.
 */
import { getDb } from "./db";
import { smsConversations, trialSignups } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// ─── Program options shown to the user ───────────────────────────────────────

export const PROGRAM_OPTIONS = [
  { key: "1", label: "Little Ninjas (ages 3–5)" },
  { key: "2", label: "Core Kids (ages 5–12)" },
  { key: "3", label: "Teens & Adults (ages 13+)" },
  { key: "4", label: "Kickboxing" },
  { key: "5", label: "Not Sure — Help Me Choose" },
];

// Map numeric choice → trialSignups.program enum value
const PROGRAM_ENUM_MAP: Record<string, "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "Not Sure"> = {
  "1": "Little Ninjas",
  "2": "Dragon Kids",
  "3": "Teens",
  "4": "Kickboxing",
  "5": "Not Sure",
};

// Also accept natural-language program names
function parseProgram(input: string): string | null {
  const lower = input.toLowerCase().trim();
  if (lower === "1" || lower.includes("little ninja") || lower.includes("3-5") || lower.includes("3 to 5")) return "1";
  if (lower === "2" || lower.includes("core kid") || lower.includes("dragon kid") || lower.includes("5-12") || lower.includes("kids")) return "2";
  if (lower === "3" || lower.includes("teen") || lower.includes("adult") || lower.includes("karate")) return "3";
  if (lower === "4" || lower.includes("kickbox")) return "4";
  if (lower === "5" || lower.includes("not sure") || lower.includes("help") || lower.includes("unsure")) return "5";
  return null;
}

// ─── State machine messages ───────────────────────────────────────────────────

export const BOOKING_MESSAGES = {
  start: `Awesome! Let's get you set up for a FREE trial class. First, what's your name?`,

  askProgram: (name: string) =>
    `Nice to meet you, ${name}! Which program are you interested in?\n1. Little Ninjas (ages 3–5)\n2. Core Kids (ages 5–12)\n3. Teens & Adults (ages 13+)\n4. Kickboxing\n5. Not Sure\nReply with a number or the program name.`,

  askTime: (program: string) =>
    `Great choice! For ${program}, what days and times work best for you? (e.g. "Monday evenings" or "Saturday morning")`,

  confirm: (name: string, program: string, time: string) =>
    `You're all set, ${name}! We've reserved your FREE trial for ${program} — we'll reach out to confirm the exact time around "${time}". See you on the mat! Call us at (877) 4-MYDOJO with any questions.`,

  alreadyBooked: `You already have a free trial scheduled! Call us at (877) 4-MYDOJO if you need to make any changes.`,

  cancel: `No problem! If you ever want to book a free trial, just say "book a trial" and we'll get you set up.`,
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
      return `Please reply with a number 1–5 to choose a program:\n1. Little Ninjas (3–5)\n2. Core Kids (5–12)\n3. Teens & Adults (13+)\n4. Kickboxing\n5. Not Sure`;
    }

    const programLabel = PROGRAM_OPTIONS.find((p) => p.key === programKey)?.label ?? "Not Sure";

    await db
      .update(smsConversations)
      .set({ bookingState: "awaiting_time", bookingProgram: programLabel })
      .where(eq(smsConversations.id, conv.id));

    return BOOKING_MESSAGES.askTime(programLabel);
  }

  // ── AWAITING TIME ────────────────────────────────────────────────────────
  if (state === "awaiting_time") {
    const preferredTime = msg.substring(0, 255);
    const name = conv.bookingName ?? "there";
    const program = conv.bookingProgram ?? "the program";

    // Map program label back to enum value
    const programEnumValue = (() => {
      const key = PROGRAM_OPTIONS.find((p) => p.label === program)?.key ?? "5";
      return PROGRAM_ENUM_MAP[key] ?? "Not Sure";
    })();

    // Save the booking state
    await db
      .update(smsConversations)
      .set({
        bookingState: "confirmed",
        bookingPreferredTime: preferredTime,
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
        message: `Preferred time: ${preferredTime}`,
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
        content: `${name} (${conv.phone}) booked a free trial via SMS.\nProgram: ${program}\nPreferred time: ${preferredTime}`,
      });
    } catch (err) {
      console.error("[SMS Booking] Failed to notify owner:", err);
    }

    return BOOKING_MESSAGES.confirm(name, program, preferredTime);
  }

  return null; // Not in a booking state — let AI handle it
}
