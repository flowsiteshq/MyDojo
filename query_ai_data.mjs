import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Membership packages
console.log('\n=== MEMBERSHIP PACKAGES ===');
const [packages] = await conn.execute('SELECT name, monthlyPrice, durationMonths, registrationFee, enrollmentFee, description, benefits FROM membershipPackages WHERE isActive=1 ORDER BY monthlyPrice');
packages.forEach(p => console.log(`  ${p.name}: $${p.monthlyPrice}/mo, ${p.durationMonths}mo contract, enroll fee: $${p.enrollmentFee} | ${p.description}`));

// Admin config
console.log('\n=== ADMIN CONFIG ===');
const [cfg] = await conn.execute('SELECT `key`, `value` FROM adminConfig LIMIT 50');
cfg.forEach(c => console.log(`  ${c.key}: ${String(c.value).substring(0,150)}`));

await conn.end();
