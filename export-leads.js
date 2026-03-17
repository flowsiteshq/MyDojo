const mysql = require('mysql2/promise');

async function exportLeads() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [rows] = await connection.execute(
      'SELECT id, name, email, phone, program, location, status, preferredContactMethod, message, createdAt FROM trialSignups ORDER BY createdAt DESC'
    );
    
    console.log('MYDOJO WEBSITE - TRIAL SIGNUP LEADS');
    console.log('====================================\n');
    console.log(`Total Leads: ${rows.length}\n`);
    console.log('='.repeat(80));
    
    rows.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.name}`);
      console.log(`   Email: ${lead.email}`);
      console.log(`   Phone: ${lead.phone}`);
      console.log(`   Program: ${lead.program}`);
      console.log(`   Location: ${lead.location}`);
      console.log(`   Status: ${lead.status}`);
      console.log(`   Preferred Contact: ${lead.preferredContactMethod}`);
      if (lead.message) {
        console.log(`   Message: ${lead.message}`);
      }
      console.log(`   Submitted: ${lead.createdAt.toISOString().replace('T', ' ').substring(0, 19)}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️  NOTE: These leads are stored locally in MyDojo database.');
    console.log('They have NOT synced to Dojo Flow due to API endpoint issues.\n');
    
  } finally {
    await connection.end();
  }
}

exportLeads().catch(console.error);
