async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const ANGELINA_CUSTOMER_ID = 'd6tdriv0i47c85t1ph50';

  // Get all transactions for Angelina
  console.log('=== Angelina Ruiz Transaction History ===\n');
  const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      limit: 200,
      date_range: {
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2026-05-09T00:00:00Z'
      }
    })
  });
  const txData = await txRes.json() as any;
  
  if (Array.isArray(txData.data)) {
    const angelinaTxs = txData.data.filter((tx: any) => {
      const name = `${tx.billing_address?.first_name || ''} ${tx.billing_address?.last_name || ''}`.toLowerCase();
      return name.includes('angelina') || name.includes('ruiz') || tx.customer_id === ANGELINA_CUSTOMER_ID;
    });
    
    console.log(`Found ${angelinaTxs.length} transactions:\n`);
    let totalCharged = 0;
    let totalRefunded = 0;
    
    for (const tx of angelinaTxs) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = (tx.amount/100).toFixed(2);
      const name = `${tx.billing_address?.first_name || ''} ${tx.billing_address?.last_name || ''}`.trim();
      const icon = tx.response === 'approved' ? '✅' : '❌';
      const subId = tx.subscription_id ? ` [Sub: ${tx.subscription_id}]` : '';
      
      console.log(`${icon} ${date} | $${amount} | ${tx.type.toUpperCase()} | ${tx.response} | ${name}${subId}`);
      
      if (tx.response === 'approved') {
        if (tx.type === 'sale') totalCharged += tx.amount;
        if (tx.type === 'refund') totalRefunded += tx.amount;
      }
    }
    
    console.log('\n--- Summary ---');
    console.log(`Total charged: $${(totalCharged/100).toFixed(2)}`);
    console.log(`Total refunded: $${(totalRefunded/100).toFixed(2)}`);
    console.log(`Net collected: $${((totalCharged - totalRefunded)/100).toFixed(2)}`);
  }
  
  // Check subscription status
  console.log('\n=== Subscription Status ===');
  const subRes = await fetch('https://app.fluidpay.com/api/recurring/subscription/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: ANGELINA_CUSTOMER_ID })
  });
  const subData = await subRes.json() as any;
  if (Array.isArray(subData.data) && subData.data.length > 0) {
    for (const sub of subData.data) {
      console.log(`Sub ID: ${sub.id}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Amount: $${(sub.amount/100).toFixed(2)}`);
      console.log(`Next bill: ${sub.next_bill_date}`);
    }
  } else {
    console.log('No active subscriptions found');
  }
}

main().catch(console.error);
