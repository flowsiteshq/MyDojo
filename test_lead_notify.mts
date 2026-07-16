import 'dotenv/config';
import { createConnection } from 'mysql2/promise';
import { sendSms } from './server/sms800';

// Directly test SMS to all staff with leadSmsNotify=1
const conn = await createConnection(process.env.DATABASE_URL!);
const [staffList] = await conn.query(`
  SELECT id, name, phone, leadSmsNotify 
  FROM users 
  WHERE role IN ('staff','admin') 
    AND phone IS NOT NULL 
    AND phone != '' 
    AND leadSmsNotify = 1
`) as any[];
await conn.end();

console.log(`Found ${staffList.length} staff to notify`);

const message = `🥋 New Lead: Test-Vincent | Phone: 2818189288 | Source: website\nLog in to MyDojo admin to follow up.`;

for (const staff of staffList) {
  try {
    const result = await sendSms({ to: staff.phone, body: message });
    console.log(`✅ Sent to ${staff.name} (${staff.phone}):`, result?.status ?? result);
  } catch (err: any) {
    console.error(`❌ Failed for ${staff.name} (${staff.phone}):`, err.message);
  }
}
