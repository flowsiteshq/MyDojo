/**
 * Facebook Lead Ads Webhook Handler
 *
 * Receives lead events from Facebook Lead Ads and stores them in the
 * trialSignups table so they appear in the admin Leads dashboard.
 *
 * Setup in Facebook:
 *   1. Go to Facebook Developers → Your App → Webhooks
 *   2. Subscribe to the "leadgen" object
 *   3. Callback URL: https://mydojoma.com/api/facebook/webhook
 *   4. Verify Token: set FACEBOOK_WEBHOOK_VERIFY_TOKEN in env
 *   5. Also set FACEBOOK_PAGE_ACCESS_TOKEN to fetch lead field data
 *
 * Flow:
 *   Facebook sends a notification with leadgen_id → we fetch the full
 *   lead form data from the Graph API using the page access token.
 */

import { Request, Response } from "express";
import { getDb } from "./db";
import { trialSignups } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { notifyStaffNewLead } from "./notifyStaffNewLead";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacebookLeadField {
  name: string;
  values: string[];
}

interface FacebookLeadData {
  id: string;
  created_time: number;
  field_data: FacebookLeadField[];
}

interface FacebookWebhookEntry {
  id: string;         // Page ID
  time: number;
  changes: Array<{
    value: {
      leadgen_id: string;
      page_id: string;
      form_id: string;
      ad_id?: string;
      ad_name?: string;
      adset_id?: string;
      adset_name?: string;
      campaign_id?: string;
      campaign_name?: string;
      created_time: number;
    };
    field: string;    // "leadgen"
  }>;
}

interface FacebookWebhookPayload {
  object: string;     // "page"
  entry: FacebookWebhookEntry[];
}

// ─── Program inference from Facebook ad/form data ─────────────────────────────

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

function inferProgramFromFacebook(
  adName: string = "",
  campaignName: string = "",
  adsetName: string = "",
  programField: string = ""
): ValidProgram {
  const combined = [adName, campaignName, adsetName, programField]
    .join(" ")
    .toLowerCase();

  if (combined.includes("kickboxing")) return "Kickboxing";
  if (combined.includes("little ninja")) return "Little Ninjas";
  if (combined.includes("dragon kid")) return "Dragon Kids";
  if (combined.includes("teen")) return "Teens";
  if (combined.includes("after school")) return "After School";
  if (combined.includes("summer camp")) return "Summer Camp";
  if (combined.includes("adult karate") || combined.includes("karate")) return "Adult Karate";

  return "Not Sure";
}

// ─── Fetch full lead data from Facebook Graph API ─────────────────────────────

