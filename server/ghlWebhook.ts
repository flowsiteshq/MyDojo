/**
 * GoHighLevel Webhook Handler
 *
 * Receives lead/contact events from GoHighLevel and stores them in the
 * trialSignups table so they appear in the admin Intro Appointments dashboard.
 *
 * Setup in GHL:
 *   Settings → Integrations → Webhooks → Add Webhook
 *   URL: https://mydojoma.com/api/ghl/webhook
 *   Events: Contact Created, Contact Updated, Form Submitted, Opportunity Stage Changed
 *
 * Security: Set a shared secret in GHL webhook settings and add it as
 *   GHL_WEBHOOK_SECRET env variable. The handler validates the X-GHL-Signature header.
 */

import { Request, Response } from "express";
import { getDb } from "./db";
import { trialSignups } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { notifyStaffNewLead } from "./notifyStaffNewLead";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GHLContactPayload {
  type: string; // "ContactCreate" | "ContactUpdate" | "FormSubmitted" | "OpportunityStageChanged"
  locationId?: string;
  id?: string;           // GHL contact ID
  contactId?: string;    // Alternative contact ID field
  firstName?: string;
  lastName?: string;
  name?: string;         // Full name fallback
  email?: string;
  phone?: string;
  tags?: string[];
  source?: string;       // Lead source from GHL
  customField?: Record<string, string>; // Custom fields
  // Form submission fields
  formData?: Record<string, string>;
  // Opportunity fields
  opportunityName?: string;
  pipelineStageId?: string;
  pipelineStageName?: string;
}

// ─── Program mapping from GHL tags/source ─────────────────────────────────────

const VALID_PROGRAMS = [
  "Little Ninjas",
  "Dragon Kids",
  "Teens",
  "Adult Karate",
  "Kickboxing",
  "After School",
  "Summer Camp",
  "Not Sure",
] as const;

type ValidProgram = typeof VALID_PROGRAMS[number];

function inferProgram(payload: GHLContactPayload): ValidProgram {
  const tags = (payload.tags || []).map((t) => t.toLowerCase());
  const source = (payload.source || "").toLowerCase();
  const name = (payload.opportunityName || "").toLowerCase();

  if (tags.some((t) => t.includes("kickboxing")) || source.includes("kickboxing") || name.includes("kickboxing")) return "Kickboxing";
  if (tags.some((t) => t.includes("little ninja") || t.includes("little ninjas")) || source.includes("little ninja")) return "Little Ninjas";
  if (tags.some((t) => t.includes("dragon kid") || t.includes("dragon kids")) || source.includes("dragon kid")) return "Dragon Kids";
  if (tags.some((t) => t.includes("teen")) || source.includes("teen")) return "Teens";
  if (tags.some((t) => t.includes("after school")) || source.includes("after school")) return "After School";
  if (tags.some((t) => t.includes("summer camp")) || source.includes("summer camp")) return "Summer Camp";
  if (tags.some((t) => t.includes("adult karate") || t.includes("karate")) || source.includes("karate")) return "Adult Karate";

  return "Not Sure";
}

// ─── Signature verification ───────────────────────────────────────────────────

function verifyGHLSignature(req: Request): boolean {
  const secret = process.env.GHL_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured → allow (dev mode)

  const signature = req.headers["x-ghl-signature"] as string | undefined;
  if (!signature) return false;

  const body = JSON.stringify(req.body);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  // timingSafeEqual requires equal-length buffers; return false if lengths differ
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleGHLWebhook(req: Request, res: Response) {
  try {
    // Signature check
    if (!verifyGHLSignature(req)) {
      console.warn("[GHL Webhook] Invalid signature — request rejected");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = req.body as GHLContactPayload;
    const eventType = payload.type || "unknown";

    console.log(`[GHL Webhook] Received event: ${eventType}`);

    // Only process contact creation and form submission events
    const processableEvents = ["ContactCreate", "FormSubmitted", "contact.created", "form.submitted"];
    if (!processableEvents.some((e) => eventType.toLowerCase().includes(e.toLowerCase()))) {
      console.log(`[GHL Webhook] Skipping event type: ${eventType}`);
      return res.json({ received: true, processed: false, reason: "Event type not processed" });
    }

    // Extract contact info
    const ghlContactId = payload.id || payload.contactId || null;
    const firstName = payload.firstName || "";
    const lastName = payload.lastName || "";
    const fullName = payload.name || `${firstName} ${lastName}`.trim() || "Unknown";
    const email = payload.email || null;
    const rawPhone = payload.phone || "";

    // Require at minimum a name and phone
    if (!fullName || fullName === "Unknown" || !rawPhone) {
      console.warn("[GHL Webhook] Missing required fields (name or phone), skipping");
      return res.json({ received: true, processed: false, reason: "Missing name or phone" });
    }

    // Normalize phone to digits only for deduplication
    const normalizedPhone = rawPhone.replace(/\D/g, "");

    // Deduplicate: if a lead with this GHL contact ID already exists, skip
    const db = await getDb();
    if (!db) {
      console.error("[GHL Webhook] Database not available");
      return res.status(503).json({ error: "Database unavailable" });
    }

    if (ghlContactId) {
      const existing = await db
        .select({ id: trialSignups.id })
        .from(trialSignups)
        .where(eq(trialSignups.ghlContactId, ghlContactId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`[GHL Webhook] Contact ${ghlContactId} already exists (id: ${existing[0].id}), skipping`);
        return res.json({ received: true, processed: false, reason: "Duplicate contact" });
      }
    }

    // Infer program from tags/source
    const program = inferProgram(payload);

    // Build the lead source label
    const leadSource = payload.source
      ? `ghl:${payload.source}`
      : "ghl";

    // Insert into trialSignups
    await db.insert(trialSignups).values({
      name: fullName,
      email: email || undefined,
      phone: rawPhone,
      program,
      location: "Tomball HQ",
      preferredContactMethod: "phone",
      status: "new",
      source: leadSource,
      ghlContactId: ghlContactId || undefined,
      introCountRequired: 0,
      introCountBooked: 0,
      introCountCompleted: 0,
      dojoFlowSyncStatus: "pending",
      dojoFlowSyncAttempts: 0,
    });

    console.log(`[GHL Webhook] Lead created: ${fullName} (${rawPhone}) — program: ${program} — source: ${leadSource}`);

    // Notify staff via SMS (fire-and-forget)
    notifyStaffNewLead({ name: fullName, phone: rawPhone, program, source: leadSource }).catch(() => {});

    return res.json({
      received: true,
      processed: true,
      lead: {
        name: fullName,
        phone: rawPhone,
        program,
        source: leadSource,
      },
    });
  } catch (error) {
    console.error("[GHL Webhook] Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
