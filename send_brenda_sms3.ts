async function main() {
  const fullKey = process.env.EIGHT_HUNDRED_API_KEY || '';
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER || '';
  
  const paymentUrl = 'https://checkout.stripe.com/c/pay/cs_live_a1fta5AIUWPrcFwbQE1UALSPBhxtIytip0ijUg5HFZM5W3BahhfZjoMICU';
  const message = `Hi Brenda, this is MyDojo! We have added Sonaida Rodriguez to your account. Please use the link below to complete your $75 add-on payment for May: ${paymentUrl} Thank you!`;

  const toNumber = '+18326655442';
  const fromNormalized = '+18774693656';

  // Try with full key as bearer token (the way sms800.ts does it)
  const endpoints = [
    'https://api.800.com/message',
    'https://api.800.com/v1/message', 
    'https://api.800.com/messages',
  ];

  for (const endpoint of endpoints) {
    console.log('\nTrying:', endpoint);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
        'Authorization': `Bearer ${fullKey}`
      },
      body: JSON.stringify({
        sender: fromNormalized,
        recipient: toNumber,
        message
      })
    });

    const text = await res.text();
    console.log('Status:', res.status);
    try {
      console.log('Response:', JSON.stringify(JSON.parse(text)));
    } catch {
      console.log('Raw:', text.substring(0, 300));
    }
    
    if (res.status === 200 || res.status === 201) break;
  }
}

main().catch(console.error);
