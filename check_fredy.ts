import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { like, or } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const db = await getDb();
  if (!db) { console.error('No DB'); return; }

  const rows = await db.select().from(enrollments).where(
    or(
      like(enrollments.customerName, '%Fredy%'),
      like(enrollments.customerName, '%FREDY%'),
      like(enrollments.customerName, '%Campos%'),
      like(enrollments.studentName, '%Campos%')
    )
  );

  console.log('Fredy enrollments:', rows.length);
  for (const row of rows) {
    console.log('\n--- Enrollment ID:', row.id, '---');
    console.log('Customer:', row.customerName);
    console.log('Student:', row.studentName);
    console.log('Status:', row.status);
    console.log('Start date:', row.startDate);
    console.log('Cancellation requested at:', row.cancellationRequestedAt);
    console.log('Cancellation effective date:', row.cancellationEffectiveDate);
    console.log('Cancellation reason:', row.cancellationReason);
    console.log('Completion date:', row.completionDate);
    console.log('FluidPay Customer ID:', row.fluidpayCustomerId);
    console.log('FluidPay Subscription ID:', row.fluidpaySubscriptionId);
  }

  // Also check subscription status in FluidPay
  const fredySubId = 'd7f8cqv0i472hn8f152g';
  console.log('\n--- FluidPay Subscription ---');
  const subRes = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${fredySubId}`, {
    headers: { 'Authorization': apiKey }
  });
  const subData = await subRes.json() as any;
  if (subData.status === 'success' && subData.data) {
    const sub = subData.data;
    console.log('Status:', sub.status);
    console.log('Amount: $' + (sub.amount/100).toFixed(2));
    console.log('Next bill date:', sub.next_bill_date);
    console.log('Description:', sub.description);
    console.log('Created:', sub.created_at?.split('T')[0]);
  } else {
    console.log('Subscription response:', JSON.stringify(subData).substring(0, 300));
  }
}

main().catch(console.error);
