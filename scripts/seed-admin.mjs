/**
 * One-time admin seed script — run via: node scripts/seed-admin.mjs
 * Creates or updates the admin account with a bcrypt-hashed password.
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const ADMIN_EMAIL = 'vincent.holmes00@gmail.com';
const ADMIN_PASSWORD = 'Kankudai1979#';
const ADMIN_NAME = 'Vincent Holmes';

const conn = await mysql.createConnection(DATABASE_URL);

try {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Check if user exists
  const [rows] = await conn.execute(
    'SELECT id FROM users WHERE email = ?',
    [ADMIN_EMAIL]
  );

  if (rows.length > 0) {
    // Update existing user
    await conn.execute(
      'UPDATE users SET passwordHash = ?, role = ?, name = ? WHERE email = ?',
      [hash, 'admin', ADMIN_NAME, ADMIN_EMAIL]
    );
    console.log(`✅ Updated admin account for ${ADMIN_EMAIL}`);
  } else {
    // Create new admin user
    await conn.execute(
      'INSERT INTO users (name, email, passwordHash, role, loginMethod, emailVerified, leadSmsNotify, enrollSmsNotify, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
      [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin', 'email', 1, 1, 1]
    );
    console.log(`✅ Created admin account for ${ADMIN_EMAIL}`);
  }
} catch (err) {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
} finally {
  await conn.end();
}
