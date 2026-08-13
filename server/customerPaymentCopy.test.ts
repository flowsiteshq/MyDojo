import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sources = [
  "client/src/components/ShopCheckoutModal.tsx",
  "client/src/components/StripePaymentForm.tsx",
  "client/src/components/FluidPayEnrollmentForm.tsx",
  "client/src/components/OnlineSpecialPopup.tsx",
  "client/src/pages/MemberDashboard2.tsx",
  "client/src/pages/BeltTestIntent.tsx",
  "client/src/pages/CustomPaymentCheckout.tsx",
  "client/src/pages/FamilyEnrollment.tsx",
  "client/src/pages/IntroOfferCheckout.tsx",
  "client/src/pages/MasterYaegerSeminar.tsx",
  "client/src/pages/SummerCampEnroll.tsx",
  "client/src/pages/SummerCampOpenHouse.tsx",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

describe("customer-facing payment copy", () => {
  it("uses neutral secure-payment language rather than processor branding", () => {
    const customerCopy = sources.join("\n");
    expect(customerCopy).toContain("Secure Checkout");
    expect(customerCopy).toContain("Secure payment");
    expect(customerCopy).not.toContain("Checkout with Stripe");
    expect(customerCopy).not.toContain("Continue to Stripe");
    expect(customerCopy).not.toContain("Secured by Stripe");
    expect(customerCopy).not.toContain("Secured by FluidPay");
    expect(customerCopy).not.toContain("Powered by FluidPay");
    expect(customerCopy).not.toContain("powered by Stripe");
  });

  it("keeps card security reassurance without exposing payment infrastructure", () => {
    const studentShop = sources[0];
    const studentAccount = sources[4];
    expect(studentShop).toContain("MyDojo never stores your card details.");
    expect(studentAccount).toContain("Card details are encrypted and never stored by MyDojo.");
    expect(studentAccount).toContain("Secure payment method");
  });
});
