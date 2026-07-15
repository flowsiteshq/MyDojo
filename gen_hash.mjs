import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('MyDojo2026', 10);
console.log(hash);
