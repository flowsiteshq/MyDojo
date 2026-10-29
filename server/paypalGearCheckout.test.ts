import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routerSource = readFileSync(new URL("./shopRouter.ts", import.meta.url), "utf8");
const paypalSource = readFileSync(new URL("./paypalRouter.ts", import.meta.url), "utf8");
const helperSource = readFileSync(new URL("./paypalHelper.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../drizzle/0089_closed_gateway.sql", import.meta.url), "utf8");

describe("PayPal sparring gear checkout safeguards", () => {
  it("uses a separate gear order ledger with immutable customer and selection fields", () => {
    expect(schemaSource).toContain('export const gearOrders = mysqlTable("gearOrders"');
    expect(schemaSource).toContain('orderReference: varchar("orderReference"');
    expect(schemaSource).toContain('studentName: varchar("studentName"');
    expect(schemaSource).toContain('paypalOrderId: varchar("paypalOrderId"');
    expect(schemaSource).toContain('paypalCaptureId: varchar("paypalCaptureId"');
    expect(schemaSource).toContain('fulfillmentStatus: mysqlEnum("fulfillmentStatus"');
  });

  it("keeps the package price and allowed gear selections server-controlled", () => {
    expect(routerSource).toContain('amountCents: 19500');
    expect(routerSource).toContain('const GEAR_SIZES = ["Youth S", "Youth M", "Youth L", "Adult S", "Adult M", "Adult L", "Adult XL"]');
    expect(routerSource).toContain('const GEAR_COLORS = ["Red", "Black", "White", "Pink"]');
    expect(routerSource).toContain('createPayPalGearCheckout');
    expect(routerSource).toContain('studentName: z.string().min(1)');
  });

  it("uses PayPal idempotency and a server-side reference", () => {
    expect(helperSource).toContain('"PayPal-Request-Id": `mydojo-${params.referenceId}`');
    expect(helperSource).toContain('reference_id: params.referenceId');
    expect(helperSource).toContain('custom_id: params.customId');
  });

  it("marks gear paid only after exact order/reference verification and pending-state update", () => {
    expect(paypalSource).toContain("async function markGearOrderPaid");
    expect(paypalSource).toContain('unit?.reference_id !== expectedReference');
    expect(paypalSource).toContain('actualCurrency !== gear.currency');
    expect(paypalSource).toContain('actualAmount !== (gear.amountCents / 100).toFixed(2)');
    expect(paypalSource).toContain('eq(schema.gearOrders.paymentStatus, "pending")');
    expect(paypalSource).toContain('gearOrders.paypalOrderId');
  });

  it("generates only an additive gearOrders migration", () => {
    expect(migrationSource).toContain("CREATE TABLE `gearOrders`");
    expect(migrationSource).not.toMatch(/DROP TABLE|DROP COLUMN|ALTER TABLE `shopOrders`/i);
  });
});
