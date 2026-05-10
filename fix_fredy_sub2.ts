import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const WRONG_SUB_ID = 'd7v7rnn0i473fp4kqvf0';
  const FREDY_CUSTOMER_ID = 'd71jqev0i47dif9akad0';
  const FREDY_CARD_ID = 'd71jqev0i47dif9akacg';

  // Step 1: Delete the wrong subscription
  console.log('Deleting wrong subscription...');
  const delRes = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${WRONG_SUB_ID}`, {
    method: 'DELETE',
    headers: { 'Authorization': apiKey }
  });
  console.log('Delete status:', delRes.status);
  const delText = await delRes.text();
  if (delText) console.log('Delete response:', delText.substring(0, 200));

  // Step 2: Create new subscription with next_bill_date = June 25
  console.log('\nCreating new subscription with June 25 next bill date...');
  const subRes = await fetch('https://app.fluidpay.com/api/recurring/subscription', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'MyDojo Foundation Monthly Membership - Fredy Campos',
      amount: 14900,
      currency: 'usd',
      billing_frequency: 'monthly',
      billing_cycle_interval: 1,
      billing_days: '25',
      charge_on_day: true,
      duration: 12,
      next_bill_date: '2026-06-25',
      customer: {
        id: FREDY_CUSTOMER_ID,
        payment_method_type: 'card',
        payment_method_id: FREDY_CARD_ID
      }
    })
  });
  const subData = await subRes.json() as any;
  
  if (subData.status === 'success' && subData.data?.id) {
    const newSubId = subData.data.id;
    console.log('✅ Subscription created! ID:', newSubId);
    console.log('  Next bill date:', subData.data.next_bill_date);
    console.log('  Billing day:', subData.data.billing_days);
    console.log('  Amount: $' + (subData.data.amount/100).toFixed(2));
    
    // Update DB
    const db = await getDb();
    if (db) {
      await db.update(enrollments)
        .set({ fluidpaySubscriptionId: newSubId })
        .where(eq(enrollments.id, 270001));
      console.log('✅ DB updated with new subscription ID!');
    }
  } else {
    console.error('❌ Subscription creation failed:', JSON.stringify(subData));
  }
}

main().catch(console.error);
