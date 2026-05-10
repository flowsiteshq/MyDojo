import { sendSms } from './server/sms800';

async function main() {
  const paymentUrl = 'https://checkout.stripe.com/c/pay/cs_live_a1fta5AIUWPrcFwbQE1UALSPBhxtIytip0ijUg5HFZM5W3BahhfZjoMICU';
  const message = `Hi Brenda, this is MyDojo! We have added Sonaida Rodriguez to your account. Please use the link below to complete your $75 add-on payment for May:\n\n${paymentUrl}\n\nThank you!`;

  const result = await sendSms({ to: '8326655442', message });
  console.log('SMS result:', JSON.stringify(result));
}

main().catch(console.error);
