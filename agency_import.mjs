import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const AGENCY_API_KEY = 'pit-1ba77b59-eb96-42a8-9e33-dcf8bd1f14c4';
const LOCATION_ID = 'HES6HQ1WUvastq6dnpAw';
const BASE_URL = 'https://services.leadconnectorhq.com';

function detectProgram(contact) {
  const tags = (contact.tags || []).map(t => t.toLowerCase());
  const source = (contact.source || '').toLowerCase();
  const name = (contact.contactName || '').toLowerCase();
  const customFields = contact.customFields || [];

  // Check custom fields for program hints
  const customValues = customFields.map(f => (f.value || '').toString().toLowerCase()).join(' ');
  const combined = `${tags.join(' ')} ${source} ${name} ${customValues}`;

  if (combined.includes('kickboxing')) return 'Kickboxing';
  if (combined.includes('little ninja') || combined.includes('little-ninja')) return 'Little Ninjas';
  if (combined.includes('dragon') || combined.includes('core kid')) return 'Core Kids';
  if (combined.includes('teen')) return 'Teens & Adults';
  if (combined.includes('adult karate') || combined.includes('adult martial')) return 'Adult Karate';
  if (combined.includes('after school')) return 'After School';
  return 'Not Sure';
}

function detectSource(contact) {
  const source = (contact.source || '').toLowerCase();
  const tags = (contact.tags || []).map(t => t.toLowerCase());
  const attributions = contact.attributions || [];

  const utmSource = attributions.length > 0 ? (attributions[0].utmSource || '').toLowerCase() : '';
  const adSource = attributions.length > 0 ? (attributions[0].adSource || '').toLowerCase() : '';

  if (source.includes('facebook') || utmSource.includes('facebook') || utmSource.includes('fb') || adSource.includes('facebook') || tags.includes('fb lead ad')) {
    return 'ghl:Facebook Ads (Agency)';
  }
  if (source.includes('google') || utmSource.includes('google')) return 'ghl:Google Ads (Agency)';
  if (source.includes('instagram')) return 'ghl:Instagram (Agency)';
  return 'ghl:Agency';
}

async function fetchAllContacts() {
  let allContacts = [];
  let nextPageUrl = `${BASE_URL}/contacts/?locationId=${LOCATION_ID}&limit=100`;

  while (nextPageUrl) {
    const resp = await fetch(nextPageUrl, {
      headers: {
        'Authorization': `Bearer ${AGENCY_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`GHL API error: ${resp.status} ${err}`);
    }

    const data = await resp.json();
    const contacts = data.contacts || [];
    allContacts = allContacts.concat(contacts);
    console.log(`Fetched ${contacts.length} contacts (total so far: ${allContacts.length} / ${data.meta?.total})`);

    nextPageUrl = data.meta?.nextPageUrl || null;
  }

  return allContacts;
}

async function main() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('Fetching all contacts from agency GHL...');
  const contacts = await fetchAllContacts();
  console.log(`\nTotal contacts fetched: ${contacts.length}`);

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;

  for (const contact of contacts) {
    const firstName = contact.firstName || '';
    const lastName = contact.lastName || '';
    const fullName = contact.contactName || `${firstName} ${lastName}`.trim();
    const phone = (contact.phone || '').replace(/\D/g, '');
    const email = contact.email || null;

    if (!fullName || fullName === 'Unknown' || !phone) {
      console.log(`  SKIP (no name/phone): ${contact.id}`);
      skipped++;
      continue;
    }

    // Check for duplicate by phone
    const [existing] = await conn.execute(
      'SELECT id FROM trialSignups WHERE phone = ? LIMIT 1',
      [phone]
    );
    if (existing.length > 0) {
      console.log(`  DUPLICATE: ${fullName} (${phone})`);
      duplicates++;
      continue;
    }

    const program = detectProgram(contact);
    const source = detectSource(contact);
    const dateAdded = contact.dateAdded ? new Date(contact.dateAdded) : new Date();

    await conn.execute(
      `INSERT INTO trialSignups 
        (name, phone, email, program, source, pipelineStage, preferredContactMethod, location, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'new_lead', 'phone', 'HQ', ?, ?)`,
      [fullName, phone, email, program, source, dateAdded, dateAdded]
    );

    console.log(`  IMPORTED: ${fullName} (${phone}) — ${program} — ${source}`);
    imported++;
  }

  await conn.end();

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Imported:   ${imported}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Skipped:    ${skipped}`);
  console.log(`Total:      ${contacts.length}`);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
