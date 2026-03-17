import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = 'pit-8cfbccc2-d059-4a37-b400-89ad890dd0e8';
const LOCATION_ID = '7XJ40jhVRP9b804WIxYj';

function inferProgram(contact) {
  const tags = (contact.tags || []).map(t => t.toLowerCase());
  const source = (contact.source || '').toLowerCase();
  if (tags.some(t => t.includes('kickbox') || t.includes('kbx'))) return 'Kickboxing';
  if (tags.some(t => t.includes('summer camp'))) return 'Summer Camp';
  if (tags.some(t => t.includes('little ninja'))) return 'Little Ninjas';
  if (tags.some(t => t.includes('dragon kid'))) return 'Dragon Kids';
  if (tags.some(t => t.includes('teen'))) return 'Teens';
  if (tags.some(t => t.includes('after school'))) return 'After School';
  if (tags.some(t => t.includes('adult karate') || t.includes('karate'))) return 'Adult Karate';
  if (tags.some(t => t.includes('challenge'))) return 'Kickboxing';
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

// MySQL DATETIME string: YYYY-MM-DD HH:MM:SS
function toMysqlDT(val) {
  const d = val ? new Date(val) : new Date();
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function fetchAllContacts() {
  const contacts = [];
  let page = 1;
  let url = `https://services.leadconnectorhq.com/contacts/?locationId=${LOCATION_ID}&limit=100`;
  
  while (true) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Version': '2021-07-28' }
    });
    if (!res.ok) { console.error('GHL error:', res.status, await res.text()); break; }
    const data = await res.json();
    const batch = data.contacts || [];
    contacts.push(...batch);
    console.log(`Page ${page}: ${batch.length} contacts (total: ${contacts.length})`);
    if (batch.length < 100) break;
    const meta = data.meta || {};
    if (!meta.nextPageUrl) break;
    url = meta.nextPageUrl;
    page++;
  }
  return contacts;
}

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('DB connected');

  const contacts = await fetchAllContacts();
  console.log(`\nFetched ${contacts.length} GHL contacts`);

  let imported = 0, skipped = 0, errors = 0;
  const now = toMysqlDT(null);

  for (const c of contacts) {
    try {
      const name = c.contactName || `${c.firstName||''} ${c.lastName||''}`.trim() || 'Unknown';
      const phone = c.phone || '';
      if (!phone) { console.log(`  SKIP (no phone): ${name} <${c.email}>`); skipped++; continue; }

      const [ex] = await db.execute('SELECT id FROM trialSignups WHERE ghlContactId=? LIMIT 1', [c.id]);
      if (ex.length > 0) { console.log(`  SKIP (exists): ${name}`); skipped++; continue; }

      const program = inferProgram(c);
      const source = buildSource(c);
      const createdAt = toMysqlDT(c.dateAdded);

      await db.execute(
        `INSERT INTO trialSignups (name,email,phone,program,location,preferredContactMethod,status,source,ghlContactId,introCountRequired,introCountBooked,introCountCompleted,dojoFlowSyncStatus,dojoFlowSyncAttempts,createdAt,updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [name, c.email||null, phone, program, 'Tomball HQ', 'phone', 'new', source, c.id, 0,0,0,'synced',0, createdAt, now]
      );
      console.log(`  IMPORTED: ${name} (${phone}) — ${program} — ${source}`);
      imported++;
    } catch(err) {
      console.error(`  ERROR ${c.contactName||c.id}: ${err.message}`);
      errors++;
    }
  }

  await db.end();
  console.log(`\n✅ Done: ${imported} imported, ${skipped} skipped, ${errors} errors`);
}
main().catch(console.error);
