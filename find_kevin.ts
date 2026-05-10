async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;

  // Search by name
  const searches = [
    { first_name: 'Argelys' },
    { last_name: 'Kessel' },
    { last_name: 'Domini' },
    { phone: '8322969395' },
  ];

  for (const query of searches) {
    const res = await fetch('https://app.fluidpay.com/api/customer/search', {
      method: 'POST',
      headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    const data = await res.json() as any;
    if (data.status === 'success' && data.data?.customers?.length > 0) {
      console.log('Found with query:', JSON.stringify(query));
      for (const c of data.data.customers) {
        console.log('  Customer ID:', c.id);
        console.log('  Name:', c.first_name, c.last_name);
        console.log('  Phone:', c.phone);
        console.log('  Email:', c.email);
        console.log('  Created:', c.created_at?.split('T')[0]);
        
        // Get their transactions
        const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
          method: 'POST',
          headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: c.id, limit: 20 })
        });
        const txData = await txRes.json() as any;
        if (txData.status === 'success' && txData.data?.transactions?.length > 0) {
          console.log('  Transactions:');
          for (const tx of txData.data.transactions) {
            const date = new Date(tx.created_at).toISOString().split('T')[0];
            const amount = '$' + (tx.amount/100).toFixed(2);
            console.log(`    ${date} - ${amount} - ${tx.response} (${tx.type})`);
          }
        } else {
          console.log('  No transactions found');
        }
      }
    }
  }
  
  // Also search all subscriptions
  console.log('\nSearching all subscriptions for Kevin...');
  const subRes = await fetch('https://app.fluidpay.com/api/recurring/subscription/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: 50 })
  });
  const subData = await subRes.json() as any;
  if (subData.status === 'success' && subData.data?.subscriptions) {
    for (const sub of subData.data.subscriptions) {
      const desc = sub.description || '';
      if (desc.toLowerCase().includes('kevin') || desc.toLowerCase().includes('argelys') || desc.toLowerCase().includes('kessel')) {
        console.log('Found subscription:', sub.id);
        console.log('  Description:', sub.description);
        console.log('  Amount: $' + (sub.amount/100).toFixed(2));
        console.log('  Status:', sub.status);
        console.log('  Next bill:', sub.next_bill_date);
        console.log('  Customer ID:', sub.customer?.id);
      }
    }
  }
}

main().catch(console.error);
