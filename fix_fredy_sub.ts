async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const FREDY_SUB_ID = 'd7v7rnn0i473fp4kqvf0';

  // Update the subscription next bill date to June 25
  console.log('Updating Fredy subscription next bill date to June 25...');
  const res = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${FREDY_SUB_ID}`, {
    method: 'PUT',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      next_bill_date: '2026-06-25'
    })
  });
  const rawText = await res.text();
  if (!rawText) { console.log('Empty response - update may have succeeded'); return; }
  const data = JSON.parse(rawText) as any;
  
  if (data.status === 'success') {
    console.log('✅ Updated! Next bill date:', data.data?.next_bill_date);
    console.log('  Status:', data.data?.status);
    console.log('  Amount: $' + (data.data?.amount/100).toFixed(2));
  } else {
    console.error('❌ Update failed:', JSON.stringify(data));
  }
}

main().catch(console.error);
