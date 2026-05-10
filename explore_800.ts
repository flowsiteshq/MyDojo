async function main() {
  const apiKey = process.env.EIGHT_HUNDRED_API_KEY!;

  // Check what the from number env var is
  console.log('EIGHT_HUNDRED_FROM_NUMBER:', process.env.EIGHT_HUNDRED_FROM_NUMBER);

  // Try to get account info to understand the API structure
  const endpoints = [
    'https://api.800.com/v1/account',
    'https://api.800.com/v1/numbers',
    'https://api.800.com/v1/sms',
    'https://api.800.com/v2/account',
    'https://api.800.com/v2/numbers',
    'https://api.800.com/v3/account',
    'https://api.800.com/v3/sms/send',
    'https://api.800.com/v3/messages',
  ];

  for (const url of endpoints) {
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const t = await r.text();
    console.log(`${r.status} ${url}: ${t.substring(0, 100)}`);
  }
}

main().catch(console.error);
