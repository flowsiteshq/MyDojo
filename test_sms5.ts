async function main() {
  const rawKey = process.env.EIGHT_HUNDRED_API_KEY!;
  const companyId = 334319;
  const numberId = 468445;
  const correctNumber = '+12815038903';
  
  // Test 1: Try creating a conversation/sending via conversation
  console.log('--- Create conversation and send message ---');
  const r1 = await fetch(`https://api.800.com/companies/${companyId}/conversations`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      number_id: numberId,
      recipient: '+18325551234',
      message: 'Test message'
    })
  });
  console.log('Status:', r1.status);
  const d1 = await r1.text();
  console.log('Response:', d1.substring(0, 500));
  
  // Test 2: Check existing conversations and try to send via one
  console.log('\n--- Get conversations ---');
  const r2 = await fetch(`https://api.800.com/companies/${companyId}/conversations`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  const d2 = await r2.json() as any;
  if (d2.data?.length > 0) {
    const conv = d2.data[0];
    console.log('First conversation ID:', conv.id);
    console.log('Recipient:', conv.recipient);
    
    // Try sending a message in this conversation
    console.log('\n--- Send message in existing conversation ---');
    const r3 = await fetch(`https://api.800.com/companies/${companyId}/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${rawKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: 'Test'
      })
    });
    console.log('Status:', r3.status);
    const d3 = await r3.text();
    console.log('Response:', d3.substring(0, 300));
  }
  
  // Test 3: Try sending via number endpoint
  console.log('\n--- Send via number endpoint ---');
  const r4 = await fetch(`https://api.800.com/companies/${companyId}/numbers/${numberId}/messages`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${rawKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      recipient: '+18325551234',
      message: 'Test'
    })
  });
  console.log('Status:', r4.status);
  const d4 = await r4.text();
  console.log('Response:', d4.substring(0, 300));
  
  // Test 4: Check if the number has SMS enabled
  console.log('\n--- Number SMS status from conversations ---');
  const r5 = await fetch(`https://api.800.com/companies/${companyId}/conversations`, {
    headers: { 'Authorization': `Bearer ${rawKey}`, 'Accept': 'application/json' }
  });
  const d5 = await r5.json() as any;
  if (d5.data?.[0]?.number) {
    console.log('Number info:', JSON.stringify(d5.data[0].number, null, 2));
  }
}

main().catch(console.error);
