import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  'SELECT program, dayOfWeek, startTime, endTime, instructor FROM classSchedule WHERE isActive=1 ORDER BY program, FIELD(dayOfWeek,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"), startTime'
);

const grouped = {};
for (const r of rows) {
  if (!grouped[r.program]) grouped[r.program] = [];
  grouped[r.program].push(`${r.dayOfWeek} ${r.startTime}-${r.endTime} (${r.instructor})`);
}

for (const [prog, classes] of Object.entries(grouped)) {
  console.log(`\n=== ${prog} ===`);
  classes.forEach(c => console.log(`  ${c}`));
}

await conn.end();
