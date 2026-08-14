import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");

describe("public enrollment package visibility", () => {
  it("filters invitation-only packages from the public enrollment query", () => {
    const activePackageBlock = routerSource.slice(
      routerSource.indexOf("getActivePackages: publicProcedure"),
      routerSource.indexOf("completeZeroDollarEnrollment: publicProcedure"),
    );
    expect(activePackageBlock).toContain("eq(schema.membershipPackages.isActive, 1)");
    expect(activePackageBlock).toContain("eq(schema.membershipPackages.invitationOnly, 0)");
  });

  it("rejects invitation-only membership IDs across public enrollment stages", () => {
    const invitationGuard = "This membership is available by staff invitation only";
    expect(routerSource.match(new RegExp(invitationGuard, "g"))?.length).toBe(3);
  });

  it("keeps Leadership assignment inside the protected admin workflow for active existing students", () => {
    expect(routerSource).toContain("assignLeadershipMembership: adminProcedure");
    expect(routerSource).toContain("Leadership may only be assigned to an active existing student");
    expect(routerSource).toContain("proration_behavior: 'none'");
  });

  it("rejects the active invitation-only Leadership package in every public enrollment procedure", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const [leadership] = await db!.select().from(schema.membershipPackages)
      .where(and(eq(schema.membershipPackages.name, "Leadership"), eq(schema.membershipPackages.invitationOnly, 1)))
      .limit(1);
    expect(leadership).toBeTruthy();

    const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });
    const common = {
      packageId: leadership!.id,
      customerName: "Invitation Guard Test",
      customerEmail: "leadership-guard@example.test",
      customerPhone: "2815550100",
      studentName: "Invitation Guard Test",
      agreementSignature: "Invitation Guard Test",
      agreementSignedAt: "2026-08-14T00:00:00.000Z",
      agreementSignatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/6wAAAABJRU5ErkJggg==",
    };

    const calls = [
      () => caller.member.completeZeroDollarEnrollment({ ...common, waiveEnrollmentFee: true, waiverReason: "test" }),
      () => caller.member.createStripeEnrollmentPayment(common),
      () => caller.member.completeStripeEnrollmentPayment({ ...common, paymentIntentId: "pi_not_retrieved" }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
    }
  });
});
