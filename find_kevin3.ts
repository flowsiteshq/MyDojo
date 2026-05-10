async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;

  // Search all transactions - data is an array, not data.transactions
  console.log('Searching all recent transactions...');
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
  
  if (txData.status === 'success' && Array.isArray(txData.data)) {
    const transactions = txData.data;
    console.log('Total transactions found:', transactions.length);
    
    // Print all transactions with names
    console.log('\nAll transactions:');
    for (const tx of transactions) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = '$' + (tx.amount/100).toFixed(2);
      const billing = tx.billing_address || {};
      const name = `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || 'N/A';
      const custId = tx.customer_id || 'no-customer';
      const subId = tx.subscription_id || '';
      console.log(`  ${date} - ${amount} - ${tx.response} (${tx.type}) - ${name} - CustID: ${custId} ${subId ? '- SubID: '+subId : ''}`);
    }
    
    // Look for Kevin specifically
    console.log('\n--- SEARCHING FOR KEVIN ---');
    const kevinTxs = transactions.filter((tx: any) => {
      const billing = tx.billing_address || {};
      const name = `${billing.first_name || ''} ${billing.last_name || ''}`.toLowerCase();
      return name.includes('kevin') || name.includes('argelys') || name.includes('kessel') || name.includes('domini');
    });
    
    if (kevinTxs.length > 0) {
      console.log(`Found ${kevinTxs.length} transactions for Kevin:`);
      for (const tx of kevinTxs) {
        const date = new Date(tx.created_at).toISOString().split('T')[0];
        const amount = '$' + (tx.amount/100).toFixed(2);
        const billing = tx.billing_address || {};
        console.log(`  ID: ${tx.id}`);
        console.log(`  Date: ${date}`);
        console.log(`  Amount: ${amount}`);
        console.log(`  Response: ${tx.response}`);
        console.log(`  Type: ${tx.type}`);
        console.log(`  Name: ${billing.first_name} ${billing.last_name}`);
        console.log(`  Customer ID: ${tx.customer_id}`);
        console.log(`  Subscription ID: ${tx.subscription_id}`);
        console.log('---');
      }
    } else {
      console.log('No transactions found for Kevin by name.');
      console.log('\nLet me check all unique customer IDs and names...');
      const nameMap = new Map<string, number>();
      for (const tx of transactions) {
        const billing = tx.billing_address || {};
        const name = `${billing.first_name || ''} ${billing.last_name || ''}`.trim();
        if (name) {
          nameMap.set(name, (nameMap.get(name) || 0) + 1);
        }
      }
      console.log('All unique names in transactions:');
      for (const [name, count] of nameMap.entries()) {
        console.log(`  ${name}: ${count} transactions`);
      }
    }
  } else {
    console.log('Unexpected format:', JSON.stringify(txData).substring(0, 500));
  }
}

main().catch(console.error);
