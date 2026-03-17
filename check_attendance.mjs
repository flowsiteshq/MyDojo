import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [cols] = await conn.execute('DESCRIBE attendance');
console.log('=== COLUMNS ===');
cols.forEach(c => console.log(c.Field, c.Type, c.Null));

const [rows] = await conn.execute('SELECT * FROM attendance ORDER BY id DESC LIMIT 10');
console.log('\n=== SAMPLE DATA ===');
console.log(JSON.stringify(rows, null, 2));

await conn.end();
