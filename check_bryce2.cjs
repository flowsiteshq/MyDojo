const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const fluidpayCustomerId = 'd6ob07n0i470gsbkrt80';
  const fluidpaySubscriptionId = 'd7f8cqn0i472hn8f1500';
  
  // Get Bryce's scheduled payments by customer ID
  const [scheduled] = await conn.execute(
    "SELECT * FROM scheduledPayments WHERE fluidpayCustomerId = ? ORDER BY scheduledDate ASC",
    [fluidpayCustomerId]
  );
  console.log('\nScheduled payments count:', scheduled.length);
  
  let totalCharged = 0;
  let totalPending = 0;
  for (const p of scheduled) {
    const amt = parseFloat(p.amount);
    if (p.status === 'charged') totalCharged += amt;
    else if (p.status === 'pending') totalPending += amt;
    console.log(`  ${p.scheduledDate?.toISOString?.()?.slice(0,10) || p.scheduledDate} | ${p.status.padEnd(10)} | $${amt.toFixed(2)} | ${p.description || ''}`);
  }
  console.log(`\nTotal charged: $${totalCharged.toFixed(2)}, Total pending: $${totalPending.toFixed(2)}`);
  
  await conn.end();
  
  // Get FluidPay subscription details
  const key = process.env.FLUIDPAY_SECRET_KEY;
  const r2 = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${fluidpaySubscriptionId}`, {
    headers: { Authorization: key }
  });
  const d2 = await r2.json();
  console.log('\nSubscription status:', d2.data?.status, 'amount:', d2.data?.amount, 'next_run:', d2.data?.next_run_date);
  console.log('Full subscription:', JSON.stringify(d2.data, null, 2));
}

main().catch(console.error);
