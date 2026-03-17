import Stripe from "stripe";
import dotenv from "dotenv";
import { getDb } from "./server/db.js";
import * as schema from "./drizzle/schema.js";

// Load environment variables
dotenv.config();

const liveKey = process.env.STRIPE_LIVE_SECRET_KEY;

if (!liveKey || !liveKey.startsWith("sk_live_")) {
  console.error("❌ STRIPE_LIVE_SECRET_KEY not found or invalid");
  process.exit(1);
}

const stripe = new Stripe(liveKey, {
  apiVersion: "2026-01-28.clover",
});

async function addSetupFee() {
  console.log("🚀 Adding $99 setup fee to existing LIVE Stripe products...\n");

  const db = await getDb();
  
  // Get all membership packages from database
  const packages = await db.select().from(schema.membershipPackages);

  for (const pkg of packages) {
    if (!pkg.stripePriceId) {
      console.log(`⚠️  Skipping ${pkg.name} - no Stripe price ID found`);
      continue;
    }

    console.log(`Processing ${pkg.name} (${pkg.stripePriceId})...`);

    // Get the price to find the product ID
    const price = await stripe.prices.retrieve(pkg.stripePriceId);
    const productId = price.product;

    console.log(`  Product ID: ${productId}`);

    // Create a new price with the same monthly amount
    // (We'll add the setup fee in the checkout session creation)
    console.log(`  ✅ Price already exists: ${pkg.stripePriceId}`);
    console.log(`  Note: $99 setup fee will be added during checkout session creation\n`);
  }

  console.log("🎉 Setup complete!");
  console.log("\nNext step: Update checkout session creation to include $99 setup fee");
  console.log("The setup fee will be added as a one-time line item during checkout.\n");

  process.exit(0);
}

addSetupFee().catch((error) => {
  console.error("❌ Error:");
  console.error(error);
  process.exit(1);
});
