const key = process.env.FLUIDPAY_SECRET_KEY;
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Find Jayden in enrollments
  const [rows] = await conn.execute(
    "SELECT id, customerName, studentName, customerEmail, customerPhone, status, fluidpayCustomerId, fluidpaySubscriptionId, createdAt FROM enrollments WHERE studentName LIKE '%Jayden%' OR customerName LIKE '%Jayden%' ORDER BY createdAt DESC LIMIT 10"
  );
  console.log('Jayden enrollments:', JSON.stringify(rows, null, 2));
  
  // Also check most recent enrollments (last 2 hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const [recent] = await conn.execute(
    `SELECT id, customerName, studentName, status, fluidpayCustomerId, createdAt FROM enrollments WHERE createdAt >= '${twoHoursAgo}' ORDER BY createdAt DESC LIMIT 10`
  );
  console.log('\nRecent enrollments (last 2 hours):', JSON.stringify(recent, null, 2));
  
  await conn.end();
}

main().catch(console.error);
