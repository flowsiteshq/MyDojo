export const STANDARD_NEW_MEMBER_DOWN_PAYMENT = 99;

/** Only the second and third enrolled members receive the family recurring-tuition rate. */
export function receivesFamilyRecurringDiscount(memberOrder: number): boolean {
  return memberOrder === 2 || memberOrder === 3;
}

/** Returns the monthly recurring tuition after the approved family discount, rounded to cents. */
export function calculateFamilyRecurringTuition(originalMonthlyAmount: number, memberOrder: number): number {
  if (!Number.isFinite(originalMonthlyAmount) || originalMonthlyAmount < 0) {
    throw new Error("A valid monthly tuition amount is required");
  }
  return receivesFamilyRecurringDiscount(memberOrder)
    ? Math.round(originalMonthlyAmount * 50) / 100
    : Math.round(originalMonthlyAmount * 100) / 100;
}
