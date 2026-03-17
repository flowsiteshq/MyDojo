/**
 * GHL Contact Sync Job
 * Runs every 30 minutes to pull new contacts from GHL and import them into trialSignups.
 * Skips duplicates by phone number. Texts all staff for each new lead.
 */
import { getDb } from "./db";
import { trialSignups, users } from "../drizzle/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import { sendSms } from "./sms800";
import { ENV } from "./_core/env";

const GHL_LOCATION_ID = "7XJ40jhVRP9b804WIxYj";

interface GHLContact {
  id: string;
  contactName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  dateAdded?: string;
}

async function fetchGHLContacts(): Promise<GHLContact[]> {
  const apiKey = ENV.GHL_API_KEY;
  if (!apiKey) {
    console.warn("[GHLSync] GHL_API_KEY not set, skipping sync.");
    return [];
  }

  let allContacts: GHLContact[] = [];
  let nextPageUrl: string | null = null;
  let page = 1;

  do {
    const url: string =
      nextPageUrl ||
      `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&limit=100&sortBy=date_added&order=desc`;

    const res: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[GHLSync] API error (page ${page}):`, res.status, errText);
      break;
    }

    const data: { contacts?: GHLContact[]; meta?: { nextPageUrl?: string } } = await res.json();
    const contacts: GHLContact[] = data.contacts || [];
    allContacts = allContacts.concat(contacts);
    console.log(`[GHLSync] Page ${page}: fetched ${contacts.length} contacts (total: ${allContacts.length})`);

    nextPageUrl = data.meta?.nextPageUrl || null;
    page++;
  } while (nextPageUrl);

  return allContacts;
}

const VALID_PROGRAMS = [
  "Kickboxing",
  "Little Ninjas",
  "Dragon Kids",
  "Teens",
  "Adult Karate",
  "After School",
  "Summer Camp",
  "Not Sure",
] as const;

type Program = (typeof VALID_PROGRAMS)[number];

function mapProgram(tags?: string[]): Program {
  if (!tags || tags.length === 0) return "Not Sure";
  const tagStr = tags.join(" ").toLowerCase();
  if (tagStr.includes("kickboxing")) return "Kickboxing";
  if (tagStr.includes("little ninja")) return "Little Ninjas";
  if (tagStr.includes("dragon kid") || tagStr.includes("core kid")) return "Dragon Kids";
  if (tagStr.includes("teen")) return "Teens";
  if (tagStr.includes("adult karate") || tagStr.includes("karate")) return "Adult Karate";
  if (tagStr.includes("after school")) return "After School";
  if (tagStr.includes("summer camp")) return "Summer Camp";
  return "Not Sure";
}

export async function runGHLSyncJob(): Promise<void> {
  console.log("[GHLSync] Starting GHL contact sync...");

  try {
    const contacts = await fetchGHLContacts();
    if (contacts.length === 0) {
      console.log("[GHLSync] No contacts fetched.");
      return;
    }

    const db = await getDb();
    if (!db) {
      console.error("[GHLSync] Database not available, skipping sync.");
      return;
    }

    // Get all existing phones from DB
    const existingLeads = await db
      .select({ phone: trialSignups.phone })
      .from(trialSignups)
      .where(isNotNull(trialSignups.phone));

    const existingPhones = new Set(
      existingLeads.map((r: { phone: string | null }) => (r.phone || "").replace(/\D/g, ""))
    );

    // Get staff with SMS notifications enabled
    const staffList = await db
      .select({ name: users.name, phone: users.phone })
      .from(users)
      .where(and(eq(users.leadSmsNotify, 1), isNotNull(users.phone)));

    let imported = 0;
    let skipped = 0;

    for (const contact of contacts) {
      const rawPhone = contact.phone || "";
      const normalizedPhone = rawPhone.replace(/\D/g, "");
      const name =
        contact.contactName ||
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
      const email = contact.email || "";

      if (!normalizedPhone || !name) {
        skipped++;
        continue;
      }

      if (existingPhones.has(normalizedPhone)) {
        skipped++;
        continue;
      }

      const source = `ghl:${contact.source || "GHL"}`;
      const program = mapProgram(contact.tags);
      const createdAt = contact.dateAdded ? new Date(contact.dateAdded) : new Date();

      await db.insert(trialSignups).values({
        name,
        email,
        phone: rawPhone,
        program,
        location: "Tomball HQ",
        preferredContactMethod: "phone",
        status: "new",
        source,
        introCountRequired: 0,
        introCountBooked: 0,
        introCountCompleted: 0,
        dojoFlowSyncStatus: "pending",
        dojoFlowSyncAttempts: 0,
        createdAt,
        updatedAt: new Date(),
      });

      existingPhones.add(normalizedPhone);
      imported++;
      console.log(`[GHLSync] ✓ Imported: ${name} (${rawPhone})`);

      // Notify all staff
      const msg = `🥋 New Lead: ${name} | Phone: ${rawPhone}${email ? " | Email: " + email : ""} | Source: ${source}`;
      for (const staff of staffList) {
        if (staff.phone) {
          await sendSms({ to: staff.phone, message: msg }).catch((e) =>
            console.error(`[GHLSync] SMS error to ${staff.name}:`, e.message)
          );
        }
      }
    }

    console.log(
      `[GHLSync] ✅ Done. Imported: ${imported}, Skipped: ${skipped}`
    );
  } catch (err) {
    console.error("[GHLSync] Error during sync:", err);
  }
}
