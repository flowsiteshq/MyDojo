const Stripe = require('stripe');

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

async function run() {
  const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover'
  });

  // Create a Stripe Checkout session for $75
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: 'galvez503brenda@gmail.com',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'MyDojo - Sonaida Rodriguez Add-On (May 2026)',
          description: 'Additional student add-on fee for May 2026',
        },
        unit_amount: 7500,
      },
      quantity: 1,
    }],
    metadata: {
      type: 'addon_payment',
      customer_name: 'Brenda Galvez',
      student_name: 'Sonaida Rodriguez',
    },
    success_url: 'https://www.mydojoma.com?payment=success',
    cancel_url: 'https://www.mydojoma.com?payment=cancelled',
  });

  console.log('Payment link created:', session.url);

  // Text Brenda via 800.com
  const apiKey = process.env.EIGHT_HUNDRED_API_KEY;
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER;
  const toNumber = normalizePhone('8326655442');
  const fromNormalized = normalizePhone(fromNumber);

  const message = `Hi Brenda, this is MyDojo! We've added Sonaida Rodriguez to your account. Please use the link below to complete your $75 add-on payment for May:\n\n${session.url}\n\nThank you!`;

  const smsRes = await fetch('https://api.800.com/message', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      sender: fromNormalized,
      recipient: toNumber,
      message: message
    })
  });

  const smsData = await smsRes.json();
  if (smsRes.ok) {
    console.log('SMS sent successfully! ID:', smsData?.data?.id);
  } else {
    console.log('SMS failed:', JSON.stringify(smsData));
  }
}

run().catch(console.error);
