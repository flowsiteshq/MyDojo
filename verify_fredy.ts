async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const fredyCustId = 'd71jqev0i47dif9akad0';

  // Search subscriptions for Fredy
  const subSearchRes = await fetch('https://app.fluidpay.com/api/recurring/subscription/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: fredyCustId })
  });
  const subSearchData = await subSearchRes.json() as any;
  
  if (Array.isArray(subSearchData.data)) {
    for (const sub of subSearchData.data) {
      console.log('Subscription ID:', sub.id);
      console.log('Description:', sub.description);
      console.log('Status:', sub.status);
      console.log('Amount: $' + (sub.amount/100).toFixed(2));
      console.log('Next bill date:', sub.next_bill_date);
      console.log('Billing day:', sub.billing_days);
    }
  } else {
    console.log('No subscriptions found or error:', JSON.stringify(subSearchData).substring(0, 200));
  }
}

main().catch(console.error);
