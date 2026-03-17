import mysql from 'mysql2/promise';

async function exportLeads() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [rows] = await connection.execute(
      'SELECT id, name, email, phone, program, location, status, preferredContactMethod, message, createdAt FROM trialSignups ORDER BY createdAt DESC'
    );
    
    let output = '';
    output += 'MYDOJO WEBSITE - TRIAL SIGNUP LEADS\n';
    output += '====================================\n\n';
    output += `Total Leads: ${rows.length}\n\n`;
    output += '='.repeat(80) + '\n';
    
    rows.forEach((lead, index) => {
      output += `\n${index + 1}. ${lead.name}\n`;
      output += `   Email: ${lead.email}\n`;
      output += `   Phone: ${lead.phone}\n`;
      output += `   Program: ${lead.program}\n`;
      output += `   Location: ${lead.location}\n`;
      output += `   Status: ${lead.status}\n`;
      output += `   Preferred Contact: ${lead.preferredContactMethod}\n`;
      if (lead.message) {
        output += `   Message: ${lead.message}\n`;
      }
      output += `   Submitted: ${lead.createdAt.toISOString().replace('T', ' ').substring(0, 19)}\n`;
    });
    
    output += '\n' + '='.repeat(80) + '\n';
    output += '\n⚠️  NOTE: These leads are stored locally in MyDojo database.\n';
    output += 'They have NOT synced to Dojo Flow due to API endpoint issues.\n';
    
    console.log(output);
    
    // Also write to file
    const fs = await import('fs');
    fs.writeFileSync('/tmp/leads-report.txt', output);
    
  } finally {
    await connection.end();
  }
}

exportLeads().catch(console.error);
