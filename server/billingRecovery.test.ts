import { describe, expect, it } from "vitest";
import {
  assertOperationalApproval,
  createSmsDraft,
  quoteSixMonthPrepaid,
  reconcileBillingRecords,
} from "./billingRecovery";

describe("billing recovery policies", () => {
  it("flags duplicate same-enrollment settled charges but preserves separate family charges", () => {
    const cases = reconcileBillingRecords([
      { familyKey: "family-1", enrollmentId: 10, processor: "stripe", transactionId: "pi-a", periodStart: "2026-10-01", periodEnd: "2026-10-31", amountCents: 14900, paymentState: "settled" },
      { familyKey: "family-1", enrollmentId: 10, processor: "stripe", transactionId: "pi-b", periodStart: "2026-10-01", periodEnd: "2026-10-31", amountCents: 14900, paymentState: "settled" },
      { familyKey: "family-1", enrollmentId: 11, processor: "stripe", transactionId: "pi-c", periodStart: "2026-10-01", periodEnd: "2026-10-31", amountCents: 7450, paymentState: "settled" },
    ]);
    expect(cases).toHaveLength(1);
    expect(cases[0].classification).toBe("duplicate_candidate");
    expect(cases[0].duplicateOverageCents).toBe(14900);
    expect(cases[0].totalSettledCents).toBe(37250);
    expect(cases[0].enrollmentIds).toEqual([10, 11]);
  });

  it("classifies a legitimate separate family charge when there is no duplicate", () => {
    const cases = reconcileBillingRecords([
      { familyKey: "family-2", enrollmentId: 20, processor: "fluidpay", transactionId: "fp-a", periodStart: "2026-09-01", periodEnd: "2026-09-30", amountCents: 14900, paymentState: "settled" },
      { familyKey: "family-2", enrollmentId: 21, processor: "fluidpay", transactionId: "fp-b", periodStart: "2026-09-01", periodEnd: "2026-09-30", amountCents: 7450, paymentState: "settled" },
    ]);
    expect(cases[0].classification).toBe("authorized_family_charge");
    expect(cases[0].duplicateOverageCents).toBe(0);
  });

  it("calculates the required six-month prepaid prices", () => {
    expect(quoteSixMonthPrepaid({ plan: "basic", existingMember: true }).totalDueCents).toBe(80460);
    expect(quoteSixMonthPrepaid({ plan: "blackBelt", existingMember: true }).totalDueCents).toBe(107460);
    expect(quoteSixMonthPrepaid({ plan: "leadership", existingMember: true }).totalDueCents).toBe(134460);
    expect(quoteSixMonthPrepaid({ plan: "basic", existingMember: true, verifiedCreditCents: 10000 }).totalDueCents).toBe(70460);
  });

  it("uses actual family-discounted tuition before applying the prepaid discount", () => {
    expect(quoteSixMonthPrepaid({ plan: "basic", familyDiscountedMonthlyCents: 7450, existingMember: true }).grossCents).toBe(40230);
  });

  it("rejects non-members and overlapping prepaid coverage", () => {
    expect(() => quoteSixMonthPrepaid({ plan: "basic", existingMember: false })).toThrow("existing members");
    expect(() => quoteSixMonthPrepaid({ plan: "basic", existingMember: true, activeRecurringThrough: "2026-12-01", requestedStart: "2026-11-15" })).toThrow("overlaps");
  });

  it("creates only dry-run SMS drafts and suppresses opt-outs and quiet hours", () => {
    const draft = createSmsDraft({ segment: "duplicate_review", firstName: "Alex", secureLoginPath: "/member/billing/review", optOut: false, quietHours: false });
    expect(draft.status).toBe("draft");
    expect(draft.message).toContain("Reply STOP");
    expect(draft.message).not.toContain("149");
    expect(createSmsDraft({ segment: "migrating", firstName: "Alex", secureLoginPath: "/member/billing/review", optOut: true, quietHours: false })).toEqual({ status: "suppressed", reason: "recipient opted out" });
    expect(createSmsDraft({ segment: "migrating", firstName: "Alex", secureLoginPath: "/member/billing/review", optOut: false, quietHours: true })).toEqual({ status: "suppressed", reason: "quiet hours" });
  });

  it("requires explicit approval before an operational action", () => {
    expect(() => assertOperationalApproval(false, "subscription cancellation")).toThrow("explicit owner approval");
    expect(() => assertOperationalApproval(true, "subscription cancellation")).not.toThrow();
  });
});
