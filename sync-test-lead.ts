import { submitLeadToDojoFlow } from "./server/dojoFlowClient";

const testLead = {
  name: "Manus Test Lead",
  email: "manus-dojoflow-test@example.com",
  phone: "281-555-1234",
  program: "Dragon Kids",
  location: "Tomball HQ",
  preferredContactMethod: "email" as const,
  message: "Testing Dojo Flow sync from Manus"
};

console.log('📤 Syncing test lead to Dojo Flow...');
console.log('Lead data:', testLead);
console.log('');

submitLeadToDojoFlow(testLead)
  .then((result) => {
    console.log('✅ SUCCESS! Lead synced to Dojo Flow');
    console.log('Result:', result);
    console.log('');
    console.log('🔍 Check your Dojo Flow dashboard to verify the lead appears');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ ERROR syncing to Dojo Flow:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
