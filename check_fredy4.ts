async function main() {
  const apiKey = process.env.FLUIDPAY_SECRET_KEY!;
  const fredySubId = 'd7f8cqv0i472hn8f152g';

  // Try to get the subscription directly
  console.log('--- Direct subscription lookup ---');
  const r1 = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${fredySubId}`, {
    headers: { 'Authorization': apiKey }
  });
  console.log('Status:', r1.status);
  const d1 = await r1.text();
  console.log('Response:', d1.substring(0, 1000));

  // Also check Lana, Angelina subscriptions
  const subs = [
    { name: 'Lana', id: 'd7f8cqv0i47dplc3mvp0' },
    { name: 'Angelina', id: 'd7f8cqv0i47dplc3mvo0' },
    { name: 'Fredy', id: 'd7f8cqv0i472hn8f152g' },
    { name: 'Zion', id: 'd7f8cqv0i47dplc3mvq0' },
    { name: 'Wilfredo', id: 'd7f8cr70i47dplc3mvr0' },
  ];

  for (const sub of subs) {
    const r = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${sub.id}`, {
      headers: { 'Authorization': apiKey }
    });
    const d = await r.json() as any;
    if (d.status === 'success' && d.data) {
      console.log(`\n${sub.name}: status=${d.data.status}, amount=$${(d.data.amount/100).toFixed(2)}, next_bill=${d.data.next_bill_date}`);
    } else {
      console.log(`\n${sub.name}: ${d.msg || d.status} (${r.status})`);
    }
  }
}

main().catch(console.error);
