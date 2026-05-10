import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await conn.execute(
    "SELECT customerName, customerPhone, fluidpayCustomerId, fluidpaySubscriptionId, downPaymentAmount, membershipPackageId, createdAt FROM enrollments WHERE customerName LIKE '%Kevin%' OR customerName LIKE '%Argelys%' OR customerName LIKE '%Kessel%'"
  ) as any;
  await conn.end();
  
  if (!rows.length) { console.log('Not found'); return; }
  
  const e = rows[0];
  console.log('Name:', e.customerName);
  console.log('Phone:', e.customerPhone);
  console.log('Enrolled:', new Date(e.createdAt).toISOString().split('T')[0]);
  console.log('Package:', e.membershipPackageId);
  console.log('Down payment:', e.downPaymentAmount);
  console.log('Customer ID:', e.fluidpayCustomerId);
  console.log('Subscription ID:', e.fluidpaySubscriptionId);

  // Get subscription details from FluidPay
  const apiKey = process.env.FLUIDPAY_SECRET_KEY;
  const subRes = await fetch('https://app.fluidpay.com/api/recurring/subscription/' + e.fluidpaySubscriptionId, {
    headers: { 'Authorization': apiKey! }
  });
  const subData = await subRes.json() as any;
  
  if (subData.status === 'success') {
    console.log('\nSubscription amount: $' + (subData.data.amount/100).toFixed(2));
    console.log('Billing day:', subData.data.billing_days);
    console.log('Next bill:', subData.data.next_bill_date);
    console.log('Sub status:', subData.data.status);
  } else {
    console.log('Subscription error:', subData.msg);
  }

  // Get recent transactions
  const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: e.fluidpayCustomerId,
      limit: 20
    })
  });
  const txData = await txRes.json() as any;
  
  if (txData.status === 'success' && txData.data?.transactions) {
    console.log('\nTransaction history:');
    for (const tx of txData.data.transactions) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = '$' + (tx.amount/100).toFixed(2);
      console.log(`  ${date} - ${amount} - ${tx.response} (${tx.type})`);
    }
  } else {
    console.log('\nTransaction lookup:', txData.msg || JSON.stringify(txData).substring(0, 200));
  }
}

main().catch(console.error);
