async function main() {
  const rawKey = process.env.EIGHT_HUNDRED_API_KEY!;
  const companyId = 334319;
  const numberId = 468445;
  
  // Try the /message endpoint with number_id instead of sender
  console.log('--- /message with number_id ---');
  const r1 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      number_id: numberId,
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r1.status);
  const d1 = await r1.text();
  console.log('Response:', d1.substring(0, 300));
  
  // Try with company_id
  console.log('\n--- /message with company_id ---');
  const r2 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      company_id: companyId,
      number_id: numberId,
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r2.status);
  const d2 = await r2.text();
  console.log('Response:', d2.substring(0, 300));
  
  // Try the v1 API
  console.log('\n--- v1 API ---');
  const r3 = await fetch('https://api.800.com/v1/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: '+12815038903',
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r3.status);
  const d3 = await r3.text();
  console.log('Response:', d3.substring(0, 300));
  
  // Check if there's a sms endpoint
  console.log('\n--- /sms endpoint ---');
  const r4 = await fetch('https://api.800.com/sms', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: '+12815038903',
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r4.status);
  const d4 = await r4.text();
  console.log('Response:', d4.substring(0, 300));
  
  // Check the number's SMS verification status more carefully
  console.log('\n--- Check number SMS verification ---');
  const r5 = await fetch(`https://api.800.com/companies/${companyId}/numbers`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  const d5 = await r5.json() as any;
  console.log('Numbers:', JSON.stringify(d5, null, 2));
}

main().catch(console.error);
