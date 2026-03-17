import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const liveKey = process.env.STRIPE_LIVE_SECRET_KEY;

if (!liveKey) {
  console.error("❌ STRIPE_LIVE_SECRET_KEY not found in environment");
  process.exit(1);
}

if (!liveKey.startsWith("sk_live_")) {
  console.error(`❌ Invalid live key format. Expected sk_live_*, got ${liveKey.substring(0, 10)}...`);
  process.exit(1);
}

console.log(`✅ Live Stripe key found: ${liveKey.substring(0, 15)}...`);

// Test the key by retrieving account info
try {
  const stripe = new Stripe(liveKey, {
    apiVersion: "2026-01-28.clover",
  });

  const account = await stripe.accounts.retrieve();
  console.log(`✅ Stripe account verified: ${account.id}`);
  console.log(`   Business name: ${account.business_profile?.name || "N/A"}`);
  console.log(`   Country: ${account.country}`);
  console.log(`   Charges enabled: ${account.charges_enabled}`);
  console.log(`   Payouts enabled: ${account.payouts_enabled}`);
  
  if (!account.charges_enabled) {
    console.warn("⚠️  WARNING: Charges are not enabled on this account. You may need to complete verification.");
  }
  
  process.exit(0);
} catch (error) {
  console.error("❌ Failed to validate Stripe key:");
  console.error(error.message);
  process.exit(1);
}
