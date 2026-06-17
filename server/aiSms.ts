/**
 * AI SMS Assistant — MyDojo
 * Handles inbound SMS via 800.com webhook, generates AI replies,
 * and manages conversation state in the database.
 */
import { getDb } from "./db";
import { smsConversations, smsMessages, trialSignups } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendSms } from "./sms800";
import { invokeLLM } from "./_core/llm";

const MYDOJO_AI_NAME = "MyDojo Assistant";
const DOJO_PHONE = process.env.EIGHT_HUNDRED_FROM_NUMBER ?? "+18774693656";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ${MYDOJO_AI_NAME}, the friendly AI assistant for MyDojo Martial Arts & Fitness in Tomball, TX.

Your job is to help members and prospective students via SMS text message.

PERSONALITY:
- Warm, encouraging, professional — like a great front-desk staff member
- Keep responses SHORT (1-3 sentences max for SMS)
- Never use emojis
- Never use markdown formatting (no **, no #, no lists with dashes)
- Sign off as "- MyDojo Team" only on the first message in a new conversation

WHAT YOU CAN HELP WITH:
- Answer questions about programs: Little Ninjas (3-5), Dragon Kids (5-12), Teens & Adults (13+), Kickboxing, After School, Summer Camp
- Class schedule: Mon-Fri 5pm-7pm, Sat 9am-12pm (Tomball HQ: 23511 FM 2920, Tomball TX 77377)
- Pricing: Free trial class available. Monthly memberships start at $119/month.
- Book a free trial class (direct them to call/text (877) 4-MYDOJO or visit mydojoma.com)
- Answer questions about the facility, parking, what to wear, age requirements
- Re-engage inactive members with encouragement

IMPORTANT RULES:
- If someone says STOP, UNSUBSCRIBE, QUIT, CANCEL, or END — acknowledge and do NOT reply further
- If someone asks for a human, say: "I'll have a staff member reach out to you shortly!"
- If you don't know something specific, say: "Great question! Give us a call at (877) 4-MYDOJO and our team can help you right away."
- Never make up prices, schedules, or policies you are not sure about
- Keep every reply under 160 characters when possible (SMS limit)

LOCATION INFO:
- MyDojo HQ: 23511 FM 2920, Tomball, TX 77377
- Phone: (877) 4-MYDOJO
- Website: mydojoma.com`;

// ─── Conversation helpers ─────────────────────────────────────────────────────

export async function getOrCreateConversation(phone: string, contactName?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.phone, phone))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Try to find a name from trialSignups
  let name = contactName;
  if (!name) {
    const dbInner = await getDb();
    if (dbInner) {
      const lead = await dbInner
        .select({ name: trialSignups.name })
        .from(trialSignups)
        .where(eq(trialSignups.phone, phone))
        .limit(1);
      if (lead.length > 0) name = lead[0].name;
    }
  }

  const [created] = await db
    .insert(smsConversations)
    .values({ phone, contactName: name ?? null })
    .$returningId();

  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");
  const [conv] = await db2
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.id, created.id))
    .limit(1);
  return conv;
}

export async function saveMessage(
  conversationId: number,
  direction: "inbound" | "outbound",
  senderType: "ai" | "human" | "campaign" | "member",
  body: string,
  externalId?: string,
  status: "pending" | "sent" | "delivered" | "failed" | "received" = "received"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(smsMessages).values({
    conversationId,
    direction,
    senderType,
    body,
    externalId: externalId ?? null,
    status,
  });

  // Update conversation's lastMessageAt
  await db
    .update(smsConversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(smsConversations.id, conversationId));
}

// ─── AI Reply Generator ───────────────────────────────────────────────────────

export async function generateAiReply(
  conversationId: number,
  inboundMessage: string,
  contactName?: string | null
): Promise<string | null> {
  // Fetch last 10 messages for context
  const db = await getDb();
  if (!db) return null;
  const history = await db
    .select()
    .from(smsMessages)
    .where(eq(smsMessages.conversationId, conversationId))
    .orderBy(desc(smsMessages.createdAt))
    .limit(10);

  const historyMessages = history.reverse().map((msg: typeof history[0]) => ({
    role: msg.direction === "inbound" ? ("user" as const) : ("assistant" as const),
    content: msg.body,
  }));

  const systemWithName = contactName
    ? `${SYSTEM_PROMPT}\n\nThe member's name is ${contactName}. Address them by first name when natural.`
    : SYSTEM_PROMPT;

  const messages = [
    { role: "system" as const, content: systemWithName },
    ...historyMessages,
    { role: "user" as const, content: inboundMessage },
  ];

  try {
    const response = await invokeLLM({ messages });
    const reply = response?.choices?.[0]?.message?.content as string | undefined;
    return reply ?? null;
  } catch (err) {
    console.error("[AI SMS] LLM error:", err);
    return null;
  }
}

