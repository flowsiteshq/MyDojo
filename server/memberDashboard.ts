import { getDb } from "./db";
import { enrollments, membershipPackages, classSchedule } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

/**
 * Get member's active enrollment with membership package details
 */
export async function getMemberEnrollment(customerEmail: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  const results = await db
    .select({
      enrollment: enrollments,
      package: membershipPackages,
    })
    .from(enrollments)
    .leftJoin(membershipPackages, eq(enrollments.membershipPackageId, membershipPackages.id))
    .where(
      and(
        eq(enrollments.customerEmail, customerEmail),
        eq(enrollments.status, "active")
      )
    )
    .orderBy(desc(enrollments.createdAt))
    .limit(1);

  return results[0] || null;
}

/**
 * Get member's class schedules based on their membership package
 */
export async function getMemberClassSchedules(packageName: string, location: string = "Tomball HQ") {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  // Map package names to programs
  const programMapping: Record<string, string[]> = {
    "Foundation": ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate"],
    "Black Belt": ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing"],
    "Leadership": ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing"],
  };

  const programs = programMapping[packageName] || [];
  
  if (programs.length === 0) {
    return [];
  }

  const schedules = await db
    .select()
    .from(classSchedule)
    .where(eq(classSchedule.location, location));

  // Filter by programs available in the package
  return schedules.filter(schedule => programs.includes(schedule.program));
}

/**
 * Get member's payment history from Stripe
 */
export async function getMemberPaymentHistory(stripeCustomerId: string) {
  try {
    // Fetch payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    // Fetch invoices for subscription payments
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10,
    });

    // Combine and format payment history
    const payments = [
      ...paymentIntents.data.map(pi => ({
        id: pi.id,
        type: "payment" as const,
        amount: pi.amount / 100, // Convert cents to dollars
        currency: pi.currency.toUpperCase(),
        status: pi.status,
        description: pi.description || "Down Payment",
        created: new Date(pi.created * 1000),
      })),
      ...invoices.data.map(inv => ({
        id: inv.id,
        type: "invoice" as const,
        amount: (inv.amount_paid || 0) / 100,
        currency: (inv.currency || "usd").toUpperCase(),
        status: inv.status || "unknown",
        description: inv.description || "Monthly Membership",
        created: new Date(inv.created * 1000),
        invoiceUrl: inv.hosted_invoice_url,
      })),
    ];

    // Sort by date descending
    payments.sort((a, b) => b.created.getTime() - a.created.getTime());

    return payments;
  } catch (error) {
    console.error("[Member Dashboard] Error fetching payment history:", error);
    return [];
  }
}

/**
 * Get member's subscription details from Stripe
 */
export async function getMemberSubscription(stripeSubscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    };
  } catch (error) {
    console.error("[Member Dashboard] Error fetching subscription:", error);
    return null;
  }
}
