import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;

  const FREDY_CUSTOMER_ID = 'd71jqev0i47dif9akad0';
  // Card ID from customer record — mastercard ending in 0766
  // Need to get it from the customer record
  
  // Get Fredy's customer record to find card ID
  console.log('Getting Fredy\'s customer record...');
  const custRes = await fetch(`https://app.fluidpay.com/api/customer/${FREDY_CUSTOMER_ID}`, {
    headers: { 'Authorization': apiKey }
  });
  const custData = await custRes.json() as any;
  
  if (custData.status !== 'success') {
    console.error('Failed to get customer:', custData);
    return;
  }
  
  const card = custData.data.payment_method?.card;
  const cardId = card?.id;
  console.log('Card:', card?.card_type, 'ending in', card?.last_four, '- ID:', cardId);
  
  if (!cardId) {
    console.error('No card ID found!');
    return;
  }

  // Step 1: Already charged $149 in previous run (Transaction ID: d7v7rgf0i473fp4kqtvg)
  console.log('✅ Fredy already charged $149.00 (Transaction ID: d7v7rgf0i473fp4kqtvg)');

  // Step 2: Create new subscription on the 25th of each month
  console.log('\nCreating new subscription for Fredy (25th of each month)...');
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
      next_bill_date: '2026-05-25',
      customer: {
        id: FREDY_CUSTOMER_ID,
        payment_method_type: 'card',
        payment_method_id: cardId
      }
    })
  });
  const subData = await subRes.json() as any;
  
  if (subData.status === 'success' && subData.data?.id) {
    const newSubId = subData.data.id;
    console.log('✅ Subscription created! ID:', newSubId);
    console.log('  Next bill date:', subData.data.next_bill_date);
    console.log('  Amount: $' + (subData.data.amount/100).toFixed(2));
    
    // Step 3: Update DB with new subscription ID
    console.log('\nUpdating DB...');
    const db = await getDb();
    if (db) {
      await db.update(enrollments)
        .set({ fluidpaySubscriptionId: newSubId })
        .where(eq(enrollments.id, 270001));
      console.log('✅ DB updated!');
    }
  } else {
    console.error('❌ Subscription creation failed:', JSON.stringify(subData));
  }
}

main().catch(console.error);
