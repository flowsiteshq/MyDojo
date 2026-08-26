import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const shopRouter = fs.readFileSync(path.join(root, "server", "shopRouter.ts"), "utf8");
const studentCatalog = fs.readFileSync(path.join(root, "client", "src", "data", "shopCatalog.ts"), "utf8");
const checkoutModal = fs.readFileSync(path.join(root, "client", "src", "components", "ShopCheckoutModal.tsx"), "utf8");
const webhook = fs.readFileSync(path.join(root, "server", "stripeWebhook.ts"), "utf8");

describe("MyDojo sparring gear package", () => {
  it("uses the approved $195 server-side price and validates the four available colors", () => {
    expect(shopRouter).toContain('"mydojo-sparring-gear-package"');
    expect(shopRouter).toContain("amountCents: 19500");
    expect(shopRouter).toContain('colors: ["Red", "Black", "White", "Pink"]');
    expect(shopRouter).toContain("Please select an available gear color.");
  });

  it("exposes the same color selection in the student shop and requires it at checkout", () => {
    expect(studentCatalog).toContain('price: 195');
    expect(studentCatalog).toContain('colors: ["Red", "Black", "White", "Pink"]');
    expect(checkoutModal).toContain("Please select a color.");
    expect(checkoutModal).toContain("color: color || undefined");
  });

  it("retains chosen gear color for staff fulfillment", () => {
    expect(webhook).toContain("metadata.color");
    expect(webhook).toContain("selectedOptions");
  });
});