// ─── Opt-out detector ─────────────────────────────────────────────────────────

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "quit", "cancel", "end", "optout", "opt out", "opt-out"];

export function isOptOut(message: string): boolean {
  const lower = message.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + " "));
}

export function isHumanRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("speak to someone") ||
    lower.includes("talk to a person") ||
    lower.includes("real person") ||
    lower.includes("human") ||
    lower.includes("agent") ||
    lower.includes("staff")
  );
}

// ─── Main inbound handler ─────────────────────────────────────────────────────

export interface InboundSmsPayload {
  id?: number;
  recipient: string; // Our number
  sender: string;    // Member's number
  inbound: boolean;
  message: string | null;
  media?: string[];
}

export async function handleInboundSms(payload: InboundSmsPayload): Promise<void> {
  const { sender, message, id: externalId } = payload;
  const body = (message ?? "").trim();

  if (!body && (!payload.media || payload.media.length === 0)) return;

  console.log(`[AI SMS] Inbound from ${sender}: "${body}"`);

  // Get or create conversation
  const conv = await getOrCreateConversation(sender);
  const db = await getDb();
  if (!db) { console.error("[AI SMS] DB not available"); return; }

  // Save inbound message
  await saveMessage(
    conv.id,
    "inbound",
    "member",
    body || "[Media message]",
    externalId ? String(externalId) : undefined,
    "received"
  );

  // Handle opt-out
  if (isOptOut(body)) {
    await db
      .update(smsConversations)
      .set({ optedOut: true, aiEnabled: false } as Partial<typeof smsConversations.$inferInsert>)
      .where(eq(smsConversations.id, conv.id));

    const optOutReply = "You have been unsubscribed from MyDojo messages. Reply START to resubscribe. Msg&Data rates may apply.";
    const result = await sendSms({ to: sender, message: optOutReply });
    await saveMessage(conv.id, "outbound", "ai", optOutReply, result.messageId, result.success ? "sent" : "failed");
    return;
  }

  // Handle opt-in (START)
  if (body.toLowerCase() === "start") {
    await db
      .update(smsConversations)
      .set({ optedOut: false, aiEnabled: true } as Partial<typeof smsConversations.$inferInsert>)
      .where(eq(smsConversations.id, conv.id));
  }

  // Don't reply if opted out or AI disabled
  if (conv.optedOut || !conv.aiEnabled) {
    console.log(`[AI SMS] Skipping reply — opted out or AI disabled for ${sender}`);
    return;
  }

  // Handle human request — disable AI, notify admin
  if (isHumanRequest(body)) {
    await db
      .update(smsConversations)
      .set({ aiEnabled: false } as Partial<typeof smsConversations.$inferInsert>)
      .where(eq(smsConversations.id, conv.id));

    const humanReply = "I'll have a staff member reach out to you shortly! You can also call us at (877) 4-MYDOJO.";
    const result = await sendSms({ to: sender, message: humanReply });
    await saveMessage(conv.id, "outbound", "ai", humanReply, result.messageId, result.success ? "sent" : "failed");
    return;
  }

  // Generate AI reply
  const aiReply = await generateAiReply(conv.id, body, conv.contactName);
  if (!aiReply) {
    console.error(`[AI SMS] No AI reply generated for conversation ${conv.id}`);
    return;
  }

  // Send the reply
  const result = await sendSms({ to: sender, message: aiReply });
  await saveMessage(conv.id, "outbound", "ai", aiReply, result.messageId, result.success ? "sent" : "failed");

  console.log(`[AI SMS] Replied to ${sender}: "${aiReply}" (success: ${result.success})`);
}

// ─── Outbound proactive SMS ───────────────────────────────────────────────────

export async function sendProactiveSms(
  phone: string,
  message: string,
  senderType: "ai" | "campaign" = "ai",
  contactName?: string
): Promise<{ success: boolean; error?: string }> {
  const conv = await getOrCreateConversation(phone, contactName);

  if (conv.optedOut) {
    return { success: false, error: "Contact has opted out" };
  }

  const result = await sendSms({ to: phone, message });
  await saveMessage(conv.id, "outbound", senderType, message, result.messageId, result.success ? "sent" : "failed");

  return result;
}
