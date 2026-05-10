async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;

  const KEVIN_CUSTOMER_ID = 'd7pusvn0i47d6t50rahg';

  // Get Kevin's customer record
  console.log('Getting Kevin\'s customer record...');
  const custRes = await fetch(`https://app.fluidpay.com/api/customer/${KEVIN_CUSTOMER_ID}`, {
    headers: { 'Authorization': apiKey }
  });
  const custData = await custRes.json() as any;
  console.log('Customer response:', JSON.stringify(custData, null, 2).substring(0, 2000));

  // Try different vault endpoints
  const endpoints = [
    `/api/customer/${KEVIN_CUSTOMER_ID}/vault`,
    `/api/customer/${KEVIN_CUSTOMER_ID}/payment-methods`,
    `/api/vault/customer/${KEVIN_CUSTOMER_ID}`,
  ];
  
  for (const ep of endpoints) {
    const res = await fetch(`https://app.fluidpay.com${ep}`, {
      headers: { 'Authorization': apiKey }
    });
    const data = await res.json() as any;
    console.log(`\nEndpoint ${ep}:`, JSON.stringify(data).substring(0, 300));
  }

  // Get Kevin's subscription details
  console.log('\nGetting Kevin\'s subscription...');
  const subRes = await fetch(`https://app.fluidpay.com/api/recurring/subscription/d7puuj70i473fp36l100`, {
    headers: { 'Authorization': apiKey }
  });
  const subData = await subRes.json() as any;
  console.log('Subscription:', JSON.stringify(subData, null, 2).substring(0, 2000));
}

main().catch(console.error);
