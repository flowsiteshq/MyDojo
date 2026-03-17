import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'mydojo-website/.env') });

const API_KEY = 'pit-8cfbccc2-d059-4a37-b400-89ad890dd0e8';
const LOCATION_ID = '7XJ40jhVRP9b804WIxYj';

// ── helpers ──────────────────────────────────────────────────────────────────
function inferProgram(contact) {
  const tags = (contact.tags || []).map(t => t.toLowerCase());
  const source = (contact.source || '').toLowerCase();
  const name = (contact.contactName || '').toLowerCase();

  if (tags.some(t => t.includes('kickbox') || t.includes('kbx'))) return 'Kickboxing';
  if (tags.some(t => t.includes('summer camp'))) return 'Summer Camp';
  if (tags.some(t => t.includes('little ninja'))) return 'Little Ninjas';
  if (tags.some(t => t.includes('dragon kid'))) return 'Dragon Kids';
  if (tags.some(t => t.includes('teen'))) return 'Teens';
  if (tags.some(t => t.includes('after school'))) return 'After School';
  if (tags.some(t => t.includes('adult karate') || t.includes('karate'))) return 'Adult Karate';
  if (tags.some(t => t.includes('challenge'))) return 'Kickboxing'; // challenge = kickboxing promo
  if (source.includes('kickbox')) return 'Kickboxing';
  if (source.includes('karate')) return 'Adult Karate';
  return 'Not Sure';
}

function buildSource(contact) {
  const src = (contact.source || '').toLowerCase();
  if (src.includes('facebook')) return 'ghl:Facebook Ads';
  if (src.includes('google')) return 'ghl:Google Ads';
  if (src.includes('referral')) return 'ghl:Referral';
  if (src.includes('website')) return 'ghl:Website';
  return contact.source ? `ghl:${contact.source}` : 'ghl';
}

// ── fetch all GHL contacts (paginated) ───────────────────────────────────────
async function fetchAllContacts() {
  const contacts = [];
  let startAfter = null;
  let startAfterId = null;
  let page = 1;

  while (true) {
    let url = `https://services.leadconnectorhq.com/contacts/?locationId=${LOCATION_ID}&limit=100`;
    if (startAfter && startAfterId) {
      url += `&startAfter=${startAfter}&startAfterId=${startAfterId}`;
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`GHL API error: ${res.status} ${await res.text()}`);
      break;
    }

    const data = await res.json();
    const batch = data.contacts || [];
    contacts.push(...batch);
    console.log(`Page ${page}: fetched ${batch.length} contacts (total: ${contacts.length})`);

    if (batch.length < 100) break; // last page

    // Get pagination cursor from last contact
    const last = batch[batch.length - 1];
    if (last.startAfter && last.startAfter.length >= 2) {
      startAfter = last.startAfter[0];
      startAfterId = last.startAfter[1];
    } else {
      break;
    }
    page++;
  }

  return contacts;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connected to database');

  const contacts = await fetchAllContacts();
  console.log(`\nTotal GHL contacts fetched: ${contacts.length}`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const contact of contacts) {
    try {
      const ghlContactId = contact.id;
      const fullName = contact.contactName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
      const email = contact.email || null;
      const phone = contact.phone || '';

      // Skip contacts with no phone (can't identify them)
      if (!phone) {
        console.log(`  SKIP (no phone): ${fullName}`);
        skipped++;
        continue;
      }

      // Check if already exists by ghlContactId
      const [existing] = await db.execute(
        'SELECT id FROM trialSignups WHERE ghlContactId = ? LIMIT 1',
        [ghlContactId]
      );

      if (existing.length > 0) {
        console.log(`  SKIP (exists): ${fullName} [${ghlContactId}]`);
        skipped++;
        continue;
      }

      const program = inferProgram(contact);
      const source = buildSource(contact);
      const createdAt = contact.dateAdded ? new Date(contact.dateAdded).getTime() : Date.now();

      await db.execute(
        `INSERT INTO trialSignups 
         (name, email, phone, program, location, preferredContactMethod, status, source, ghlContactId, 
          introCountRequired, introCountBooked, introCountCompleted, dojoFlowSyncStatus, dojoFlowSyncAttempts, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fullName, email, phone, program, 'Tomball HQ', 'phone', 'new', source, ghlContactId,
          0, 0, 0, 'synced', 0, createdAt, Date.now()
        ]
      );

      console.log(`  IMPORTED: ${fullName} (${phone}) — ${program} — ${source}`);
      imported++;
    } catch (err) {
      console.error(`  ERROR for ${contact.contactName}: ${err.message}`);
      errors++;
    }
  }

  await db.end();
  console.log(`\n✅ Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
}

main().catch(console.error);
