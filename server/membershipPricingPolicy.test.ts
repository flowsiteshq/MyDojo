import { describe, expect, it } from "vitest";
import { calculateFamilyRecurringTuition, receivesFamilyRecurringDiscount, STANDARD_NEW_MEMBER_DOWN_PAYMENT } from "./membershipPricingPolicy";

describe("membership pricing policy", () => {
  it("sets the standard new-member down payment to $99", () => {
    expect(STANDARD_NEW_MEMBER_DOWN_PAYMENT).toBe(99);
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
