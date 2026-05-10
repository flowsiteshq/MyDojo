async function main() {
  const rawKey = process.env.EIGHT_HUNDRED_API_KEY!;
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER!;
  
  // Test 1: Get companies/subaccounts
  console.log('--- Companies ---');
  const r1 = await fetch('https://api.800.com/companies', {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r1.status);
  const d1 = await r1.text();
  console.log('Response:', d1.substring(0, 500));
  
  // Test 2: Get phone numbers
  console.log('\n--- Phone Numbers ---');
  const r2 = await fetch('https://api.800.com/numbers', {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r2.status);
  const d2 = await r2.text();
  console.log('Response:', d2.substring(0, 500));
  
  // Test 3: Try subaccount-specific endpoint
  const subaccountId = rawKey.split('|')[0];
  console.log('\n--- Subaccount numbers ---');
  const r3 = await fetch(`https://api.800.com/companies/${subaccountId}/numbers`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r3.status);
  const d3 = await r3.text();
  console.log('Response:', d3.substring(0, 500));
  
  // Test 4: Try sending with different from number formats
  const fromNorm = '+18774693656';
  console.log('\n--- Send SMS test with +18774693656 ---');
  const r4 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: fromNorm,
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r4.status);
  const d4 = await r4.text();
  console.log('Response:', d4.substring(0, 300));
  
  // Test 5: Try without + prefix
  console.log('\n--- Send SMS test with 18774693656 ---');
  const r5 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: '18774693656',
      recipient: '18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r5.status);
  const d5 = await r5.text();
  console.log('Response:', d5.substring(0, 300));
  
  // Test 6: Try with just 10 digits
  console.log('\n--- Send SMS test with 8774693656 ---');
  const r6 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: '8774693656',
      recipient: '8325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r6.status);
  const d6 = await r6.text();
  console.log('Response:', d6.substring(0, 300));
}

main().catch(console.error);
