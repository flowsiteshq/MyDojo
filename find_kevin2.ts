async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;

  // Search all transactions and look for Kevin's amounts/dates
  console.log('Searching all recent transactions...');
  const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      limit: 100,
      date_range: {
        start_date: '2026-04-01T00:00:00Z',
        end_date: '2026-05-09T00:00:00Z'
      }
    })
  });
  const txData = await txRes.json() as any;
  
  if (txData.status === 'success' && txData.data?.transactions) {
    console.log('Total transactions found:', txData.data.transactions.length);
    console.log('\nAll transactions:');
    for (const tx of txData.data.transactions) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = '$' + (tx.amount/100).toFixed(2);
      const name = tx.billing_address ? `${tx.billing_address.first_name} ${tx.billing_address.last_name}` : 'N/A';
      const custId = tx.customer_id || 'no-customer';
      console.log(`  ${date} - ${amount} - ${tx.response} - ${name} - Customer: ${custId}`);
    }
  } else {
    console.log('Transaction search failed:', JSON.stringify(txData).substring(0, 300));
  }
}

main().catch(console.error);
