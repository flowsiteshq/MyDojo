import { getDb } from "./db";
import { membershipChangeRequests, enrollments, users } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

/**
 * Get all pending membership change requests (admin view)
 */
export async function getPendingChangeRequests() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const requests = await db
    .select({
      id: membershipChangeRequests.id,
      enrollmentId: membershipChangeRequests.enrollmentId,
      userId: membershipChangeRequests.userId,
      requestType: membershipChangeRequests.requestType,
      reason: membershipChangeRequests.reason,
      status: membershipChangeRequests.status,
      effectiveDate: membershipChangeRequests.effectiveDate,
      createdAt: membershipChangeRequests.createdAt,
      // Join with users to get member name
      memberName: users.name,
      memberEmail: users.email,
      // Join with enrollments to get membership details
      customerName: enrollments.customerName,
      membershipPackageId: enrollments.membershipPackageId,
    })
    .from(membershipChangeRequests)
    .leftJoin(users, eq(membershipChangeRequests.userId, users.id))
    .leftJoin(enrollments, eq(membershipChangeRequests.enrollmentId, enrollments.id))
    .where(eq(membershipChangeRequests.status, "pending"))
    .orderBy(desc(membershipChangeRequests.createdAt));

  return requests;
}

/**
 * Get all change requests for a specific user
 */
export async function getUserChangeRequests(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const requests = await db
    .select()
    .from(membershipChangeRequests)
    .where(eq(membershipChangeRequests.userId, userId))
    .orderBy(desc(membershipChangeRequests.createdAt));

  return requests;
}

/**
 * Create a new membership change request
 */
export async function createChangeRequest(data: {
  enrollmentId: number;
  userId: number;
  requestType: "pause" | "cancel";
  reason: string;
  effectiveDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [request] = await db
    .insert(membershipChangeRequests)
    .values({
      enrollmentId: data.enrollmentId,
      userId: data.userId,
      requestType: data.requestType,
      reason: data.reason,
      effectiveDate: data.effectiveDate,
      status: "pending",
    })
    .$returningId();

  return request;
}

/**
 * Approve a membership change request
 */
export async function approveChangeRequest(
  requestId: number,
  adminId: number,
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(membershipChangeRequests)
    .set({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminNotes,
    })
    .where(eq(membershipChangeRequests.id, requestId));

  // Get the request details to update enrollment
  const [request] = await db
    .select()
    .from(membershipChangeRequests)
    .where(eq(membershipChangeRequests.id, requestId));

  if (request && request.requestType === "cancel") {
    // Get enrollment details to find Stripe subscription ID
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, request.enrollmentId));

    if (enrollment && enrollment.stripeSubscriptionId) {
      try {
        // Cancel the Stripe subscription
        await stripe.subscriptions.cancel(enrollment.stripeSubscriptionId);
        console.log(`[Stripe] Cancelled subscription ${enrollment.stripeSubscriptionId} for enrollment ${enrollment.id}`);
      } catch (error) {
        console.error(`[Stripe] Failed to cancel subscription ${enrollment.stripeSubscriptionId}:`, error);
        throw new Error("Failed to cancel Stripe subscription");
      }
    }

    // Update enrollment status to cancelled
    await db
      .update(enrollments)
      .set({ 
        status: "cancelled",
        updatedAt: new Date()
      })
      .where(eq(enrollments.id, request.enrollmentId));
  }

  return request;
}

/**
 * Deny a membership change request
 */
export async function denyChangeRequest(
  requestId: number,
  adminId: number,
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(membershipChangeRequests)
    .set({
      status: "denied",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminNotes,
    })
    .where(eq(membershipChangeRequests.id, requestId));

  const [request] = await db
    .select()
    .from(membershipChangeRequests)
    .where(eq(membershipChangeRequests.id, requestId));

  return request;
}
