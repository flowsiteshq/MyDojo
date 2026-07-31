/**
 * Billing Health Check Job
 *
 * Endpoint: POST /api/scheduled/billingHealthCheck
 *
 * Runs daily at 9 AM CDT (14:00 UTC) via Heartbeat cron.
 * Scans all active enrollments and flags:
 *   1. Active enrollments with no FluidPay subscription ID and no Stripe subscription ID
 *   2. Active enrollments whose FluidPay subscription is paused/cancelled/failed
 *   3. Open paymentFailures older than 3 days with no retry
 *
 * Sends a single owner notification summarizing all issues found.
 */
import type { Request, Response } from "express";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, isNull, or, lt } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const FLUIDPAY_API_URL = "https://app.fluidpay.com";

export async function handleBillingHealthCheck(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // ── 1. Fetch all active enrollments ──────────────────────────────────────
    const activeEnrollments = await db
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.status, "active"));

    const FLUIDPAY_KEY = process.env.FLUIDPAY_SECRET_KEY || "";
    const issues: string[] = [];

    // ── 2. Check each enrollment for missing/broken subscription ─────────────
    const missingSubscription: typeof activeEnrollments = [];
    const brokenSubscription: Array<{ enrollment: typeof activeEnrollments[0]; subStatus: string }> = [];

    // Batch-check FluidPay subscriptions (only those that have a sub ID)
    const enrollmentsWithSub = activeEnrollments.filter(
      (e) => e.fluidpaySubscriptionId && !e.stripeSubscriptionId
    );
    const enrollmentsMissingSub = activeEnrollments.filter(
      (e) =>
        !e.fluidpaySubscriptionId &&
        !e.stripeSubscriptionId &&
        e.membershipPackageId !== 0 // exclude summer camp (packageId=0)
    );

    missingSubscription.push(...enrollmentsMissingSub);

    // Check FluidPay subscription statuses in parallel (max 10 at a time)
    const chunkSize = 10;
    for (let i = 0; i < enrollmentsWithSub.length; i += chunkSize) {
      const chunk = enrollmentsWithSub.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (enrollment) => {
          try {
            const res2 = await fetch(
              `${FLUIDPAY_API_URL}/api/recurring/subscription/${enrollment.fluidpaySubscriptionId}`,
              { headers: { Authorization: FLUIDPAY_KEY } }
            );
            const data = await res2.json() as any;
            const subStatus = data?.data?.status || "unknown";
            if (
              subStatus === "cancelled" ||
              subStatus === "failed" ||
              subStatus === "suspended" ||
              subStatus === "inactive"
            ) {
              brokenSubscription.push({ enrollment, subStatus });
            }
          } catch {
            // FluidPay unreachable — skip this one
          }
        })
      );
    }

    // ── 3. Check for open payment failures older than 3 days ─────────────────
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const openFailures = await db
      .select()
      .from(schema.paymentFailures)
      .where(
        and(
          eq(schema.paymentFailures.status, "open"),
          lt(schema.paymentFailures.createdAt, threeDaysAgo)
        )
      );

    // ── 4. Build notification message ─────────────────────────────────────────
    if (missingSubscription.length > 0) {
      const names = missingSubscription
        .map((e) => `• ${e.studentName || e.customerName} (ID: ${e.id})`)
        .join("\n");
      issues.push(`🚨 ${missingSubscription.length} active member(s) have NO recurring subscription:\n${names}`);
    }

    if (brokenSubscription.length > 0) {
      const names = brokenSubscription
        .map((b) => `• ${b.enrollment.studentName || b.enrollment.customerName} — sub status: ${b.subStatus}`)
        .join("\n");
      issues.push(`⚠️ ${brokenSubscription.length} member(s) have a broken FluidPay subscription:\n${names}`);
    }

    if (openFailures.length > 0) {
      // Look up enrollment names for the failures
      const failureEnrollmentIds = Array.from(new Set(openFailures.map((f) => f.enrollmentId)));
      const failureEnrollments = await db
        .select()
        .from(schema.enrollments)
        .where(
          failureEnrollmentIds.length > 0
            // @ts-ignore — Drizzle inArray
            ? (schema.enrollments.id as any).in(failureEnrollmentIds)
            : eq(schema.enrollments.id, -1)
        );
      const nameMap = new Map(failureEnrollments.map((e) => [e.id, e.studentName || e.customerName]));
      const failureLines = openFailures
        .map((f) => {
          const name = nameMap.get(f.enrollmentId) || `Enrollment #${f.enrollmentId}`;
          const amt = f.amountCents ? `$${(f.amountCents / 100).toFixed(2)}` : "unknown amount";
          const age = Math.floor((Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return `• ${name} — ${amt} failed ${age} day(s) ago (${f.failureReason || "declined"})`;
        })
        .join("\n");
      issues.push(`💳 ${openFailures.length} unresolved payment failure(s) older than 3 days:\n${failureLines}`);
    }

    // ── 5. Send notification or log all-clear ─────────────────────────────────
    const totalIssues =
      missingSubscription.length + brokenSubscription.length + openFailures.length;

    if (totalIssues > 0) {
      const content =
        `Daily Billing Health Check found ${totalIssues} issue(s) requiring attention:\n\n` +
        issues.join("\n\n") +
        `\n\nVisit /admin/billing-schedule to review and take action.`;

      await notifyOwner({
        title: `⚠️ Billing Alert: ${totalIssues} Issue(s) Found`,
        content,
      });

      console.log(
        `[BillingHealthCheck] Found ${totalIssues} issue(s): ` +
          `${missingSubscription.length} missing sub, ` +
          `${brokenSubscription.length} broken sub, ` +
          `${openFailures.length} open failures`
      );
    } else {
      console.log("[BillingHealthCheck] All clear — no billing issues found.");
    }

    return res.json({
      ok: true,
      issuesFound: totalIssues,
      missingSub: missingSubscription.length,
      brokenSub: brokenSubscription.length,
      openFailures: openFailures.length,
    });
  } catch (err) {
    console.error("[BillingHealthCheck] Error:", err);
    return res.status(500).json({
      error: String(err),
      timestamp: new Date().toISOString(),
    });
  }
}
