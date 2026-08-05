const fs = require('fs');

function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return `+${digits}`;
}

async function sendSMS(to, message) {
  const apiKey = process.env.EIGHT_HUNDRED_API_KEY;
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER;
  
  const toNorm = normalizePhone(to);
  const fromNorm = normalizePhone(fromNumber);
  
  const response = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ sender: fromNorm, recipient: toNorm, message: message })
  });
  
  const data = await response.json();
  return { status: response.status, ok: response.ok, data };
}

async function main() {
  const leads = JSON.parse(fs.readFileSync('/home/ubuntu/leads_summary.json', 'utf8')).leads;
  const staff = JSON.parse(fs.readFileSync('/home/ubuntu/leads_summary.json', 'utf8')).staff;
  
  // Deduplicate staff by phone number
  const uniqueStaff = [];
  const seenPhones = new Set();
  for (const s of staff) {
    const phone = normalizePhone(s.phone);
    if (!seenPhones.has(phone)) {
      seenPhones.add(phone);
      uniqueStaff.push({ ...s, normalizedPhone: phone });
    }
  }
  
  console.log('Unique staff to notify:', uniqueStaff.length);
  uniqueStaff.forEach(s => console.log(' -', s.name, s.normalizedPhone));
  
  // Split leads into batches of 10 per message
  const BATCH_SIZE = 10;
  const batches = [];
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    batches.push(leads.slice(i, i + BATCH_SIZE));
  }
  
  console.log('\nSending', batches.length + 2, 'messages per staff member...\n');
  
  let totalSent = 0;
  let totalFailed = 0;
  
  for (const staffMember of uniqueStaff) {
    console.log(`\n--- Texting ${staffMember.name} (${staffMember.normalizedPhone}) ---`);
    
    // Send intro message
    const firstName = staffMember.name.split(' ')[0];
    const introMsg = `MYDOJO LEADS ALERT - Hi ${firstName}! You have 84 NEW leads from the Back to School Campaign that need follow-up ASAP. Here they are:`;
    const introResult = await sendSMS(staffMember.phone, introMsg);
    console.log('Intro:', introResult.status, introResult.ok ? 'OK' : JSON.stringify(introResult.data).slice(0, 100));
    if (introResult.ok) totalSent++; else totalFailed++;
    await new Promise(r => setTimeout(r, 500));
    
    // Send each batch
    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];
      const startNum = (b * BATCH_SIZE) + 1;
      const endNum = Math.min((b + 1) * BATCH_SIZE, leads.length);
      let msg = `Leads ${startNum}-${endNum} of 84:\n`;
      for (const lead of batch) {
        msg += `${lead.name} | ${lead.phone}\n`;
      }
      
      const result = await sendSMS(staffMember.phone, msg);
      console.log(`Batch ${b+1}/${batches.length}:`, result.status, result.ok ? 'OK' : JSON.stringify(result.data).slice(0, 80));
      if (result.ok) totalSent++; else totalFailed++;
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Send closing message
    const closeMsg = `That's all 84 leads! Please reach out to each one today. Check the MyDojo admin panel for full contact details including emails. - MyDojo Management`;
    const closeResult = await sendSMS(staffMember.phone, closeMsg);
    console.log('Close:', closeResult.status, closeResult.ok ? 'OK' : JSON.stringify(closeResult.data).slice(0, 80));
    if (closeResult.ok) totalSent++; else totalFailed++;
    await new Promise(r => setTimeout(r, 800));
  }
  
  console.log('\n=== DONE ===');
  console.log('Messages sent:', totalSent);
  console.log('Messages failed:', totalFailed);
  console.log('Staff notified:', uniqueStaff.length);
}

main().catch(console.error);
