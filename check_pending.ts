import { getDb } from './server/db';
import { enrollments } from './drizzle/schema';
import { like, or } from 'drizzle-orm';

async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const db = await getDb();
  if (!db) { console.error('No DB'); return; }

  const members = [
    { name: 'Fredy', search: ['%Fredy%', '%FREDY%', '%Campos%'] },
    { name: 'Angelina', search: ['%Angelina%', '%Ruiz%'] },
    { name: 'Bryce', search: ['%Bryce%'] },
    { name: 'Femi', search: ['%Femi%', '%Alabi%'] },
  ];

  for (const member of members) {
    console.log(`\n=== ${member.name} ===`);
    
    const conditions = member.search.map(s => 
      or(
        like(enrollments.customerName, s),
        like(enrollments.studentName, s)
      )
    );
    
    const rows = await db.select({
      id: enrollments.id,
      customerName: enrollments.customerName,
      studentName: enrollments.studentName,
      status: enrollments.status,
      fluidpayCustomerId: enrollments.fluidpayCustomerId,
      fluidpaySubscriptionId: enrollments.fluidpaySubscriptionId,
      startDate: enrollments.startDate,
    }).from(enrollments).where(or(...conditions));
    
    if (rows.length === 0) {
      console.log('  No enrollment found');
      continue;
    }
    
    for (const row of rows) {
      console.log(`  ID: ${row.id}`);
      console.log(`  Customer: ${row.customerName}`);
      console.log(`  Student: ${row.studentName}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  FluidPay Customer ID: ${row.fluidpayCustomerId}`);
      console.log(`  FluidPay Subscription ID: ${row.fluidpaySubscriptionId}`);
      
      // Check subscription status if we have one
      if (row.fluidpaySubscriptionId) {
        const subRes = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${row.fluidpaySubscriptionId}`, {
          headers: { 'Authorization': apiKey }
        });
        const subData = await subRes.json() as any;
        if (subData.status === 'success' && subData.data) {
          const sub = subData.data;
          console.log(`  Subscription status: ${sub.status}`);
          console.log(`  Subscription amount: $${(sub.amount/100).toFixed(2)}`);
          console.log(`  Next bill date: ${sub.next_bill_date}`);
        }
      }
      
      // Check customer vault if we have customer ID
      if (row.fluidpayCustomerId) {
        const custRes = await fetch(`https://app.fluidpay.com/api/customer/${row.fluidpayCustomerId}`, {
          headers: { 'Authorization': apiKey }
        });
        const custData = await custRes.json() as any;
        if (custData.status === 'success' && custData.data) {
          const card = custData.data.payment_method?.card;
          if (card) {
            console.log(`  Card on file: ${card.card_type} ending in ${card.last_four}, exp ${card.expiration_date}`);
          } else {
            console.log(`  No card on file`);
          }
        }
      }
    }
  }
  
  // Also check recent transactions for these members
  console.log('\n\n=== Recent transactions for these members ===');
  const txRes = await fetch('https://app.fluidpay.com/api/transaction/search', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      limit: 200,
      date_range: {
        start_date: '2026-03-01T00:00:00Z',
        end_date: '2026-05-09T00:00:00Z'
      }
    })
  });
  const txData = await txRes.json() as any;
  
  if (Array.isArray(txData.data)) {
    const relevant = txData.data.filter((tx: any) => {
      const name = `${tx.billing_address?.first_name || ''} ${tx.billing_address?.last_name || ''}`.toLowerCase();
      return name.includes('fredy') || name.includes('campos') || 
             name.includes('angelina') || name.includes('ruiz') ||
             name.includes('bryce') || name.includes('femi') || name.includes('alabi');
    });
    
    for (const tx of relevant) {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const amount = '$' + (tx.amount/100).toFixed(2);
      const name = `${tx.billing_address?.first_name || ''} ${tx.billing_address?.last_name || ''}`.trim();
      console.log(`  ${date} - ${amount} - ${tx.response} (${tx.type}) - ${name}`);
    }
  }
}

main().catch(console.error);
