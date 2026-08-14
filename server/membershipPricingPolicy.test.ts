import { describe, expect, it } from "vitest";
import { calculateFamilyRecurringTuition, calculateInitialEnrollmentDue, receivesFamilyRecurringDiscount, STANDARD_ENROLLMENT_FEE } from "./membershipPricingPolicy";

describe("membership pricing policy", () => {
  it("charges first-month tuition plus the standard $99 enrollment fee", () => {
    expect(STANDARD_ENROLLMENT_FEE).toBe(99);
    expect(calculateInitialEnrollmentDue(149)).toBe(248);
    expect(calculateInitialEnrollmentDue(199)).toBe(298);
    expect(calculateInitialEnrollmentDue(99)).toBe(198);
  });

  it("applies 50% only to the second and third family members", () => {
    expect(receivesFamilyRecurringDiscount(1)).toBe(false);
    expect(receivesFamilyRecurringDiscount(2)).toBe(true);
    expect(receivesFamilyRecurringDiscount(3)).toBe(true);
    expect(receivesFamilyRecurringDiscount(4)).toBe(false);
    expect(calculateFamilyRecurringTuition(149, 2)).toBe(74.5);
    expect(calculateFamilyRecurringTuition(199, 3)).toBe(99.5);
    expect(calculateFamilyRecurringTuition(99, 1)).toBe(99);
  });
});
