import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { eq, like, or } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;

  const KEVIN_CUSTOMER_ID = 'd7pusvn0i47d6t50rahg';
  const KEVIN_SUBSCRIPTION_ID = 'd7puuj70i473fp36l100';
  // Payment method card ID from the customer record
  const KEVIN_CARD_ID = 'd7pusvn0i47d6t50rah0';

  // Charge Kevin $149.00 using his vaulted card
  console.log('Charging Kevin $149.00...');
  const chargeRes = await fetch('https://app.fluidpay.com/api/transaction', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'sale',
      amount: 14900, // $149.00 in cents
      payment_method: {
        customer: {
          id: KEVIN_CUSTOMER_ID,
          payment_method_type: 'card',
          payment_method_id: KEVIN_CARD_ID
        }
      },
      billing_address: {
        first_name: 'Argelys',
        last_name: 'Kessel Domini'
      }
    })
  });
  const chargeData = await chargeRes.json() as any;
  console.log('Charge response:', JSON.stringify(chargeData, null, 2).substring(0, 1000));

  if (chargeData.status === 'success' && chargeData.data?.response === 'approved') {
    console.log('\n✅ Kevin successfully charged $149.00!');
    console.log('Transaction ID:', chargeData.data.id);
    
    // Update the DB to link Kevin's enrollment to his FluidPay IDs
    console.log('\nUpdating Kevin\'s enrollment in DB...');
    
    const db = await getDb();
    if (!db) {
      console.error('Could not connect to DB');
      return;
    }
    
    // Find Kevin's enrollment by customerName or studentName
    const kevinEnrollments = await db.select().from(enrollments).where(
      or(
        like(enrollments.customerName, '%Argelys%'),
        like(enrollments.customerName, '%Kessel%'),
        like(enrollments.studentName, '%Argelys%'),
        like(enrollments.studentName, '%Kessel%')
      )
    );
    
    console.log('Found enrollments:', kevinEnrollments.length);
    for (const enrollment of kevinEnrollments) {
      console.log(`  ID: ${enrollment.id}, Customer: ${enrollment.customerName}, Student: ${enrollment.studentName}`);
    }
    
    if (kevinEnrollments.length > 0) {
      const enrollment = kevinEnrollments[0];
      await db.update(enrollments)
        .set({
          fluidpayCustomerId: KEVIN_CUSTOMER_ID,
          fluidpaySubscriptionId: KEVIN_SUBSCRIPTION_ID
        })
        .where(eq(enrollments.id, enrollment.id));
      console.log('\n✅ DB updated with Kevin\'s FluidPay IDs!');
    } else {
      console.log('⚠️  No enrollment found in DB for Kevin - DB update skipped');
    }
  } else {
    console.error('\n❌ Charge failed:', JSON.stringify(chargeData));
  }
}

main().catch(console.error);
