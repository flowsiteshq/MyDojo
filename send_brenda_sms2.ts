async function main() {
  const fullKey = process.env.EIGHT_HUNDRED_API_KEY || '';
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER || '';
  
  // Key format: "subaccountId|token"
  const [subaccountId, token] = fullKey.split('|');
  
  const paymentUrl = 'https://checkout.stripe.com/c/pay/cs_live_a1fta5AIUWPrcFwbQE1UALSPBhxtIytip0ijUg5HFZM5W3BahhfZjoMICU';
  const message = `Hi Brenda, this is MyDojo! We have added Sonaida Rodriguez to your account. Please use the link below to complete your $75 add-on payment for May: ${paymentUrl} Thank you!`;

  const toNumber = '+18326655442';
  const fromNormalized = fromNumber.replace(/\D/g, '').length === 10 
    ? `+1${fromNumber.replace(/\D/g, '')}` 
    : `+${fromNumber.replace(/\D/g, '')}`;

  console.log('Subaccount ID:', subaccountId);
  console.log('From:', fromNormalized);
  console.log('To:', toNumber);

  // Try subaccount-based endpoint
  const res = await fetch(`https://api.800.com/subaccounts/${subaccountId}/messages`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
    console.log('Raw:', text.substring(0, 500));
  }
}

main().catch(console.error);
