export type BillingProcessor = "stripe" | "fluidpay" | "paypal" | "crm";
export type PaymentState = "authorized" | "pending" | "settled" | "failed" | "refunded" | "disputed";
export type RefundState = "none" | "pending" | "settled" | "failed";
export type ReconciliationClassification =
  | "matched"
  | "duplicate_candidate"
  | "authorized_family_charge"
  | "refund_pending"
  | "disputed"
  | "retry_failure"
  | "unmatched"
  | "no_double_collection";

export interface BillingRecord {
  familyKey: string;
  enrollmentId?: number;
  customerName?: string;
  studentName?: string;
  processor: BillingProcessor;
  transactionId: string;
  periodStart?: string;
  periodEnd?: string;
  amountCents: number;
  currency?: string;
  paymentState: PaymentState;
  refundState?: RefundState;
  discountCode?: string;
  creditCents?: number;
  sourceReference?: string;
}

export interface ReconciliationCase {
  key: string;
  familyKey: string;
  enrollmentIds: number[];
  records: BillingRecord[];
  totalSettledCents: number;
  duplicateOverageCents: number;
  classification: ReconciliationClassification;
  action: "none" | "review_refund" | "review_credit" | "review_retry" | "identity_match";
}

const settled = (record: BillingRecord) =>
  record.paymentState === "settled" && record.refundState !== "settled";

/**
 * Groups source records without calling a processor or changing any data.
 * Same-period records with the same family/enrollment and amount are flagged
 * for review; separate enrollment IDs remain authorized family charges.
 */
export function reconcileBillingRecords(records: BillingRecord[]): ReconciliationCase[] {
  const groups = new Map<string, BillingRecord[]>();
  for (const record of records) {
    if (!Number.isInteger(record.amountCents) || record.amountCents < 0) {
      throw new Error(`Invalid amount for transaction ${record.transactionId}`);
    }
    const period = `${record.periodStart ?? ""}/${record.periodEnd ?? ""}`;
    const key = `${record.familyKey}|${period}`;
    const existing = groups.get(key) ?? [];
    existing.push(record);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([key, group]: [string, BillingRecord[]]) => {
    const enrollmentIds = Array.from(new Set(group.map((record: BillingRecord) => record.enrollmentId).filter((id: number | undefined): id is number => id !== undefined)));
    const settledRecords = group.filter(settled);
    const byEnrollment = new Map<string, BillingRecord[]>();
    for (const record of settledRecords) {
      const enrollmentKey = `${record.enrollmentId ?? "unknown"}|${record.amountCents}|${record.periodStart ?? ""}|${record.periodEnd ?? ""}`;
      byEnrollment.set(enrollmentKey, [...(byEnrollment.get(enrollmentKey) ?? []), record]);
    }
    const duplicateOverageCents = Array.from(byEnrollment.values())
      .filter((items: BillingRecord[]) => items.length > 1)
      .reduce((sum: number, items: BillingRecord[]) => sum + items.slice(1).reduce((inner: number, item: BillingRecord) => inner + item.amountCents, 0), 0);
    const hasDispute = group.some((record: BillingRecord) => record.paymentState === "disputed");
    const hasRefundPending = group.some((record: BillingRecord) => record.refundState === "pending");
    const hasRetryFailure = group.some((record: BillingRecord) => record.paymentState === "failed");
    const classification: ReconciliationClassification = hasDispute
      ? "disputed"
      : duplicateOverageCents > 0
        ? "duplicate_candidate"
        : hasRefundPending
          ? "refund_pending"
          : hasRetryFailure
            ? "retry_failure"
            : enrollmentIds.length > 1
              ? "authorized_family_charge"
              : settledRecords.length > 0
                ? "matched"
                : "unmatched";
    const action = classification === "duplicate_candidate"
      ? "review_refund"
      : classification === "refund_pending"
        ? "review_refund"
        : classification === "retry_failure"
          ? "review_retry"
          : classification === "unmatched"
            ? "identity_match"
            : "none";
    return {
      key,
      familyKey: group[0]?.familyKey ?? "",
      enrollmentIds,
      records: group,
      totalSettledCents: settledRecords.reduce((sum: number, record: BillingRecord) => sum + record.amountCents, 0),
      duplicateOverageCents,
      classification,
      action,
    };
  });
}

