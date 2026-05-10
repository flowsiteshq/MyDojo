import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const WRONG_SUB_ID = 'd7v7sin0i47d6t6fnfl0';
  const FREDY_CUSTOMER_ID = 'd71jqev0i47dif9akad0';
  const FREDY_CARD_ID = 'd71jqev0i47dif9akacg';

  // Step 1: Delete the wrong subscription
  console.log('Deleting wrong subscription...');
  const delRes = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${WRONG_SUB_ID}`, {
    method: 'DELETE',
    headers: { 'Authorization': apiKey }
  });
  console.log('Delete status:', delRes.status);

  // Step 2: Create new subscription - use start_date instead of next_bill_date
  // Try without charge_on_day and see what happens with billing_days=25
  console.log('\nCreating subscription (attempt with start_date)...');
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
      charge_on_day: false,
      duration: 12,
      start_date: '2026-06-25',
      customer: {
        id: FREDY_CUSTOMER_ID,
        payment_method_type: 'card',
        payment_method_id: FREDY_CARD_ID
      }
    })
  });
  const subData = await subRes.json() as any;
  console.log('Full response:', JSON.stringify(subData, null, 2).substring(0, 800));
  
  if (subData.status === 'success' && subData.data?.id) {
    const newSubId = subData.data.id;
    console.log('\n✅ Subscription created! ID:', newSubId);
    console.log('  Next bill date:', subData.data.next_bill_date);
    console.log('  Billing day:', subData.data.billing_days);
    
    // Update DB
    const db = await getDb();
    if (db) {
      await db.update(enrollments)
        .set({ fluidpaySubscriptionId: newSubId })
        .where(eq(enrollments.id, 270001));
      console.log('✅ DB updated!');
    }
  } else {
    console.error('❌ Failed:', JSON.stringify(subData));
  }
}

main().catch(console.error);
