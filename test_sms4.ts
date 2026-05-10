async function main() {
  const rawKey = process.env.EIGHT_HUNDRED_API_KEY!;
  const companyId = 334319;
  const correctNumber = '+12815038903';
  
  // Test 1: Send SMS with the correct company number
  console.log(`--- Send SMS with correct number ${correctNumber} ---`);
  const r1 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: correctNumber,
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r1.status);
  const d1 = await r1.text();
  console.log('Response:', d1.substring(0, 300));
  
  // Test 2: Try company-scoped message endpoint
  console.log(`\n--- Company-scoped message ---`);
  const r2 = await fetch(`https://api.800.com/companies/${companyId}/message`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: correctNumber,
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r2.status);
  const d2 = await r2.text();
  console.log('Response:', d2.substring(0, 300));
  
  // Test 3: Check number details
  console.log('\n--- Number details ---');
  const r3 = await fetch(`https://api.800.com/companies/${companyId}/numbers/468445`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r3.status);
  const d3 = await r3.text();
  console.log('Response:', d3.substring(0, 500));
  
  // Test 4: Try conversations endpoint
  console.log('\n--- Conversations ---');
  const r4 = await fetch(`https://api.800.com/companies/${companyId}/conversations`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r4.status);
  const d4 = await r4.text();
  console.log('Response:', d4.substring(0, 500));
  
  // Test 5: Check if there's a messages endpoint
  console.log('\n--- Messages endpoint ---');
  const r5 = await fetch(`https://api.800.com/companies/${companyId}/messages`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r5.status);
  const d5 = await r5.text();
  console.log('Response:', d5.substring(0, 500));
}

main().catch(console.error);
