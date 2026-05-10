import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { like, or } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const LANA_CUSTOMER_ID = 'd6uub4v0i47c85td8uo0';

  // Get DB enrollment record
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(enrollments).where(
      or(
        like(enrollments.customerName, '%Lana%'),
        like(enrollments.customerName, '%Gabrhel%'),
        like(enrollments.studentName, '%Lana%'),
        like(enrollments.studentName, '%Gabrhel%')
      )
    );
    console.log('=== DB Enrollment Record ===');
    for (const row of rows) {
      console.log('ID:', row.id);
      console.log('Customer:', row.customerName);
      console.log('Student:', row.studentName);
      console.log('Status:', row.status);
      console.log('Start date:', row.startDate);
      console.log('Cancellation requested:', row.cancellationRequestedAt);
      console.log('Cancellation effective:', row.cancellationEffectiveDate);
      console.log('Cancellation reason:', row.cancellationReason);
      console.log('FluidPay Sub ID:', row.fluidpaySubscriptionId);
    }
  }

  // Get all transactions
  console.log('\n=== All Transactions ===');
  const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      limit: 200,
      date_range: { start_date: '2025-01-01T00:00:00Z', end_date: '2026-05-09T00:00:00Z' }
    })
  });
  const txData = await txRes.json() as any;
  
  if (Array.isArray(txData.data)) {
    const lanaTxs = txData.data.filter((tx: any) => {
      const name = `${tx.billing_address?.first_name || ''} ${tx.billing_address?.last_name || ''}`.toLowerCase();
      return name.includes('lana') || name.includes('gabrhel') || tx.customer_id === LANA_CUSTOMER_ID;
    });
    
    let totalCharged = 0, totalRefunded = 0;
    for (const tx of lanaTxs) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = (tx.amount/100).toFixed(2);
      const name = `${tx.billing_address?.first_name || ''} ${tx.billing_address?.last_name || ''}`.trim();
      const icon = tx.response === 'approved' ? '✅' : '❌';
      const subId = tx.subscription_id ? ` [Sub: ${tx.subscription_id.substring(0,10)}...]` : '';
      console.log(`${icon} ${date} | $${amount} | ${tx.type.toUpperCase()} | ${tx.response} | ${name}${subId}`);
      if (tx.response === 'approved') {
        if (tx.type === 'sale') totalCharged += tx.amount;
        if (tx.type === 'refund') totalRefunded += tx.amount;
      }
    }
    console.log(`\nTotal charged: $${(totalCharged/100).toFixed(2)}`);
    console.log(`Total refunded: $${(totalRefunded/100).toFixed(2)}`);
    console.log(`Net collected: $${((totalCharged-totalRefunded)/100).toFixed(2)}`);
  }

  // Check subscription
  console.log('\n=== Current Subscription ===');
  const subRes = await fetch('https://app.fluidpay.com/api/recurring/subscription/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: LANA_CUSTOMER_ID })
  });
  const subData = await subRes.json() as any;
  if (Array.isArray(subData.data)) {
    const lanaSubs = subData.data.filter((s: any) => 
      s.description?.toLowerCase().includes('lana') || s.customer?.id === LANA_CUSTOMER_ID
    );
    for (const sub of lanaSubs) {
      console.log(`Sub ID: ${sub.id}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Amount: $${(sub.amount/100).toFixed(2)}`);
      console.log(`Next bill: ${sub.next_bill_date}`);
      console.log(`Billing day: ${sub.billing_days}`);
    }
    if (lanaSubs.length === 0) console.log('No subscription found for Lana');
  }
}

main().catch(console.error);
