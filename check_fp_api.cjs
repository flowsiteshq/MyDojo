const key = process.env.FLUIDPAY_SECRET_KEY;

async function main() {
  // Try the exact format used in billingRetryJob.ts
  const r = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: 10,
      offset: 0
    })
  });
  const d = await r.json();
  console.log('No filter - status:', r.status, 'total:', d.data?.total_count, 'msg:', d.msg);
  
  // Try with customer_id for Busayo
  const r2 = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: 'd7pvmsv0i47d6t50vnd0',
      limit: 50,
      offset: 0
    })
  });
  const d2 = await r2.json();
  console.log('\nBusayo vault 1 transactions - status:', r2.status, 'total:', d2.data?.total_count);
  const txs2 = d2.data?.transactions || [];
  for (const t of txs2) {
    console.log(`  ${t.status.padEnd(10)} $${(t.amount/100).toFixed(2)} at ${t.created_at} [sub: ${t.subscription_id || 'none'}]`);
  }
  
  // Try second vault
  const r3 = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: 'd8rdurv0i473928t7j40',
      limit: 50,
      offset: 0
    })
  });
  const d3 = await r3.json();
  console.log('\nBusayo vault 2 transactions - status:', r3.status, 'total:', d3.data?.total_count);
  const txs3 = d3.data?.transactions || [];
  for (const t of txs3) {
    console.log(`  ${t.status.padEnd(10)} $${(t.amount/100).toFixed(2)} at ${t.created_at} [sub: ${t.subscription_id || 'none'}]`);
  }
}

main().catch(console.error);
