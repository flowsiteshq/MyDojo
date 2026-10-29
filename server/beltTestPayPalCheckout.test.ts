import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "paypalRouter.ts"), "utf8");
const appRouterSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const helperSource = fs.readFileSync(path.resolve(import.meta.dirname, "paypalHelper.ts"), "utf8");
const schemaSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const migrationSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../drizzle/0090_repair_belt_paypal_identifiers.sql"),
  "utf8",
);

describe("PayPal belt-test checkout safeguards", () => {
  it("prepares nullable, unique PayPal identifiers without changing existing provider fields", () => {
    const sqlBody = migrationSource.slice(migrationSource.indexOf("ALTER TABLE"));
    expect(migrationSource).toContain("ADD `paypalOrderId` varchar(64) NULL");
    expect(migrationSource).toContain("ADD `paypalCaptureId` varchar(64) NULL");
    expect(migrationSource).toContain("beltTestIntents_paypalOrderId_unique");
    expect(sqlBody).not.toMatch(/DROP|DELETE|UPDATE|paymentStatus|stripe|fluidpay/i);
    expect(schemaSource).toContain('paypalOrderId: varchar("paypalOrderId", { length: 64 }).unique()');
    expect(schemaSource).toContain('paypalCaptureId: varchar("paypalCaptureId", { length: 64 })');
  });

  it("creates a capture-only PayPal order and validates the stored reference and exact USD amount", () => {
    expect(helperSource).toContain('intent: "CAPTURE"');
    expect(helperSource).toContain('currency_code: "USD"');
    expect(helperSource).toContain('PayPal-Request-Id');
    expect(routerSource).toContain("getPayPalOrder(orderId)");
    expect(routerSource).toContain("unit?.reference_id !== expectedReference");
    expect(routerSource).toContain('actualCurrency !== "USD"');
    expect(routerSource).toContain("actualAmount !== (expectedAmount / 100).toFixed(2)");
  });

  it("routes the Intent to Promote fee and optional gear through one PayPal order", () => {
    expect(appRouterSource).toContain('paymentProvider: paymentAmountCents > 0 ? "paypal" : null');
    expect(appRouterSource).toContain("amountCents: paymentAmountCents");
    expect(appRouterSource).toContain("referenceId: `belt-${intentId}`");
    expect(appRouterSource).toContain("customId: `belt-intent-${intentId}`");
    expect(appRouterSource).toContain("paypalOrderId: order.orderId");
    expect(appRouterSource).not.toContain('type: "october_belt_promotion_payment"');
  });

  it("reconciles the stored combined promotion and gear amount", () => {
    expect(routerSource).toContain("intent.paymentAmountCents");
    expect(routerSource).toContain('const includesGear = intents.some((intent) => intent.equipmentChoice === "add")');
    expect(routerSource).toContain('equipmentPaymentStatus: "paid"');
  });

  it("allows unpaid intents to be updated while keeping paid intents protected", () => {
    expect(appRouterSource).toContain('if (duplicate?.paymentStatus === "paid")');
    expect(appRouterSource).toContain("await db.update(schema.beltTestIntents).set({");
    expect(appRouterSource).toContain("paypalOrderId: null");
    expect(appRouterSource).toContain("paypalCaptureId: null");
    expect(appRouterSource).toContain("intentId = duplicate.id");
    expect(appRouterSource).toContain("eq(schema.beltTestIntents.studentName, input.studentName.trim())");
  });

  it("records the verified PayPal capture in the student ledger", () => {
    expect(routerSource).toContain('paymentStatus: "paid"');
    expect(routerSource).toContain('paypalCaptureId: captureId ?? null');
    expect(routerSource).toContain('paymentProvider: "paypal"');
    expect(routerSource).toContain('paymentReference: orderId');
    expect(routerSource).toContain("amountPaid: amountPerIntent");
  });

  it("prevents duplicate capture reconciliation and rejects unlinked orders", () => {
    expect(routerSource).toContain('if (intents.every((intent) => intent.paymentStatus === "paid")) return true;');
    expect(routerSource).toContain('if (!party && !pno && !belt && !gear) return res.status(404)');
    expect(routerSource).toContain('PayPal order is not linked to a MyDojo registration');
  });

  it("does not mark a record paid from a cancelled or unverified browser return", () => {
    expect(routerSource).toContain('current.status === "COMPLETED"');
    expect(routerSource).toContain('capturePayPalOrder(orderId)');
    expect(routerSource).toContain('return res.status(502).json({ error: "PayPal payment could not be verified" })');
  });
});