export const PREPAID_PLANS = {
  basic: { label: "Basic", monthlyCents: 14_900 },
  blackBelt: { label: "Black Belt", monthlyCents: 19_900 },
  leadership: { label: "Leadership", monthlyCents: 24_900 },
} as const;

export type PrepaidPlan = keyof typeof PREPAID_PLANS;

export interface PrepaidQuoteInput {
  plan: PrepaidPlan;
  familyDiscountedMonthlyCents?: number;
  verifiedCreditCents?: number;
  existingMember: boolean;
  paidThrough?: string;
  activeRecurringThrough?: string;
  requestedStart?: string;
}

export interface PrepaidQuote {
  plan: PrepaidPlan;
  monthlyBaseCents: number;
  monthlyChargeableCents: number;
  months: 6;
  discountPercent: 10;
  grossCents: number;
  creditAppliedCents: number;
  totalDueCents: number;
  enrollmentFeeCents: 0;
  autoRenew: false;
  startsAfter?: string;
}

/** Calculates the six-month, non-renewing offer. It never creates a checkout. */
export function quoteSixMonthPrepaid(input: PrepaidQuoteInput): PrepaidQuote {
  if (!input.existingMember) throw new Error("Six-month prepaid migration is for existing members only");
  if (input.activeRecurringThrough && input.requestedStart && input.requestedStart < input.activeRecurringThrough) {
    throw new Error("Requested prepaid coverage overlaps an active recurring period");
  }
  const plan = PREPAID_PLANS[input.plan];
  const monthlyChargeableCents = input.familyDiscountedMonthlyCents ?? plan.monthlyCents;
  if (!Number.isInteger(monthlyChargeableCents) || monthlyChargeableCents <= 0) throw new Error("Invalid monthly tuition");
  const grossCents = Math.round(monthlyChargeableCents * 6 * 0.9);
  const creditAppliedCents = Math.min(Math.max(input.verifiedCreditCents ?? 0, 0), grossCents);
  return {
    plan: input.plan,
    monthlyBaseCents: plan.monthlyCents,
    monthlyChargeableCents,
    months: 6,
    discountPercent: 10,
    grossCents,
    creditAppliedCents,
    totalDueCents: grossCents - creditAppliedCents,
    enrollmentFeeCents: 0,
    autoRenew: false,
    startsAfter: input.paidThrough,
  };
}

export type SmsSegment = "processor_failure" | "confirmed_past_due" | "migrating" | "duplicate_review";

export interface SmsDraftInput {
  segment: SmsSegment;
  firstName: string;
  secureLoginPath: string;
  optOut: boolean;
  quietHours: boolean;
}

/** Returns a draft only. It intentionally never calls an SMS provider. */
export function createSmsDraft(input: SmsDraftInput): { status: "draft" | "suppressed"; reason?: string; message?: string } {
  if (input.optOut) return { status: "suppressed", reason: "recipient opted out" };
  if (input.quietHours) return { status: "suppressed", reason: "quiet hours" };
  if (!/^\/[^?\s]+$/.test(input.secureLoginPath)) throw new Error("SMS links must be relative secure paths");
  const copy: Record<SmsSegment, string> = {
    processor_failure: `Hi ${input.firstName}, MyDojo is reviewing a payment-method issue. Please sign in securely here: ${input.secureLoginPath}. Reply STOP to opt out.`,
    confirmed_past_due: `Hi ${input.firstName}, MyDojo found an account item that needs your review. Please sign in securely here: ${input.secureLoginPath}. Reply STOP to opt out.`,
    migrating: `Hi ${input.firstName}, MyDojo is moving billing to PayPal. Please review your secure account options here: ${input.secureLoginPath}. Reply STOP to opt out.`,
    duplicate_review: `Hi ${input.firstName}, MyDojo is reviewing a possible duplicate payment. Please sign in securely here: ${input.secureLoginPath}. Reply STOP to opt out.`,
  };
  return { status: "draft", message: copy[input.segment] };
}

export function assertOperationalApproval(approved: boolean, operation: string): void {
  if (!approved) throw new Error(`${operation} requires explicit owner approval`);
}
