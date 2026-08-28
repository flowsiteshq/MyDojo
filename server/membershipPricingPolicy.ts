export const STANDARD_ENROLLMENT_FEE = 99;

/** The standard first charge combines the first month of tuition and the one-time enrollment fee. */
export function calculateInitialEnrollmentDue(monthlyTuition: number): number {
  if (!Number.isFinite(monthlyTuition) || monthlyTuition < 0) {
    throw new Error("A valid monthly tuition amount is required");
  }
  return Math.round((monthlyTuition + STANDARD_ENROLLMENT_FEE) * 100) / 100;
}

/** Only the second and third enrolled members receive the approved 50% family tuition rate. */
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

/**
 * Returns the initial amount for a family member: their family-adjusted first
 * month of tuition plus the one-time enrollment fee, unless that fee is waived.
 */
export function calculateFamilyInitialEnrollmentDue(
  originalMonthlyAmount: number,
  enrollmentFee: number,
  memberOrder: number,
  enrollmentFeeWaived = false
): number {
  if (!Number.isFinite(enrollmentFee) || enrollmentFee < 0) {
    throw new Error("A valid enrollment fee is required");
  }
  const firstMonthTuition = calculateFamilyRecurringTuition(originalMonthlyAmount, memberOrder);
  return Math.round((firstMonthTuition + (enrollmentFeeWaived ? 0 : enrollmentFee)) * 100) / 100;
}
