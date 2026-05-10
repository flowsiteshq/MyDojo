async function main() {
  const rawKey = process.env.EIGHT_HUNDRED_API_KEY!;
  
  // Get the company ID from the companies response
  const companyId = 334319;
  
  // Test: Get numbers for the company
  console.log('--- Company phone numbers ---');
  const r1 = await fetch(`https://api.800.com/companies/${companyId}/numbers`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r1.status);
  const d1 = await r1.text();
  console.log('Response:', d1.substring(0, 1000));
  
  // Test: Get all numbers via different endpoint
  console.log('\n--- All numbers (company-scoped) ---');
  const r2 = await fetch(`https://api.800.com/companies/${companyId}/phone-numbers`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r2.status);
  const d2 = await r2.text();
  console.log('Response:', d2.substring(0, 500));
  
  // Test: Check user info more carefully
  console.log('\n--- User info ---');
  const r3 = await fetch('https://api.800.com/users', {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  const d3 = await r3.json() as any;
  console.log('Users:', JSON.stringify(d3, null, 2).substring(0, 1000));
  
  // Try sending SMS with company phone number
  const companyPhone = '+12818189288';
  console.log(`\n--- Send SMS with company phone ${companyPhone} ---`);
  const r4 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: companyPhone,
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r4.status);
  const d4 = await r4.text();
  console.log('Response:', d4.substring(0, 300));
  
  // Check what scopes/permissions this token has
  console.log('\n--- Check token scopes ---');
  const r5 = await fetch('https://api.800.com/oauth/token/info', {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  console.log('Status:', r5.status);
  const d5 = await r5.text();
  console.log('Response:', d5.substring(0, 300));
  
  // Try the subaccount-specific send
  const subaccountId = rawKey.split('|')[0];
  console.log(`\n--- Send via subaccount ${subaccountId} ---`);
  const r6 = await fetch(`https://api.800.com/subaccounts/${subaccountId}/message`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: '+18774693656',
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r6.status);
  const d6 = await r6.text();
  console.log('Response:', d6.substring(0, 300));
}

main().catch(console.error);
