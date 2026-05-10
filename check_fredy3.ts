async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const fredyCustId = 'd71jqev0i47dif9akad0';

  // Search subscriptions for Fredy's customer ID
  console.log('--- Searching subscriptions for Fredy customer ID ---');
  const subSearchRes = await fetch('https://app.fluidpay.com/api/recurring/subscription/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: fredyCustId })
  });
  const subSearchData = await subSearchRes.json() as any;
  
  if (Array.isArray(subSearchData.data)) {
    console.log('Found', subSearchData.data.length, 'subscriptions');
    for (const sub of subSearchData.data) {
      console.log('\n  Subscription ID:', sub.id);
      console.log('  Description:', sub.description);
      console.log('  Status:', sub.status);
      console.log('  Amount: $' + (sub.amount/100).toFixed(2));
      console.log('  Next bill date:', sub.next_bill_date);
      console.log('  Billing day:', sub.billing_days);
      console.log('  Customer ID:', sub.customer?.id);
      if (sub.events?.length > 0) {
        console.log('  Last event:', sub.events[sub.events.length-1]?.message, 'at', sub.events[sub.events.length-1]?.created_at?.split('T')[0]);
      }
    }
  } else {
    console.log('Response:', JSON.stringify(subSearchData).substring(0, 500));
  }

  // Search all transactions for Fredy's customer
  console.log('\n--- All transactions for Fredy ---');
  const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      limit: 200,
      date_range: {
        start_date: '2026-01-01T00:00:00Z',
        end_date: '2026-05-09T00:00:00Z'
      }
    })
  });
  const txData = await txRes.json() as any;
  if (Array.isArray(txData.data)) {
    const fredyTxs = txData.data.filter((tx: any) => {
      const name = `${tx.billing_address?.first_name || ''} ${tx.billing_address?.last_name || ''}`.toLowerCase();
      return name.includes('fredy') || name.includes('campos');
    });
    console.log('Found', fredyTxs.length, 'transactions');
    for (const tx of fredyTxs) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = '$' + (tx.amount/100).toFixed(2);
      console.log(`  ${date} - ${amount} - ${tx.response} (${tx.type}) - SubID: ${tx.subscription_id || 'none'}`);
    }
  }
}

main().catch(console.error);
