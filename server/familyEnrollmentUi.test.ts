import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const enrollmentPage = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/pages/Enroll.tsx"),
  "utf8"
);
const checkoutSummary = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/components/FluidPayEnrollmentForm.tsx"),
  "utf8"
);

describe("family enrollment due-today display", () => {
  it("explains that later family members receive the 50% rate for both initial and recurring tuition", () => {
    expect(enrollmentPage).toContain("50% off their first-month and recurring monthly tuition");
  });

  it("calculates later-member summary pricing from the discounted first-month tuition plus the enrollment fee", () => {
    expect(checkoutSummary).toContain("const familyTuition = member.monthlyPrice * (index === 0 ? 1 : 0.5)");
    expect(checkoutSummary).toContain("return familyTuition + member.enrollmentFee");
    expect(checkoutSummary).toContain("const dueToday = familyMemberDueToday(member, index) - (feeWaived ? member.enrollmentFee : 0)");
  });
});
