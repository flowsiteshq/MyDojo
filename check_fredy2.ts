async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const fredySubId = 'd7f8cqv0i472hn8f152g';
  const fredyCustId = 'd71jqev0i47dif9akad0';

  // Check subscription via search
  console.log('--- Searching for Fredy subscription ---');
  const subSearchRes = await fetch('https://app.fluidpay.com/api/recurring/subscription/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: fredyCustId })
  });
  const subSearchData = await subSearchRes.json() as any;
  console.log('Search response:', JSON.stringify(subSearchData, null, 2).substring(0, 1000));

  // Check customer record
  console.log('\n--- Fredy customer record ---');
  const custRes = await fetch(`https://app.fluidpay.com/api/customer/${fredyCustId}`, {
    headers: { 'Authorization': apiKey }
  });
  const custData = await custRes.json() as any;
  if (custData.status === 'success' && custData.data) {
    const card = custData.data.payment_method?.card;
    console.log('Customer:', custData.data.description);
    if (card) {
      console.log('Card:', card.card_type, 'ending in', card.last_four, 'exp', card.expiration_date);
    }
  }

  // Check all transactions for Fredy
  console.log('\n--- All Fredy transactions ---');
  const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      customer_id: fredyCustId,
      limit: 20
    })
  });
  const txData = await txRes.json() as any;
  if (Array.isArray(txData.data)) {
    for (const tx of txData.data) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = '$' + (tx.amount/100).toFixed(2);
      console.log(`  ${date} - ${amount} - ${tx.response} (${tx.type})`);
    }
  }
}

main().catch(console.error);
