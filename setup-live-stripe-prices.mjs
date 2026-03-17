import Stripe from "stripe";
import dotenv from "dotenv";
import { getDb } from "./server/db.js";
import * as schema from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

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

const membershipPlans = [
  {
    id: 1,
    name: "Foundation",
    monthlyPrice: 149.00,
    description: "Month-to-month program for beginners",
  },
  {
    id: 2,
    name: "Black Belt",
    monthlyPrice: 199.00,
    description: "Month-to-month comprehensive program",
  },
  {
    id: 3,
    name: "Leadership",
    monthlyPrice: 249.00,
    description: "Month-to-month elite program (invitation only)",
  },
];

async function setupLiveProducts() {
  console.log("🚀 Setting up LIVE Stripe products and prices...\n");

  const db = await getDb();
  const results = [];

  for (const plan of membershipPlans) {
    console.log(`Creating product: ${plan.name}...`);

    // Create product
    const product = await stripe.products.create({
      name: `${plan.name} Membership`,
      description: plan.description,
      metadata: {
        plan_id: plan.id.toString(),
        plan_name: plan.name,
      },
    });

    console.log(`✅ Product created: ${product.id}`);

    // Create recurring price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(plan.monthlyPrice * 100), // Convert to cents
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan_id: plan.id.toString(),
        plan_name: plan.name,
      },
    });

    console.log(`✅ Price created: ${price.id}`);

    // Update database with live price ID
    await db
      .update(schema.membershipPackages)
      .set({ stripePriceId: price.id })
      .where(eq(schema.membershipPackages.id, plan.id));

    console.log(`✅ Database updated for ${plan.name}\n`);

    results.push({
      planId: plan.id,
      planName: plan.name,
      productId: product.id,
      priceId: price.id,
    });
  }

  console.log("🎉 All LIVE products and prices created successfully!\n");
  console.log("Summary:");
  results.forEach((r) => {
    console.log(`  ${r.planName}: ${r.productId} → ${r.priceId}`);
  });

  process.exit(0);
}

setupLiveProducts().catch((error) => {
  console.error("❌ Error setting up live products:");
  console.error(error);
  process.exit(1);
});
