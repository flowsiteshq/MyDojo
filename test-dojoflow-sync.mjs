import { submitLeadToDojoFlow } from "./server/dojoFlowClient.js";
import { createTrialSignup } from "./server/db.js";

const testLead = {
  name: "Test Lead Manus",
  email: "manus-test-lead@example.com",
  phone: "2815559999",
  program: "Dragon Kids",
  location: "Tomball HQ",
  preferredContactMethod: "email",
  message: "Testing Dojo Flow sync - please ignore",
  status: "new",
  source: "chatbot"
};

console.log('📝 Creating test lead in database...');
console.log('Lead data:', JSON.stringify(testLead, null, 2));

try {
  // Save to database
  await createTrialSignup(testLead);
  console.log('\n✅ Lead saved to database');
  
  // Sync to Dojo Flow
  console.log('\n📤 Syncing to Dojo Flow...');
  await submitLeadToDojoFlow(testLead);
  console.log('✅ Lead successfully synced to Dojo Flow!');
  console.log('\n🔍 Check your Dojo Flow dashboard to verify the lead appears');
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('Stack:', error.stack);
}
