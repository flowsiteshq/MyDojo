import { config } from 'dotenv';
config();

console.log("DOJO_FLOW_URL:", process.env.DOJO_FLOW_URL);
console.log("DOJO_FLOW_EMAIL:", process.env.DOJO_FLOW_EMAIL ? "[SET]" : "[NOT SET]");
console.log("DOJO_FLOW_PASSWORD:", process.env.DOJO_FLOW_PASSWORD ? "[SET]" : "[NOT SET]");

const endpoint = `${process.env.DOJO_FLOW_URL}/api/public/submit-lead`;
console.log("\nFull endpoint:", endpoint);
