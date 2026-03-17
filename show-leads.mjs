import { db } from './server/db.ts';
import { trialSignups } from './drizzle/schema.ts';
import { desc } from 'drizzle-orm';

console.log("Fetching recent trial signups from MyDojo database...\n");

const leads = await db.select().from(trialSignups).orderBy(desc(trialSignups.createdAt)).limit(10);

console.log(`Total leads found: ${leads.length}\n`);
console.log("=" .repeat(80));

leads.forEach((lead, index) => {
  console.log(`\n${index + 1}. ${lead.name}`);
  console.log(`   Email: ${lead.email}`);
  console.log(`   Phone: ${lead.phone}`);
  console.log(`   Program: ${lead.program}`);
  console.log(`   Location: ${lead.location}`);
  console.log(`   Status: ${lead.status}`);
  console.log(`   Contact Method: ${lead.preferredContactMethod}`);
  console.log(`   Submitted: ${lead.createdAt}`);
  if (lead.message) {
    console.log(`   Message: ${lead.message}`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("\n⚠️  NOTE: These leads are stored in MyDojo database but have NOT synced to Dojo Flow");
console.log("because the Dojo Flow API endpoint is not responding correctly.\n");

process.exit(0);
