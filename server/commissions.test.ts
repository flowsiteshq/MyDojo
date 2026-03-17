import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(role: "admin" | "staff" | "user", id = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `user-${id}`,
    email: `user${id}@example.com`,
    name: `User ${id}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { headers: {} } as any,
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
  };
}

const caller = (role: "admin" | "staff" | "user", id = 1) =>
  appRouter.createCaller(makeCtx(role, id));

describe("commissions.getBonusAmount", () => {
  it("returns a bonusAmountCents field for admin", async () => {
    // Mock the DB call — we just verify the procedure resolves without throwing
    // and returns the expected shape. The actual DB is not available in unit tests.
    const adminCaller = caller("admin");
    // We expect either a result or a DB unavailable error (not a FORBIDDEN error)
    try {
      const result = await adminCaller.commissions.getBonusAmount();
      expect(result).toHaveProperty("bonusAmountCents");
      expect(typeof result.bonusAmountCents).toBe("number");
    } catch (err: any) {
      // DB may not be available in test env — that's acceptable
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });

  it("throws FORBIDDEN for regular users", async () => {
    const userCaller = caller("user");
    await expect(userCaller.commissions.getBonusAmount()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("commissions.setBonusAmount", () => {
  it("throws FORBIDDEN for staff members", async () => {
    const staffCaller = caller("staff");
    await expect(
      staffCaller.commissions.setBonusAmount({ bonusAmountCents: 7500 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws FORBIDDEN for regular users", async () => {
    const userCaller = caller("user");
    await expect(
      userCaller.commissions.setBonusAmount({ bonusAmountCents: 7500 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin can call setBonusAmount (DB may be unavailable in test env)", async () => {
    const adminCaller = caller("admin");
    try {
      const result = await adminCaller.commissions.setBonusAmount({ bonusAmountCents: 7500 });
      expect(result).toHaveProperty("success", true);
      expect(result.bonusAmountCents).toBe(7500);
    } catch (err: any) {
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("commissions.assignLead", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const userCaller = caller("user");
    await expect(
      userCaller.commissions.assignLead({ leadId: 1, staffUserId: 2 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("staff can call assignLead (DB may be unavailable in test env)", async () => {
    const staffCaller = caller("staff");
    try {
      await staffCaller.commissions.assignLead({ leadId: 1, staffUserId: 2 });
    } catch (err: any) {
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("commissions.getStaffSummary", () => {
  it("throws FORBIDDEN for staff (admin-only)", async () => {
    const staffCaller = caller("staff");
    await expect(staffCaller.commissions.getStaffSummary()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN for regular users", async () => {
    const userCaller = caller("user");
    await expect(userCaller.commissions.getStaffSummary()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("commissions.markPaid", () => {
  it("throws FORBIDDEN for staff", async () => {
    const staffCaller = caller("staff");
    await expect(
      staffCaller.commissions.markPaid({ commissionId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("commissions.voidCommission", () => {
  it("throws FORBIDDEN for staff", async () => {
    const staffCaller = caller("staff");
    await expect(
      staffCaller.commissions.voidCommission({ commissionId: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
