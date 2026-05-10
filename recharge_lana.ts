import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const LANA_CUSTOMER_ID = 'd6uub4v0i47c85td8uo0';

  // Get Lana's card ID
  const custRes = await fetch(`https://app.fluidpay.com/api/customer/${LANA_CUSTOMER_ID}`, {
    headers: { 'Authorization': apiKey }
  });
  const custData = await custRes.json() as any;
  const card = custData.data?.payment_method?.card;
  const cardId = card?.id;
  console.log('Card:', card?.card_type, 'ending in', card?.last_four, '- ID:', cardId);

  if (!cardId) { console.error('No card found!'); return; }

  // Step 1: Charge $149 for May
  console.log('\nCharging Lana $149.00 for May...');
  const chargeRes = await fetch('https://app.fluidpay.com/api/transaction', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'sale',
      amount: 14900,
      payment_method: {
        customer: {
          id: LANA_CUSTOMER_ID,
          payment_method_type: 'card',
          payment_method_id: cardId
        }
      },
      billing_address: { first_name: 'Lana', last_name: 'Gabrhel' }
    })
  });
  const chargeData = await chargeRes.json() as any;

  if (chargeData.status === 'success' && chargeData.data?.response === 'approved') {
    console.log('✅ Charged $149.00! Transaction ID:', chargeData.data.id);
  } else {
    console.error('❌ Charge failed:', chargeData.data?.response_body?.card?.processor_response_text || JSON.stringify(chargeData).substring(0, 300));
    return;
  }

  // Step 2: Create subscription on the 21st of each month
  // Next bill: June 21 (since May was just charged manually)
  console.log('\nCreating subscription (21st of each month, next bill June 21)...');
  const subRes = await fetch('https://app.fluidpay.com/api/recurring/subscription', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'MyDojo Foundation Monthly Membership - Lana Gabrhel',
      amount: 14900,
      currency: 'usd',
      billing_frequency: 'monthly',
      billing_cycle_interval: 1,
      billing_days: '21',
      charge_on_day: false,
      duration: 12,
      start_date: '2026-06-21',
      customer: {
        id: LANA_CUSTOMER_ID,
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
    console.log('  Billing day:', subData.data.billing_days);
    console.log('  Amount: $' + (subData.data.amount/100).toFixed(2));

    // Update DB
    const db = await getDb();
    if (db) {
      await db.update(enrollments)
        .set({ fluidpaySubscriptionId: newSubId })
        .where(eq(enrollments.id, 240001));
      console.log('✅ DB updated!');
    }
  } else {
    console.error('❌ Subscription failed:', JSON.stringify(subData));
  }
}

main().catch(console.error);
