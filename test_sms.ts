async function main() {
  const rawKey = process.env.EIGHT_HUNDRED_API_KEY!;
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER!;
  
  console.log('Raw API key (first 30 chars):', rawKey?.substring(0, 30));
  console.log('From number:', fromNumber);
  
  // The key format is "subaccountId|token" e.g. "341270|GKGexVUi3ux20..."
  // Try different auth approaches:
  
  const parts = rawKey.split('|');
  const subaccountId = parts[0];
  const token = parts[1];
  
  console.log('\nSubaccount ID:', subaccountId);
  console.log('Token (first 20 chars):', token?.substring(0, 20));
  
  // Test 1: Full key as Bearer
  console.log('\n--- Test 1: Full key as Bearer ---');
  const r1 = await fetch('https://api.800.com/users', {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r1.status);
  const d1 = await r1.text();
  console.log('Response:', d1.substring(0, 200));
  
  // Test 2: Token only as Bearer
  console.log('\n--- Test 2: Token only as Bearer ---');
  const r2 = await fetch('https://api.800.com/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r2.status);
  const d2 = await r2.text();
  console.log('Response:', d2.substring(0, 200));
  
  // Test 3: Check the /accounts endpoint
  console.log('\n--- Test 3: /accounts endpoint with token ---');
  const r3 = await fetch('https://api.800.com/accounts', {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r3.status);
  const d3 = await r3.text();
  console.log('Response:', d3.substring(0, 300));
  
  // Test 4: Try sending SMS with token only
  console.log('\n--- Test 4: Send SMS with token only ---');
  const fromNorm = '+1' + fromNumber.replace(/\D/g, '').slice(-10);
  const r4 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: fromNorm,
      recipient: '+18325551234', // test number (won't actually send)
      message: 'Test'
    })
  });
  console.log('Status:', r4.status);
  const d4 = await r4.text();
  console.log('Response:', d4.substring(0, 300));
}

main().catch(console.error);
