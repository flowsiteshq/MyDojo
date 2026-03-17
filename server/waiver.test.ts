import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";

describe("Waiver Signature", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      const { waiverSignatures } = await import("../drizzle/schema");
      const { like } = await import("drizzle-orm");
      // Only delete test records
      await db.delete(waiverSignatures).where(like(waiverSignatures.email, "%@example.com"));
    }
  });

  it("should successfully submit a waiver signature", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.waiver.submit({
      name: "John Doe",
      phone: "555-123-4567",
      email: "john.doe@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john.doe@example.com");
    expect(result.signedAt).toBeDefined();
  });

  it("should reject submission with missing name", async () => {
    const caller = appRouter.createCaller({ user: null });

    await expect(
      caller.waiver.submit({
        name: "",
        phone: "555-123-4567",
        email: "john.doe@example.com",
      })
    ).rejects.toThrow();
  });

  it("should reject submission with invalid email", async () => {
    const caller = appRouter.createCaller({ user: null });

    await expect(
      caller.waiver.submit({
        name: "John Doe",
        phone: "555-123-4567",
        email: "invalid-email",
      })
    ).rejects.toThrow();
  });

  it("should store waiver signature in database", async () => {
    if (!db) {
      throw new Error("Database not available");
    }

    const caller = appRouter.createCaller({ user: null });
    const { waiverSignatures } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const testEmail = "test.waiver@example.com";

    // Submit waiver
    await caller.waiver.submit({
      name: "Test User",
      phone: "555-999-8888",
      email: testEmail,
    });

    // Verify it was stored
    const stored = await db
      .select()
      .from(waiverSignatures)
      .where(eq(waiverSignatures.email, testEmail))
      .limit(1);

    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe("Test User");
    expect(stored[0].phone).toBe("555-999-8888");
    expect(stored[0].email).toBe(testEmail);
    expect(stored[0].acceptedLiability).toBe(1);
    expect(stored[0].acceptedPhotoConsent).toBe(1);
    expect(stored[0].waiverVersion).toBe("2026-02");
  });

  it("should record IP address when provided", async () => {
    if (!db) {
      throw new Error("Database not available");
    }

    const caller = appRouter.createCaller({ user: null });
    const { waiverSignatures } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const testEmail = "test.ip@example.com";
    const testIp = "192.168.1.1";

    // Submit waiver with IP
    await caller.waiver.submit({
      name: "IP Test User",
      phone: "555-111-2222",
      email: testEmail,
      ipAddress: testIp,
    });

    // Verify IP was stored
    const stored = await db
      .select()
      .from(waiverSignatures)
      .where(eq(waiverSignatures.email, testEmail))
      .limit(1);

    expect(stored.length).toBe(1);
    expect(stored[0].ipAddress).toBe(testIp);
  });
});
