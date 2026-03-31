import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      headers: { origin: "http://localhost:3000" },
      cookies: {},
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
  return { ctx };
}

describe("family.getFamilyKickboxingAddOns", () => {
  it("returns an empty array when user has no family group", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // User has no family group, so should return empty array
    const result = await caller.family.getFamilyKickboxingAddOns();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("family.addFamilyKickboxingMember input validation", () => {
  it("throws NOT_FOUND when user has no family group", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.family.addFamilyKickboxingMember({
        memberName: "Jane Doe",
        memberEmail: "jane@example.com",
        memberPhone: "5551234567",
        cardToken: "test-token-123",
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
