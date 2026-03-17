import mysql from 'mysql2/promise';

const DOJO_FLOW_URL = process.env.DOJO_FLOW_URL;
const DOJO_FLOW_EMAIL = process.env.DOJO_FLOW_EMAIL;
const DOJO_FLOW_PASSWORD = process.env.DOJO_FLOW_PASSWORD;

async function submitLeadToDojoFlow(leadData) {
  const { name, email, phone, program, location, message } = leadData;
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(' ') || '';

  const response = await fetch(`${DOJO_FLOW_URL}/api/public/submit-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: DOJO_FLOW_EMAIL,
      password: DOJO_FLOW_PASSWORD,
      firstName,
      lastName,
      phone,
      programInterest: program,
      message: message || '',
      source: 'MyDojo Website - Bulk Sync'
    })
  });

  const result = await response.json();
  
  if (result.success) {
    return {
      success: true,
      status: result.data?.status || 'Synced',
      message: result.data?.message || 'Lead synced successfully'
    };
  } else {
    return {
      success: false,
      status: 'Failed',
      message: result.error || 'Unknown error'
    };
  }
}

async function syncExistingLeads() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🔄 Starting bulk sync of existing leads to Dojo Flow...\n');
    console.log('='.repeat(80));
    
    // Get all leads from MyDojo database
    const [leads] = await connection.execute(
      'SELECT id, name, email, phone, program, location, message, createdAt FROM trialSignups ORDER BY createdAt ASC'
    );
    
    console.log(`\nFound ${leads.length} leads to sync\n`);
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    // Sync each lead to Dojo Flow
    for (const lead of leads) {
      try {
        // Split name into first and last
        const nameParts = lead.name.trim().split(' ');
        const firstName = nameParts[0] || lead.name;
        const lastName = nameParts.slice(1).join(' ') || '';
        
        console.log(`Syncing: ${lead.name} (${lead.email})...`);
        
        const result = await submitLeadToDojoFlow({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          program: lead.program,
          location: lead.location,
          message: lead.message || `Lead imported from MyDojo website (submitted ${lead.createdAt.toISOString().split('T')[0]})`
        });
        
        if (result.success) {
          console.log(`  ✅ Success - Status: ${result.status}`);
          successCount++;
        } else {
          console.log(`  ❌ Failed - ${result.message}`);
          failCount++;
          errors.push({ lead: lead.name, error: result.message });
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`  ❌ Error - ${error.message}`);
        failCount++;
        errors.push({ lead: lead.name, error: error.message });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SYNC SUMMARY');
    console.log(`   Total Leads: ${leads.length}`);
    console.log(`   ✅ Successfully Synced: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(err => {
        console.log(`   - ${err.lead}: ${err.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✨ Bulk sync complete! All leads are now in Dojo Flow.');
    console.log('Future leads will automatically sync in real-time through the chatbot.\n');
    
  } finally {
    await connection.end();
  }
}

syncExistingLeads().catch(error => {
  console.error('Fatal error during sync:', error);
  process.exit(1);
});
