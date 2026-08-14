import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { appRouter } from "./routers";

const script = fs.readFileSync(path.resolve(import.meta.dirname, "../scripts/create-dollar-test-plan.mjs"), "utf8");

describe("private $1 recurring test plan", () => {
  it("creates a live monthly subscription checkout that is explicitly staff-only", () => {
    expect(script).toContain('mydojo_test_plan: "dollar_recurring"');
    expect(script).toContain('visibility: "staff_only"');
    expect(script).toContain("unit_amount: 100");
    expect(script).toContain('recurring: { interval: "month" }');
    expect(script).toContain('mode: "subscription"');
  });

  it("exposes test checkout creation only through the staff-or-administrator procedure", async () => {
    const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
    expect(routerSource).toContain("createPrivateRecurringTestCheckout: staffOrAdminProcedure");
    expect(routerSource).toContain("'Private $1 Recurring Test'");
    expect(routerSource).toContain("mode: 'subscription'");

    const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });
    await expect(caller.admin.createPrivateRecurringTestCheckout()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates a real hosted checkout URL for an authorized administrator", async () => {
    const adminCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { role: "admin" } as any,
    });
    const result = await adminCaller.admin.createPrivateRecurringTestCheckout();
    expect(result.amount).toBe(1);
    expect(result.interval).toBe("month");
    expect(result.checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  it("creates a real hosted checkout URL for an authorized staff user", async () => {
    const staffCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: { role: "staff" } as any,
    });
    const result = await staffCaller.admin.createPrivateRecurringTestCheckout();
    expect(result.amount).toBe(1);
    expect(result.interval).toBe("month");
    expect(result.checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  it("places the test action on an admin layout that explicitly permits staff access", () => {
    const adminPackages = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/AdminPackages.tsx"), "utf8");
    const adminLayout = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/components/AdminLayout.tsx"), "utf8");
    expect(adminPackages).toContain("<AdminLayout>");
    expect(adminPackages).toContain("createPrivateRecurringTestCheckout.mutate()");
    expect(adminLayout).toContain('user.role !== "admin" && user.role !== "staff"');
  });

  it("does not return the private $1 plan through the public enrollment package query", async () => {
    const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });
    const publicPackages = await caller.member.getActivePackages();
    expect(publicPackages.map(pkg => pkg.name)).not.toContain("Private $1 Recurring Test");
  });
});
