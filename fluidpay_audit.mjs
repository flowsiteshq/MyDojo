import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve('/home/ubuntu/mydojo-website', '.env') });

import { createConnection } from 'mysql2/promise';

const FLUIDPAY_KEY = process.env.FLUIDPAY_SECRET_KEY;
const BASE = 'https://app.fluidpay.com/api';

async function fpGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': FLUIDPAY_KEY }
  });
  return res.json();
}

const conn = await createConnection(process.env.DATABASE_URL);
const [enrollments] = await conn.execute(`
  SELECT 
    e.id,
    COALESCE(e.studentName, e.customerName) as student,
    e.customerName as parent,
    e.customerPhone as phone,
    e.startDate,
    DAY(e.startDate) as billingDay,
    e.fluidpaySubscriptionId,
    e.fluidpayCustomerId,
    e.remainingBalance,
    e.monthlyPaymentsRemaining,
    e.status
  FROM enrollments e
  WHERE e.status = 'active'
  ORDER BY DAY(e.startDate) ASC
`);
await conn.end();

console.log('\n=== MAY 2026 PAYMENT SCHEDULE (Actual FluidPay Amounts) ===\n');
console.log('Bill Day | Student                  | Parent                   | Phone          | Monthly $ | Remaining | Pmts Left | FluidPay Sub');
console.log('---------|--------------------------|--------------------------|----------------|-----------|-----------|-----------|-------------');

let totalMonthly = 0;
let noSub = [];

for (const e of enrollments) {
  let monthlyAmount = 'N/A';
  let subStatus = 'NO SUB';
  
  if (e.fluidpaySubscriptionId) {
    try {
      const sub = await fpGet(`/recurring/subscription/${e.fluidpaySubscriptionId}`);
      if (sub.data) {
        monthlyAmount = `$${parseFloat(sub.data.amount).toFixed(2)}`;
        subStatus = sub.data.status || 'unknown';
        totalMonthly += parseFloat(sub.data.amount) || 0;
      }
    } catch (err) {
      monthlyAmount = 'ERROR';
    }
  } else {
    noSub.push(e);
  }
  
  const billingDay = e.billingDay ? `${e.billingDay}`.padStart(2,'0') : 'N/A';
  const student = (e.student || '').substring(0,24).padEnd(24);
  const parent = (e.parent || '').substring(0,24).padEnd(24);
  const phone = (e.phone || '').substring(0,14).padEnd(14);
  const remBal = `$${parseFloat(e.remainingBalance||0).toFixed(2)}`.padStart(9);
  const remPay = `${e.monthlyPaymentsRemaining||0}`.padStart(9);
  const monthly = monthlyAmount.padStart(9);
  
  console.log(`${billingDay}       | ${student} | ${parent} | ${phone} | ${monthly} | ${remBal} | ${remPay} | ${subStatus}`);
}

console.log('\n=== SUMMARY ===');
console.log(`Total Monthly Tuition (from FluidPay subs): $${totalMonthly.toFixed(2)}`);
console.log(`\nStudents WITHOUT FluidPay subscription (${noSub.length}):`);
for (const e of noSub) {
  console.log(`  - ${e.student} (${e.parent}) | Phone: ${e.phone} | Enrollment ID: ${e.id}`);
}
