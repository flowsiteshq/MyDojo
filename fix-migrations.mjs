import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get existing hashes
const [existing] = await conn.execute('SELECT hash FROM __drizzle_migrations');
const existingHashes = new Set(existing.map(r => r.hash));

// Read journal
const journal = JSON.parse(fs.readFileSync(path.join(__dirname, 'drizzle/meta/_journal.json'), 'utf8'));

let inserted = 0;
for (const entry of journal.entries) {
  const sqlFile = path.join(__dirname, 'drizzle', entry.tag + '.sql');
  if (!fs.existsSync(sqlFile)) continue;
  
  const content = fs.readFileSync(sqlFile);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  
  if (!existingHashes.has(hash)) {
    await conn.execute('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [hash, entry.when]);
    console.log('Inserted migration:', entry.tag, hash.substring(0, 16));
    inserted++;
  } else {
    console.log('Already exists:', entry.tag);
  }
}
console.log('Total inserted:', inserted);
await conn.end();
