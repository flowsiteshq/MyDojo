import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "paypalRouter.ts"), "utf8");
const helperSource = fs.readFileSync(path.resolve(import.meta.dirname, "paypalHelper.ts"), "utf8");
const schemaSource = fs.readFileSync(path.resolve(import.meta.dirname, "../drizzle/schema.ts"), "utf8");
const migrationSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../docs/0089_repair_belt_test_paypal_columns.sql"),
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
