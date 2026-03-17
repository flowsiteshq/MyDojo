import { submitLeadToDojoFlow } from './server/dojoFlowClient.ts';

const testLead = {
  name: "Sarah Johnson",
  email: "sarah.johnson.test@example.com",
  phone: "(555) 123-4567",
  program: "Little Ninjas",
  location: "Tomball HQ",
  preferredContactMethod: "email",
  message: "My 4-year-old daughter is interested in martial arts. Looking for a trial class!"
};

console.log("Submitting test lead to Dojo Flow...");
console.log("Lead details:", testLead);
console.log("");

try {
  const result = await submitLeadToDojoFlow(testLead);
  console.log("✅ SUCCESS! Lead submitted to Dojo Flow");
  console.log("Result:", result);
  console.log("");
  console.log("Check your Dojo Flow dashboard - you should see a new lead:");
  console.log("- Name: Sarah Johnson");
  console.log("- Email: sarah.johnson.test@example.com");
  console.log("- Phone: (555) 123-4567");
  console.log("- Program: Little Ninjas");
  console.log("- Status: New Lead");
  console.log("- Source: MyDojo Website Chatbot");
} catch (error) {
  console.error("❌ ERROR submitting lead:", error.message);
  process.exit(1);
}
