/**
 * MyDojo Billing Cycle Rule (Permanent)
 * ──────────────────────────────────────
 * Tuition is collected on the 1st and the 15th of each month.
 *
 * Rule:
 *   - Enrollment date falls on the 1st–14th  → next bill date = the 1st of the NEXT month
 *   - Enrollment date falls on the 15th–31st → next bill date = the 15th of the NEXT month
 *
 * The "billing anchor day" (1 or 15) is what FluidPay and Stripe use as
 * `billing_days` / `billing_cycle_anchor` for recurring subscriptions.
 */

/**
 * Returns the billing anchor day (1 or 15) based on the enrollment date.
 * Day 1–14  → anchor = 1
 * Day 15–31 → anchor = 15
 */
export function getBillingAnchorDay(enrollmentDate: Date = new Date()): 1 | 15 {
  return enrollmentDate.getDate() <= 14 ? 1 : 15;
}

/**
 * Returns the next billing date (as a Date object) based on the enrollment date.
 * Always returns a future date — the next occurrence of the anchor day.
 *
 * Examples (enrollment today = July 10):
 *   anchor = 1  → next bill = August 1
 * Examples (enrollment today = July 20):
 *   anchor = 15 → next bill = August 15
 */
export function getNextBillingDate(enrollmentDate: Date = new Date()): Date {
  const anchor = getBillingAnchorDay(enrollmentDate);
  const next = new Date(enrollmentDate);

  // Always move to the next month
  next.setMonth(next.getMonth() + 1);
  next.setDate(anchor);
  next.setHours(0, 0, 0, 0);

  return next;
}

/**
 * Returns the next billing date as a YYYY-MM-DD string.
 * This is the format used by FluidPay's `next_bill_date` and `start` fields,
 * and by Stripe's `billing_cycle_anchor` (after Unix timestamp conversion).
 */
export function getNextBillingDateStr(enrollmentDate: Date = new Date()): string {
  const d = getNextBillingDate(enrollmentDate);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the billing anchor day as a string (for FluidPay `billing_days` field).
 */
export function getBillingAnchorDayStr(enrollmentDate: Date = new Date()): string {
  return String(getBillingAnchorDay(enrollmentDate));
}

/**
 * Returns the next billing date as a Unix timestamp (seconds).
 * Used by Stripe's `billing_cycle_anchor` parameter.
 */
export function getNextBillingTimestamp(enrollmentDate: Date = new Date()): number {
  return Math.floor(getNextBillingDate(enrollmentDate).getTime() / 1000);
}

/**
 * Human-readable description of the billing cycle for display in the UI.
 * Example: "Your tuition will be billed on the 1st of each month, starting August 1, 2026."
 */
export function getBillingCycleDescription(enrollmentDate: Date = new Date()): string {
  const anchor = getBillingAnchorDay(enrollmentDate);
  const nextDate = getNextBillingDate(enrollmentDate);
  const formatted = nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const suffix = anchor === 1 ? 'st' : 'th';
  return `Your tuition will be billed on the ${anchor}${suffix} of each month, starting ${formatted}.`;
}
