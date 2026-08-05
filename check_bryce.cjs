const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Find Bryce/Biron Gamble - get all columns
  const [rows] = await conn.execute(
    "SELECT * FROM enrollments WHERE customerName LIKE '%Gamble%' OR customerName LIKE '%Bryce%' OR customerName LIKE '%Biron%' ORDER BY createdAt DESC LIMIT 10"
  );
  console.log('Gamble enrollments:', JSON.stringify(rows, null, 2));
  
  // Check payment link token from the URL
  const token = 'd4a704efe68304d636e58312e73adea62c2539dda8e17ea0';
  const [payLinks] = await conn.execute(
    "SELECT * FROM customPaymentLinks WHERE token = ? LIMIT 5",
    [token]
  );
  console.log('\nPayment link for token:', JSON.stringify(payLinks, null, 2));
  
  await conn.end();
}

main().catch(console.error);
