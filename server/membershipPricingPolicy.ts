export const STANDARD_ENROLLMENT_FEE = 99;

/** The standard first charge combines the first month of tuition and the one-time enrollment fee. */
export function calculateInitialEnrollmentDue(monthlyTuition: number): number {
  if (!Number.isFinite(monthlyTuition) || monthlyTuition < 0) {
    throw new Error("A valid monthly tuition amount is required");
  }
  return Math.round((monthlyTuition + STANDARD_ENROLLMENT_FEE) * 100) / 100;
}

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