async function fetchLeadData(leadgenId: string): Promise<FacebookLeadData | null> {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("[Facebook Webhook] FACEBOOK_PAGE_ACCESS_TOKEN not set — cannot fetch lead data");
    return null;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Facebook Webhook] Graph API error for lead ${leadgenId}: ${errorText}`);
      return null;
    }
    return (await response.json()) as FacebookLeadData;
  } catch (error) {
    console.error(`[Facebook Webhook] Failed to fetch lead ${leadgenId}:`, error);
    return null;
  }
}

// ─── GET: Webhook verification handshake ─────────────────────────────────────

export function verifyFacebookWebhook(req: Request, res: Response) {
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Facebook Webhook] Verification successful");
    return res.status(200).send(challenge);
  }

  console.warn("[Facebook Webhook] Verification failed — token mismatch");
  return res.status(403).json({ error: "Verification failed" });
}

// ─── POST: Lead event handler ─────────────────────────────────────────────────

export async function handleFacebookWebhook(req: Request, res: Response) {
  try {
    // Acknowledge immediately — Facebook requires a 200 within 20 seconds
    res.status(200).json({ received: true });

    const payload = req.body as FacebookWebhookPayload;

    if (payload.object !== "page") {
      console.log(`[Facebook Webhook] Ignoring non-page object: ${payload.object}`);
      return;
    }

    const db = await getDb();
    if (!db) {
      console.error("[Facebook Webhook] Database not available");
      return;
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;

        const { leadgen_id, ad_name, campaign_name, adset_name } = change.value;

        // Deduplicate: skip if we already have this leadgen_id
        const existing = await db
          .select({ id: trialSignups.id })
          .from(trialSignups)
          .where(eq(trialSignups.ghlContactId, `fb:${leadgen_id}`))
          .limit(1);

        if (existing.length > 0) {
          console.log(`[Facebook Webhook] Lead ${leadgen_id} already exists, skipping`);
          continue;
        }

        // Fetch full lead form data from Graph API
        const leadData = await fetchLeadData(leadgen_id);

        if (!leadData) {
          // Store a placeholder with just the leadgen_id so we can retry later
          console.warn(`[Facebook Webhook] Could not fetch lead data for ${leadgen_id} — storing placeholder`);
          await db.insert(trialSignups).values({
            name: "Facebook Lead (pending)",
            phone: "0000000000",
            program: "Not Sure",
            location: "Tomball HQ",
            preferredContactMethod: "phone",
            status: "new",
            source: "facebook",
            ghlContactId: `fb:${leadgen_id}`,
            introCountRequired: 0,
            introCountBooked: 0,
            introCountCompleted: 0,
            dojoFlowSyncStatus: "pending",
            dojoFlowSyncAttempts: 0,
            notes: `Facebook Lead ID: ${leadgen_id}\nAd: ${ad_name || "unknown"}\nCampaign: ${campaign_name || "unknown"}`,
          });
          continue;
        }

        // Parse field_data into a flat map
        const fields: Record<string, string> = {};
        for (const field of leadData.field_data || []) {
          fields[field.name.toLowerCase()] = field.values[0] || "";
        }

        // Extract standard fields
        const firstName = fields["first_name"] || fields["full_name"]?.split(" ")[0] || "";
        const lastName = fields["last_name"] || fields["full_name"]?.split(" ").slice(1).join(" ") || "";
        const fullName = fields["full_name"] || `${firstName} ${lastName}`.trim() || "Facebook Lead";
        const email = fields["email"] || null;
        const phone = fields["phone_number"] || fields["phone"] || fields["mobile_number"] || "";
        const programField = fields["program"] || fields["interested_in"] || fields["class_interest"] || "";

        if (!phone) {
          console.warn(`[Facebook Webhook] Lead ${leadgen_id} has no phone number — storing with placeholder`);
        }

        const program = inferProgramFromFacebook(ad_name, campaign_name, adset_name, programField);

        await db.insert(trialSignups).values({
          name: fullName,
          email: email || undefined,
          phone: phone || "0000000000",
          program,
          location: "Tomball HQ",
          preferredContactMethod: "phone",
          status: "new",
          source: "facebook",
          ghlContactId: `fb:${leadgen_id}`,
          introCountRequired: 0,
          introCountBooked: 0,
          introCountCompleted: 0,
          dojoFlowSyncStatus: "pending",
          dojoFlowSyncAttempts: 0,
          notes: `Facebook Lead ID: ${leadgen_id}\nAd: ${ad_name || "unknown"}\nCampaign: ${campaign_name || "unknown"}`,
        });

        console.log(`[Facebook Webhook] Lead created: ${fullName} (${phone}) — program: ${program} — ad: ${ad_name || "unknown"}`);

        // Notify staff via SMS (fire-and-forget)
        notifyStaffNewLead({ name: fullName, phone: phone || undefined, program, source: 'Facebook' }).catch(() => {});

        // Notify the owner so the admin dashboard can show a confirmation
        await notifyOwner({
          title: `📘 New Facebook Lead: ${fullName}`,
          content: `Program: ${program}\nPhone: ${phone || "N/A"}\nEmail: ${email || "N/A"}\nAd: ${ad_name || "unknown"}\nCampaign: ${campaign_name || "unknown"}`,
        }).catch((err) => console.warn("[Facebook Webhook] notifyOwner failed:", err));
      }
    }
  } catch (error) {
    console.error("[Facebook Webhook] Error processing webhook:", error);
    // Don't re-throw — we already sent 200 to Facebook
  }
}
