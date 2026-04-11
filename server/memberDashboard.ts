import { getDb } from "./db";
import { enrollments, membershipPackages, classSchedule, webhookEvents } from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
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

export type PaymentHistoryItem = {
  id: string;
  type: "payment" | "invoice" | "fluidpay";
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: Date;
  invoiceUrl?: string | null;
};

/**
 * Get member's full payment history.
 * Primary source: FluidPay webhook events (for most students).
 * Fallback: Stripe payment intents + invoices (for legacy students).
 */
export async function getMemberPaymentHistory(
  customerEmail: string,
  stripeCustomerId?: string | null
): Promise<PaymentHistoryItem[]> {
  const payments: PaymentHistoryItem[] = [];

  // ── 1. FluidPay webhook events ────────────────────────────────────────────
  try {
    const db = await getDb();
    if (db) {
      // Find all enrollments for this customer to get their FluidPay subscription IDs
      const memberEnrollments = await db
        .select({
          id: enrollments.id,
          fluidpaySubscriptionId: enrollments.fluidpaySubscriptionId,
          fluidpayCustomerId: enrollments.fluidpayCustomerId,
          downPaymentAmount: enrollments.downPaymentAmount,
          createdAt: enrollments.createdAt,
        })
        .from(enrollments)
        .where(eq(enrollments.customerEmail, customerEmail))
        .orderBy(desc(enrollments.createdAt));

      const fpSubIds = memberEnrollments
        .map(e => e.fluidpaySubscriptionId)
        .filter((id): id is string => !!id);

      if (fpSubIds.length > 0) {
        // Pull all approved webhook events for these subscriptions
        const events = await db
          .select()
          .from(webhookEvents)
          .where(
            and(
              inArray(webhookEvents.fpSubscriptionId, fpSubIds),
              inArray(webhookEvents.eventStatus, ["approved", "complete", "success", "settled"])
            )
          )
          .orderBy(desc(webhookEvents.createdAt))
          .limit(60);

        for (const evt of events) {
          if (!evt.amountCents || evt.amountCents <= 0) continue;
          payments.push({
            id: `fp-${evt.id}`,
            type: "fluidpay",
            amount: evt.amountCents / 100,
            currency: "USD",
            status: "paid",
            description: "Monthly Membership",
            created: evt.createdAt,
          });
        }
      }

      // Add the down payment from each enrollment record (initial charge)
      for (const enr of memberEnrollments) {
        const amt = parseFloat((enr.downPaymentAmount as string) ?? "0");
        if (amt > 0) {
          payments.push({
            id: `fp-down-${enr.id}`,
            type: "fluidpay",
            amount: amt,
            currency: "USD",
            status: "paid",
            description: "Enrollment / Down Payment",
            created: enr.createdAt ?? new Date(),
          });
        }
      }
    }
  } catch (err) {
    console.error("[Member Dashboard] Error fetching FluidPay payment history:", err);
  }

  // ── 2. Stripe (legacy / fallback) ────────────────────────────────────────
  if (stripeCustomerId) {
    try {
      const [piList, invList] = await Promise.all([
        stripe.paymentIntents.list({ customer: stripeCustomerId, limit: 20 }),
        stripe.invoices.list({ customer: stripeCustomerId, limit: 20 }),
      ]);

      payments.push(
        ...piList.data
          .filter(pi => pi.status === "succeeded")
          .map(pi => ({
            id: pi.id,
            type: "payment" as const,
            amount: pi.amount / 100,
            currency: pi.currency.toUpperCase(),
            status: "paid",
            description: pi.description || "Down Payment",
            created: new Date(pi.created * 1000),
          })),
        ...invList.data
          .filter(inv => inv.status === "paid")
          .map(inv => ({
            id: inv.id,
            type: "invoice" as const,
            amount: (inv.amount_paid || 0) / 100,
            currency: (inv.currency || "usd").toUpperCase(),
            status: "paid",
            description: inv.description || "Monthly Membership",
            created: new Date(inv.created * 1000),
            invoiceUrl: inv.hosted_invoice_url,
          }))
      );
    } catch (error) {
      console.error("[Member Dashboard] Error fetching Stripe payment history:", error);
    }
  }

  // Sort by date descending and deduplicate
  const seen = new Set<string>();
  return payments
    .sort((a, b) => b.created.getTime() - a.created.getTime())
    .filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
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
