async function main() {
  const apiKey = process.env.EIGHT_HUNDRED_API_KEY!;
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER || '+12815038903';
  const toNumber = '+12818189288';

  console.log('API Key present:', !!apiKey);
  console.log('From:', fromNumber);
  console.log('To:', toNumber);

  // Try the messages endpoint
  console.log('\n--- Attempt 1: /messages endpoint ---');
  const r1 = await fetch('https://api.800.com/v2/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromNumber,
      to: toNumber,
      body: 'Test message from MyDojo - please ignore'
    })
  });
  console.log('Status:', r1.status);
  const t1 = await r1.text();
  console.log('Response:', t1.substring(0, 500));

  // Try the sms endpoint
  console.log('\n--- Attempt 2: /sms endpoint ---');
  const r2 = await fetch('https://api.800.com/v2/sms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromNumber,
      to: toNumber,
      message: 'Test message from MyDojo - please ignore'
    })
  });
  console.log('Status:', r2.status);
  const t2 = await r2.text();
  console.log('Response:', t2.substring(0, 500));

  // Try with API key as query param
  console.log('\n--- Attempt 3: /send endpoint ---');
  const r3 = await fetch('https://api.800.com/v2/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromNumber,
      to: toNumber,
      text: 'Test message from MyDojo - please ignore'
    })
  });
  console.log('Status:', r3.status);
  const t3 = await r3.text();
  console.log('Response:', t3.substring(0, 500));
}

main().catch(console.error);
