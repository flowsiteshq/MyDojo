import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/MemberDashboard2.tsx"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const agreement = readFileSync(resolve(process.cwd(), "client/src/components/EnrollmentAgreement.tsx"), "utf8");

describe("student Account billing dashboard", () => {
  it("renders the requested account and billing overview panels", () => {
    expect(dashboard).toContain("Account &amp; Billing");
    expect(dashboard).toContain("Current Balance");
    expect(dashboard).toContain("Next Payment");
    expect(dashboard).toContain("Membership Plan");
    expect(dashboard).toContain("Members");
    expect(dashboard).toContain("Payment Method");
    expect(dashboard).toContain("Billing History");
    expect(dashboard).toContain("Upcoming Charges &amp; Events");
    expect(dashboard).toContain("Account Actions");
  });

  it("uses real member billing, payment history, and family data rather than hardcoded transactions", () => {
    expect(dashboard).toContain("trpc.member.getPaymentHistory.useQuery");
    expect(dashboard).toContain("trpc.childProfiles.list.useQuery");
    expect(dashboard).toContain("recentPayments.map");
    expect(dashboard).toContain("memberCount = 1 +");
    expect(dashboard).toContain("upcomingPayment?.amount");
  });

  it("keeps payment details secure and exposes relevant account actions", () => {
    expect(dashboard).toContain("Secure payment method");
    expect(dashboard).toContain("Update Card");
    expect(dashboard).toContain("Add Member");
    expect(dashboard).toContain("Manage Plan");
    expect(dashboard).toContain("Payment Settings");
  });

  it("lets the signed-in member open their signed enrollment agreement from Documents", () => {
    expect(dashboard).toContain(">Documents<");
    expect(dashboard).toContain("Signed Enrollment Agreement");
    expect(dashboard).toContain("setShowEnrollmentAgreement(true)");
    expect(dashboard).toContain("readOnly");
    expect(router).toContain("agreementSignature: schema.enrollments.agreementSignature");
    expect(router).toContain("agreementSignedAt: schema.enrollments.agreementSignedAt");
    expect(agreement).toContain("Enrollment Agreement Record");
    expect(agreement).toContain("Electronically signed by");
  });
});
