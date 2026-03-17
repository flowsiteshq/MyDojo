import Stripe from "stripe";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

async function testStripeCheckout() {
  console.log("[Test] Starting Stripe checkout test...");
  
  // Initialize database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });
  
  // Fetch membership package
  const selectedPlanId = 1;
  console.log("[Test] Fetching membership package with ID:", selectedPlanId);
  
  const [membershipPackage] = await db.select().from(schema.membershipPackages).where(eq(schema.membershipPackages.id, selectedPlanId));
  console.log("[Test] Membership package:", membershipPackage);
  
  if (!membershipPackage || !membershipPackage.stripePriceId) {
    console.error("[Test] Membership package not found or missing Stripe price ID");
    process.exit(1);
  }
  
  // Initialize Stripe
  console.log("[Test] Initializing Stripe client...");
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" });
  
  // Create checkout session
  console.log("[Test] Creating Stripe checkout session...");
  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: membershipPackage.stripePriceId,
          quantity: 1,
        },
      ],
      client_reference_id: "test-session-123",
      metadata: {
        sessionId: "test-session-123",
        packageId: membershipPackage.id.toString(),
        packageName: membershipPackage.name,
        customerName: "Test User",
        customerPhone: "1234567890",
        customerEmail: "test@example.com",
      },
      customer_email: "test@example.com",
      success_url: "https://mydojo-fitness-lu5er8yq.manus.space/enrollment/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://mydojo-fitness-lu5er8yq.manus.space/enrollment/cancel",
    });
    
    console.log("[Test] ✅ Stripe checkout session created successfully!");
    console.log("[Test] Checkout URL:", session.url);
    console.log("[Test] Session ID:", session.id);
  } catch (error) {
    console.error("[Test] ❌ Failed to create Stripe checkout session:");
    console.error(error);
  }
  
  await connection.end();
}

testStripeCheckout();
