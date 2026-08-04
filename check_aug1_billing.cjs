const key = process.env.FLUIDPAY_SECRET_KEY;

async function main() {
  const r = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      created_at: { start_date: '2026-08-01T00:00:00Z', end_date: '2026-08-01T23:59:59Z' },
      limit: 200,
      offset: 0
    })
  });
  const d = await r.json();
  const txs = d.data?.transactions || [];
  console.log('Total Aug 1 transactions:', txs.length);
  
  const byCustomer = {};
  for (const t of txs) {
    const name = ((t.billing_address?.first_name || '') + ' ' + (t.billing_address?.last_name || '')).trim();
    if (!byCustomer[name]) byCustomer[name] = [];
    byCustomer[name].push({ 
      id: t.id,
      time: t.created_at, 
      amount: (t.amount/100).toFixed(2), 
      status: t.status,
      sub: t.subscription_id || 'none', 
      source: t.transaction_source 
    });
  }
  
  console.log('\n=== CUSTOMERS WITH MULTIPLE CHARGES ===');
  let totalOvercharged = 0;
  for (const [name, charges] of Object.entries(byCustomer)) {
    const settled = charges.filter(c => c.status === 'settled');
    if (settled.length > 1) {
      const total = settled.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const overcharge = total - parseFloat(settled[0].amount); // first charge is legitimate
      totalOvercharged += overcharge;
      console.log(`\n${name} — ${settled.length} settled charges, total: $${total.toFixed(2)}, overcharged: $${overcharge.toFixed(2)}`);
      for (const c of charges) {
        console.log(`  ${c.status.padEnd(10)} $${c.amount} at ${c.time} [sub: ${c.sub}] [src: ${c.source}]`);
      }
    }
  }
  console.log(`\nTotal overcharged across all customers: $${totalOvercharged.toFixed(2)}`);
  
  const settled = txs.filter(t => t.status === 'settled');
  const totalSettled = settled.reduce((sum, t) => sum + t.amount/100, 0);
  console.log(`\nAll settled Aug 1: $${totalSettled.toFixed(2)} across ${settled.length} transactions`);
  
  const withSub = txs.filter(t => t.subscription_id);
  const withoutSub = txs.filter(t => !t.subscription_id);
  console.log(`With subscription_id (FluidPay recurring): ${withSub.length}`);
  console.log(`Without subscription_id (manual/API): ${withoutSub.length}`);
}

main().catch(console.error);
