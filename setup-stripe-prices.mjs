import Stripe from "stripe";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

async function setupStripePrices() {
  console.log("[Setup] Starting Stripe price setup...");
  
  // Initialize Stripe
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" });
  
  // Initialize database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });
  
  // Fetch membership packages
  const packages = await db.select().from(schema.membershipPackages);
  console.log(`[Setup] Found ${packages.length} membership packages`);
  
  for (const pkg of packages) {
    console.log(`\n[Setup] Processing: ${pkg.name}`);
    
    // Create or retrieve product
    let productId = pkg.stripeProductId;
    if (!productId) {
      console.log(`[Setup] Creating Stripe product for ${pkg.name}...`);
      const product = await stripeClient.products.create({
        name: `${pkg.name} Membership`,
        description: pkg.description,
        metadata: {
          packageId: pkg.id.toString(),
          packageName: pkg.name,
        },
      });
      productId = product.id;
      console.log(`[Setup] ✅ Product created: ${productId}`);
      
      // Update database with product ID
      await db.update(schema.membershipPackages)
        .set({ stripeProductId: productId })
        .where(eq(schema.membershipPackages.id, pkg.id));
    } else {
      console.log(`[Setup] Product already exists: ${productId}`);
    }
    
    // Create price
    console.log(`[Setup] Creating Stripe price for ${pkg.name}...`);
    const price = await stripeClient.prices.create({
      product: productId,
      unit_amount: Math.round(parseFloat(pkg.monthlyPrice) * 100), // Convert to cents
      currency: "usd",
      recurring: {
        interval: "month",
        interval_count: 1,
      },
      metadata: {
        packageId: pkg.id.toString(),
        packageName: pkg.name,
        durationMonths: pkg.durationMonths.toString(),
      },
    });
    console.log(`[Setup] ✅ Price created: ${price.id}`);
    
    // Update database with price ID
    await db.update(schema.membershipPackages)
      .set({ stripePriceId: price.id })
      .where(eq(schema.membershipPackages.id, pkg.id));
    console.log(`[Setup] ✅ Database updated with price ID`);
  }
  
  console.log("\n[Setup] ✅ All Stripe prices set up successfully!");
  await connection.end();
}

setupStripePrices().catch(console.error);
