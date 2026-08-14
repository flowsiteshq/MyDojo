import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("payment system overhaul", () => {
  it("keeps active public checkout pages free of embedded legacy tokenizers", () => {
    for (const page of [
      "client/src/pages/CustomPaymentCheckout.tsx",
      "client/src/pages/IntroOfferCheckout.tsx",
      "client/src/pages/BuyDayPass.tsx",
      "client/src/pages/FamilyEnrollment.tsx",
      "client/src/pages/SummerCampEnroll.tsx",
      "client/src/pages/SummerCampOpenHouse.tsx",
      "client/src/pages/AdminScheduledPayments.tsx",
      "client/src/pages/MemberDashboard2.tsx",
    ]) {
      const source = read(page);
      expect(source).not.toMatch(/app\.fluidpay\.com\/tokenizer/i);
      expect(source).not.toMatch(/new\s+window\.Tokenizer/i);
    }
  });

  it("uses Stripe Checkout contracts for one-time public purchases", () => {
    const source = read("server/routers.ts");
    expect(source).toContain("createStripeRegistrationCheckout");
    expect(source).toContain("createSummerCampEnrollCheckout");
    expect(source).toMatch(/type:\s*["']family_registration["']/);
    expect(source).toMatch(/type:\s*["']summer_camp_enrollment["']/);
    expect(source).toContain("stripe.checkout.sessions.create");
  });

  it("records and recovers recurring Stripe payment failures without relying on legacy transaction identifiers", () => {
    const webhook = read("server/stripeWebhook.ts");
    const schema = read("drizzle/schema.ts");
    expect(webhook).toContain('case "invoice.payment_succeeded"');
    expect(webhook).toContain("handleInvoicePaymentSucceeded");
    expect(webhook).toContain("stripeInvoiceId");
    expect(schema).toContain("stripeSubscriptionId: varchar(\"stripeSubscriptionId\"");
  });

  it("uses one secure staff payment-method update experience for legacy and current enrollments", () => {
    const modal = read("client/src/components/UpdatePaymentMethodModal.tsx");
    const router = read("server/routers.ts");
    expect(modal).toContain("StripePaymentForm");
    expect(modal).toContain("createSetupIntentForEnrollment");
    expect(router).toContain("migratedFromLegacyBilling");
    expect(router).toContain("stripePaymentMethodId");
  });

  it("uses hosted setup and Stripe off-session charging for future scheduled payments", () => {
    const scheduledRouter = read("server/scheduledPaymentsRouter.ts");
    const job = read("server/scheduledPaymentsJob.ts");
    const webhook = read("server/stripeWebhook.ts");
    expect(scheduledRouter).toContain("createSetupCheckout");
    expect(scheduledRouter).toContain('mode: "setup"');
    expect(job).toContain("stripePaymentMethodId");
    expect(job).toContain("off_session: true");
    expect(webhook).toContain("handleScheduledPaymentSetup");
  });

  it("uses hosted recurring checkout for family kickboxing add-ons and removes the old test-payment route", () => {
    const memberDashboard = read("client/src/pages/MemberDashboard2.tsx");
    const router = read("server/routers.ts");
    const webhook = read("server/stripeWebhook.ts");
    const app = read("client/src/App.tsx");
    expect(memberDashboard).toContain("createFamilyKickboxingCheckout");
    expect(router).toContain("createFamilyKickboxingCheckout");
    expect(webhook).toContain("handleFamilyKickboxingAddOn");
    expect(app).not.toContain('path="/test-payment"');
  });

  it("does not expose legacy token or direct legacy-processor creation paths for new payments", () => {
    for (const file of [
      "server/scheduledPaymentsRouter.ts",
      "server/scheduledPaymentsJob.ts",
      "client/src/pages/AdminScheduledPayments.tsx",
      "client/src/pages/MemberDashboard2.tsx",
    ]) {
      const source = read(file);
      expect(source).not.toMatch(/paymentNonce|cardToken|chargeVaultedCard|app\.fluidpay\.com\/tokenizer/i);
    }
    const router = read("server/routers.ts");
    expect(router).not.toMatch(/purchaseIntroOffer:\s*publicProcedure/);
    expect(router).not.toMatch(/addFamilyKickboxingMember:\s*protectedProcedure/);
    expect(router).not.toMatch(/testCharge:\s*publicProcedure/);
    expect(router).not.toMatch(/createEnrollmentCheckout:\s*publicProcedure/);
    expect(router).not.toMatch(/confirmDayPassCheckIn:\s*publicProcedure/);
    expect(router).not.toMatch(/createMissingSubscription:\s*protectedProcedure/);
    expect(router).not.toMatch(/app\.fluidpay\.com\/api\/transaction(?!\/search)/);

    const retryJob = read("server/billingRetryJob.ts");
    const deferredTuitionJob = read("server/deferredTuitionJob.ts");
    expect(retryJob).toContain("stripe.invoices.pay");
    expect(retryJob).not.toMatch(/app\.fluidpay\.com|fluidpayCustomerId/);
    expect(deferredTuitionJob).not.toMatch(/app\.fluidpay\.com|fluidpayCustomerId/);
  });

  it("keeps the active server and administrative payment interfaces free of legacy provider setup", () => {
    const server = read("server/_core/index.ts");
    const billing = read("client/src/pages/AdminBilling.tsx");
    const billingSchedule = read("client/src/pages/AdminBillingSchedule.tsx");
    const customPayments = read("client/src/pages/AdminCustomPayments.tsx");
    const packages = read("client/src/pages/AdminPackages.tsx");
    expect(server).not.toContain('"/api/fluidpay/webhook"');
    expect(server).not.toContain("handleFluidPayWebhook");
    expect(billing).not.toMatch(/Fluid Pay Webhook Setup|app\.fluidpay\.com|\/api\/fluidpay\/webhook/);
    expect(billingSchedule).not.toMatch(/Create missing FluidPay subscription|no FluidPay or Stripe subscription/);
    expect(customPayments).not.toMatch(/pay via FluidPay|Create shareable FluidPay/);
    expect(packages).not.toMatch(/Fluid Pay Plan ID|automatic monthly billing via Fluid Pay/);
  });

  it("covers every paid checkout type with a Stripe session or secure enrollment intent and a fulfillment handler", () => {
    const router = read("server/routers.ts");
    const webhook = read("server/stripeWebhook.ts");
    const shop = read("server/shopRouter.ts");
    const scheduled = read("server/scheduledPaymentsRouter.ts");

    // Membership enrollments use a PaymentIntent with an off-session reusable method.
    expect(router).toContain("createStripeEnrollmentPayment");
    expect(router).toContain('setup_future_usage: "off_session"');
    expect(router).toContain("completeStripeEnrollmentPayment");

    for (const type of [
      "intro_offer",
      "day_pass",
      "family_registration",
      "summer_camp_enrollment",
      "family_kickboxing_addon",
      "belt_exam",
      "belt_test_intent",
      "belt_test_intent_multi",
      "event_registration",
    ]) {
      expect(router).toMatch(new RegExp(`type:\\s*[:]?\\s*["']${type}["']`));
    }
    expect(shop).toContain('type: "shop_purchase"');
    expect(scheduled).toContain('type: "scheduled_payment_setup"');

    for (const handler of [
      "handleBeltExamPayment",
      "handleBeltTestIntentPayment",
      "handleEventRegistrationPayment",
      "handleShopPurchase",
      "handleDayPassPurchase",
      "handleFamilyRegistration",
      "handleSummerCampEnrollment",
      "handleFamilyKickboxingAddOn",
      "handleScheduledPaymentSetup",
    ]) {
      expect(webhook).toContain(handler);
    }
  });
});
