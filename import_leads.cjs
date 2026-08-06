const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  // Parse CSV
  const csv = fs.readFileSync('/home/ubuntu/upload/mydojo_84_leads.csv', 'utf8');
  const lines = csv.trim().split('\n');
  const leads = lines.slice(1).map(line => {
    const vals = line.split(',');
    return { 
      name: vals[1], 
      phone: vals[2], 
      email: vals[3], 
      created_date: vals[4], 
      source: vals[5] || 'Back to School Campaign', 
      status: vals[6] || 'new' 
    };
  });
  console.log('Total leads in CSV:', leads.length);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Check which are already in trialSignups
  const emails = leads.map(l => l.email).filter(Boolean);
  const [existing] = await conn.execute(
    'SELECT email FROM trialSignups WHERE email IN (' + emails.map(() => '?').join(',') + ')',
    emails
  );
  const existingSet = new Set(existing.map(r => r.email));
  
  const newLeads = leads.filter(l => !existingSet.has(l.email));
  console.log('Already in DB:', existingSet.size);
  console.log('New leads to insert:', newLeads.length);

  // Insert new leads
  let inserted = 0;
  for (const lead of newLeads) {
    try {
      await conn.execute(
        "INSERT INTO trialSignups (name, phone, email, status, source, location, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'HQ', NOW(), NOW())",
        [lead.name, lead.phone, lead.email, 'new', lead.source]
      );
      inserted++;
    } catch (err) {
      console.error('Failed to insert', lead.name, err.message);
    }
  }
  console.log('Inserted:', inserted, 'new leads');

  // Get all staff phone numbers
  const [staff] = await conn.execute(
    "SELECT name, email, phone FROM users WHERE role IN ('admin', 'staff') AND phone IS NOT NULL AND phone != '' ORDER BY name"
  );
  console.log('\nStaff members with phones:', staff.length);
  staff.forEach(s => console.log(' -', s.name, s.phone));

  await conn.end();
  
  // Return data for SMS sending
  return { leads, staff, newLeads, inserted };
}

main().then(({ leads, staff, newLeads, inserted }) => {
  console.log('\n=== SUMMARY ===');
  console.log('Total leads:', leads.length);
  console.log('New leads inserted:', inserted);
  console.log('Staff to notify:', staff.length);
  
  // Write leads summary to file for SMS
  fs.writeFileSync('/home/ubuntu/leads_summary.json', JSON.stringify({ leads, staff }, null, 2));
  console.log('\nData saved to /home/ubuntu/leads_summary.json');
}).catch(console.error);
