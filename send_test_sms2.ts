async function main() {
  const apiKey = process.env.EIGHT_HUNDRED_API_KEY!;
  const fromRaw = process.env.EIGHT_HUNDRED_FROM_NUMBER || '8774693656';
  const toNumber = '+12818189288';

  // Normalize from number
  const fromDigits = fromRaw.replace(/\D/g, '');
  const fromNormalized = fromDigits.length === 10 ? `+1${fromDigits}` : `+${fromDigits}`;
  
  console.log('From (normalized):', fromNormalized);
  console.log('To:', toNumber);

  // Try the correct endpoint: POST https://api.800.com/message
  console.log('\n--- Attempt: POST /message ---');
  const r = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      sender: fromNormalized,
      recipient: toNumber,
      message: 'Test from MyDojo - please ignore'
    })
  });
  console.log('Status:', r.status);
  const t = await r.text();
  console.log('Response:', t.substring(0, 500));

  // Also try with the actual local number +12815038903
  console.log('\n--- Attempt: POST /message with local number ---');
  const r2 = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      sender: '+12815038903',
      recipient: toNumber,
      message: 'Test from MyDojo - please ignore'
    })
  });
  console.log('Status:', r2.status);
  const t2 = await r2.text();
  console.log('Response:', t2.substring(0, 500));
}

main().catch(console.error);
