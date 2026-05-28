import { getDb } from "./db";
import { enrollments, membershipPackages, classSchedule } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const FLUIDPAY_API_URL = "https://app.fluidpay.com";
const FLUIDPAY_SECRET_KEY = process.env.FLUIDPAY_SECRET_KEY;

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
  type: "payment" | "invoice" | "fluidpay" | "fluidpay_upcoming";
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: Date;
  invoiceUrl?: string | null;
};

/**
 * Query FluidPay API for all transactions for a given customer vault ID.
 * Returns both past charges and upcoming scheduled subscription payments.
 */
async function getFluidPayTransactions(fpCustomerId: string): Promise<PaymentHistoryItem[]> {
  if (!FLUIDPAY_SECRET_KEY || !fpCustomerId) return [];

  const fpHeaders = {
    Authorization: FLUIDPAY_SECRET_KEY,
    "Content-Type": "application/json",
  };

  const results: PaymentHistoryItem[] = [];

  try {
    // 1. Get all past transactions for this customer
    const txRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction/search`, {
      method: "POST",
      headers: fpHeaders,
      body: JSON.stringify({
        customer_id: { operator: "=", value: fpCustomerId },
        limit: 50,
      }),
    });
    const txData = await txRes.json();

    if (txData.status === "success" && Array.isArray(txData.data)) {
      for (const tx of txData.data) {
        const approvedStatuses = ["approved", "pending_settlement", "settled", "complete", "authorized"];
        if (!approvedStatuses.includes(tx.status)) continue;
        if (!tx.amount || tx.amount <= 0) continue;

        results.push({
          id: `fp-tx-${tx.id}`,
          type: "fluidpay",
          amount: tx.amount / 100,
          currency: "USD",
          status: "paid",
          description: tx.description || "Membership Payment",
          created: new Date(tx.created_at),
        });
      }
    }

    // 2. Get all subscriptions for this customer to show upcoming charges
    const subRes = await fetch(`${FLUIDPAY_API_URL}/api/recurring/subscription/search`, {
      method: "POST",
      headers: fpHeaders,
      body: JSON.stringify({
        customer_id: { operator: "=", value: fpCustomerId },
      }),
    });
    const subData = await subRes.json();

    if (subData.status === "success" && Array.isArray(subData.data)) {
      for (const sub of subData.data) {
        if (sub.status !== "active") continue;
        if (!sub.next_bill_date) continue;
        if (!sub.amount || sub.amount <= 0) continue;

        const nextBillDate = new Date(sub.next_bill_date);
        // Only show upcoming if it's in the future
        if (nextBillDate > new Date()) {
          results.push({
            id: `fp-upcoming-${sub.id}`,
            type: "fluidpay_upcoming",
            amount: sub.amount / 100,
            currency: "USD",
            status: "upcoming",
            description: sub.description || "Monthly Membership",
            created: nextBillDate,
          });
        }
      }
    }
  } catch (err) {
    console.error("[Member Dashboard] Error fetching FluidPay transactions:", err);
  }

  return results;
}

/**
 * Get member's full payment history.
 * Primary source: FluidPay API (direct query by customer vault ID).
 * Fallback: Stripe payment intents + invoices (for legacy students).
 */
export async function getMemberPaymentHistory(
  customerEmail: string,
  stripeCustomerId?: string | null
): Promise<PaymentHistoryItem[]> {
  const payments: PaymentHistoryItem[] = [];

  // ── 1. FluidPay (direct API query by customer vault ID) ───────────────────
  try {
    const db = await getDb();
    if (db) {
      // Find all enrollments for this customer to get their FluidPay customer IDs
      const memberEnrollments = await db
        .select({
          id: enrollments.id,
          fluidpayCustomerId: enrollments.fluidpayCustomerId,
          downPaymentAmount: enrollments.downPaymentAmount,
          createdAt: enrollments.createdAt,
        })
        .from(enrollments)
        .where(eq(enrollments.customerEmail, customerEmail))
        .orderBy(desc(enrollments.createdAt));

      // Collect unique FluidPay customer IDs
      const fpCustomerIds = Array.from(new Set(
        memberEnrollments
          .map(e => e.fluidpayCustomerId)
          .filter((id): id is string => !!id && id !== "NULL")
      ));

      // Query FluidPay API for each customer vault
      for (const fpCustomerId of fpCustomerIds) {
        const fpPayments = await getFluidPayTransactions(fpCustomerId);
        payments.push(...fpPayments);
      }

      // If no FluidPay customer IDs, fall back to showing the down payment from DB
      if (fpCustomerIds.length === 0) {
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

  // Sort: upcoming first, then paid by date descending; deduplicate
  const seen = new Set<string>();
  return payments
    .sort((a, b) => {
      // Upcoming payments always appear at the top
      if (a.status === "upcoming" && b.status !== "upcoming") return -1;
      if (b.status === "upcoming" && a.status !== "upcoming") return 1;
      return b.created.getTime() - a.created.getTime();
    })
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
