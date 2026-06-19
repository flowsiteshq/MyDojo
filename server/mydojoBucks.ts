/**
 * MyDojo Bucks — Referral Rewards System
 *
 * Members earn MyDojo Bucks by referring new students.
 * Bucks can be redeemed for merchandise (sparring gear, apparel, etc.)
 *
 * Default earn rate: 500 bucks per successful referral (configurable via adminConfig)
 * Bucks value: 1 buck = $0.01 (so 500 bucks = $5 off merchandise)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a unique referral code like "JOHN-X7K2" */
function generateReferralCode(name: string): string {
  const firstName = (name || "DOJO").split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${firstName}-${suffix}`;
}

/** Get or create a bucks account for a user */
async function getOrCreateAccount(db: Awaited<ReturnType<typeof getDb>>, userId: number) {
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [existing] = await db
    .select()
    .from(schema.mydojoBucksAccounts)
    .where(eq(schema.mydojoBucksAccounts.userId, userId))
    .limit(1);
  if (existing) return existing;
  await db.insert(schema.mydojoBucksAccounts).values({ userId, balance: 0, totalEarned: 0, totalRedeemed: 0 });
  const [created] = await db
    .select()
    .from(schema.mydojoBucksAccounts)
    .where(eq(schema.mydojoBucksAccounts.userId, userId))
    .limit(1);
  return created!;
}

/** Get or create a referral code for a user */
async function getOrCreateReferralCode(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: number,
  userName: string
) {
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [existing] = await db
    .select()
    .from(schema.referralCodes)
    .where(eq(schema.referralCodes.userId, userId))
    .limit(1);
  if (existing) return existing;

  // Generate unique code (retry on collision)
  let code = generateReferralCode(userName);
  let attempts = 0;
  while (attempts < 5) {
    const [collision] = await db
      .select()
      .from(schema.referralCodes)
      .where(eq(schema.referralCodes.code, code))
      .limit(1);
    if (!collision) break;
    code = generateReferralCode(userName);
    attempts++;
  }

  await db.insert(schema.referralCodes).values({ userId, code, totalReferrals: 0, totalBucksEarned: 0 });
  const [created] = await db
    .select()
    .from(schema.referralCodes)
    .where(eq(schema.referralCodes.userId, userId))
    .limit(1);
  return created!;
}

/** Get the configured bucks-per-referral amount (default 500) */
async function getBucksPerReferral(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  if (!db) return 500;
  const [row] = await db
    .select()
    .from(schema.adminConfig)
    .where(eq(schema.adminConfig.key, "bucksPerReferral"))
    .limit(1);
  return row ? parseInt(row.value || "500") : 500;
}

// ─── Public: look up referral code (used on enrollment form) ─────────────────

export async function lookupReferralCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({
      id: schema.referralCodes.id,
      userId: schema.referralCodes.userId,
      code: schema.referralCodes.code,
    })
    .from(schema.referralCodes)
    .where(eq(schema.referralCodes.code, code.toUpperCase().trim()))
    .limit(1);
  return row || null;
}

// ─── Award bucks for a successful referral ────────────────────────────────────

export async function awardReferralBucks(opts: {
  referralCodeId: number;
  referrerId: number;
  referredName: string;
  referredPhone?: string;
  referredEmail?: string;
  enrollmentId?: number;
}) {
  const db = await getDb();
  if (!db) return;

  const bucksAmount = await getBucksPerReferral(db);

  // Create the referral record
  await db.insert(schema.referrals).values({
    referrerId: opts.referrerId,
    referralCodeId: opts.referralCodeId,
    referredName: opts.referredName,
    referredPhone: opts.referredPhone,
    referredEmail: opts.referredEmail,
    status: "enrolled",
    bucksAwarded: bucksAmount,
    enrollmentId: opts.enrollmentId,
    bucksAwardedAt: new Date(),
  });

  const [referralRow] = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.referrerId, opts.referrerId))
    .orderBy(desc(schema.referrals.createdAt))
    .limit(1);

  // Ensure account exists
  await getOrCreateAccount(db, opts.referrerId);

  // Credit the bucks
  await db
    .update(schema.mydojoBucksAccounts)
    .set({
      balance: sql`balance + ${bucksAmount}`,
      totalEarned: sql`totalEarned + ${bucksAmount}`,
    })
    .where(eq(schema.mydojoBucksAccounts.userId, opts.referrerId));

  // Log the transaction
  await db.insert(schema.mydojoBucksTransactions).values({
    userId: opts.referrerId,
    amount: bucksAmount,
    type: "referral_earn",
    description: `Referral reward — ${opts.referredName} enrolled!`,
    enrollmentId: opts.enrollmentId,
    referralId: referralRow?.id,
  });

  // Update referral code stats
  await db
    .update(schema.referralCodes)
    .set({
      totalReferrals: sql`totalReferrals + 1`,
      totalBucksEarned: sql`totalBucksEarned + ${bucksAmount}`,
    })
    .where(eq(schema.referralCodes.id, opts.referralCodeId));
}

// ─── tRPC Router ─────────────────────────────────────────────────────────────

export const mydojoBucksRouter = router({
  /** Get the current member's bucks balance, referral code, and recent transactions */
  getMyDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const account = await getOrCreateAccount(db, ctx.user.id);
    const referralCode = await getOrCreateReferralCode(db, ctx.user.id, ctx.user.name || ctx.user.email);

    const transactions = await db
      .select()
      .from(schema.mydojoBucksTransactions)
      .where(eq(schema.mydojoBucksTransactions.userId, ctx.user.id))
      .orderBy(desc(schema.mydojoBucksTransactions.createdAt))
      .limit(20);

    const referralHistory = await db
      .select()
      .from(schema.referrals)
      .where(eq(schema.referrals.referrerId, ctx.user.id))
      .orderBy(desc(schema.referrals.createdAt))
      .limit(10);

    const pendingRedemptions = await db
      .select()
      .from(schema.bucksRedemptions)
      .where(
        and(
          eq(schema.bucksRedemptions.userId, ctx.user.id),
          eq(schema.bucksRedemptions.status, "pending")
        )
      )
      .orderBy(desc(schema.bucksRedemptions.createdAt));

    const bucksPerReferral = await getBucksPerReferral(db);

    return {
      balance: account.balance,
      totalEarned: account.totalEarned,
      totalRedeemed: account.totalRedeemed,
      referralCode: referralCode.code,
      totalReferrals: referralCode.totalReferrals,
      transactions,
      referralHistory,
      pendingRedemptions,
      bucksPerReferral,
    };
  }),

  /** Request to redeem bucks for merchandise */
  requestRedemption: protectedProcedure
    .input(
      z.object({
        bucksAmount: z.number().int().min(100).max(10000),
        itemDescription: z.string().min(5).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const account = await getOrCreateAccount(db, ctx.user.id);
      if (account.balance < input.bucksAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient balance. You have ${account.balance} bucks but need ${input.bucksAmount}.`,
        });
      }

      // Deduct bucks immediately (hold)
      await db
        .update(schema.mydojoBucksAccounts)
        .set({
          balance: sql`balance - ${input.bucksAmount}`,
          totalRedeemed: sql`totalRedeemed + ${input.bucksAmount}`,
        })
        .where(eq(schema.mydojoBucksAccounts.userId, ctx.user.id));

      // Create redemption request
      await db.insert(schema.bucksRedemptions).values({
        userId: ctx.user.id,
        bucksAmount: input.bucksAmount,
        itemDescription: input.itemDescription,
        status: "pending",
      });

      const [redemption] = await db
        .select()
        .from(schema.bucksRedemptions)
        .where(eq(schema.bucksRedemptions.userId, ctx.user.id))
        .orderBy(desc(schema.bucksRedemptions.createdAt))
        .limit(1);

      // Log the transaction
      await db.insert(schema.mydojoBucksTransactions).values({
        userId: ctx.user.id,
        amount: -input.bucksAmount,
        type: "redemption",
        description: `Redemption request: ${input.itemDescription}`,
        redemptionId: redemption?.id,
      });

      return { success: true, redemptionId: redemption?.id };
    }),

  /** Look up a referral code (public — used on enrollment forms) */
  lookupCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const result = await lookupReferralCode(input.code);
      if (!result) return null;
      // Return minimal info (don't expose userId)
      return { code: result.code, valid: true };
    }),

  // ─── Admin procedures ───────────────────────────────────────────────────────

  /** Admin: get all members' bucks balances */
  adminGetAllAccounts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const accounts = await db
      .select({
        id: schema.mydojoBucksAccounts.id,
        userId: schema.mydojoBucksAccounts.userId,
        balance: schema.mydojoBucksAccounts.balance,
        totalEarned: schema.mydojoBucksAccounts.totalEarned,
        totalRedeemed: schema.mydojoBucksAccounts.totalRedeemed,
        updatedAt: schema.mydojoBucksAccounts.updatedAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.mydojoBucksAccounts)
      .leftJoin(schema.users, eq(schema.mydojoBucksAccounts.userId, schema.users.id))
      .orderBy(desc(schema.mydojoBucksAccounts.balance));

    return accounts;
  }),

  /** Admin: get all pending redemption requests */
  adminGetPendingRedemptions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const redemptions = await db
      .select({
        id: schema.bucksRedemptions.id,
        userId: schema.bucksRedemptions.userId,
        bucksAmount: schema.bucksRedemptions.bucksAmount,
        itemDescription: schema.bucksRedemptions.itemDescription,
        status: schema.bucksRedemptions.status,
        adminNotes: schema.bucksRedemptions.adminNotes,
        createdAt: schema.bucksRedemptions.createdAt,
        processedAt: schema.bucksRedemptions.processedAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.bucksRedemptions)
      .leftJoin(schema.users, eq(schema.bucksRedemptions.userId, schema.users.id))
      .orderBy(desc(schema.bucksRedemptions.createdAt));

    return redemptions;
  }),

  /** Admin: approve or reject a redemption request */
  adminProcessRedemption: protectedProcedure
    .input(
      z.object({
        redemptionId: z.number().int(),
        action: z.enum(["approved", "fulfilled", "rejected"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [redemption] = await db
        .select()
        .from(schema.bucksRedemptions)
        .where(eq(schema.bucksRedemptions.id, input.redemptionId))
        .limit(1);

      if (!redemption) throw new TRPCError({ code: "NOT_FOUND", message: "Redemption not found" });

      // If rejecting, refund the bucks
      if (input.action === "rejected") {
        await db
          .update(schema.mydojoBucksAccounts)
          .set({
            balance: sql`balance + ${redemption.bucksAmount}`,
            totalRedeemed: sql`totalRedeemed - ${redemption.bucksAmount}`,
          })
          .where(eq(schema.mydojoBucksAccounts.userId, redemption.userId));

        await db.insert(schema.mydojoBucksTransactions).values({
          userId: redemption.userId,
          amount: redemption.bucksAmount,
          type: "manual_adjust",
          description: `Redemption refunded — request #${redemption.id} rejected`,
          redemptionId: redemption.id,
          adminUserId: ctx.user.id,
        });
      }

      await db
        .update(schema.bucksRedemptions)
        .set({
          status: input.action,
          adminNotes: input.adminNotes,
          processedByUserId: ctx.user.id,
          processedAt: new Date(),
        })
        .where(eq(schema.bucksRedemptions.id, input.redemptionId));

      return { success: true };
    }),

  /** Admin: manually adjust a member's bucks balance */
  adminAdjustBalance: protectedProcedure
    .input(
      z.object({
        userId: z.number().int(),
        amount: z.number().int(), // positive = add, negative = deduct
        reason: z.string().min(3).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await getOrCreateAccount(db, input.userId);

      await db
        .update(schema.mydojoBucksAccounts)
        .set({
          balance: sql`balance + ${input.amount}`,
          totalEarned: input.amount > 0 ? sql`totalEarned + ${input.amount}` : sql`totalEarned`,
        })
        .where(eq(schema.mydojoBucksAccounts.userId, input.userId));

      await db.insert(schema.mydojoBucksTransactions).values({
        userId: input.userId,
        amount: input.amount,
        type: "manual_adjust",
        description: `Admin adjustment: ${input.reason}`,
        adminUserId: ctx.user.id,
      });

      return { success: true };
    }),

  /** Admin: get/set the bucks-per-referral config */
  adminGetConfig: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const bucksPerReferral = await getBucksPerReferral(db);
    return { bucksPerReferral };
  }),

  adminSetConfig: protectedProcedure
    .input(z.object({ bucksPerReferral: z.number().int().min(1).max(100000) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .insert(schema.adminConfig)
        .values({ key: "bucksPerReferral", value: String(input.bucksPerReferral) })
        .onDuplicateKeyUpdate({ set: { value: String(input.bucksPerReferral) } });
      return { success: true };
    }),

  /** Admin: get all referrals */
  adminGetAllReferrals: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const referrals = await db
      .select({
        id: schema.referrals.id,
        referrerId: schema.referrals.referrerId,
        referredName: schema.referrals.referredName,
        referredPhone: schema.referrals.referredPhone,
        referredEmail: schema.referrals.referredEmail,
        status: schema.referrals.status,
        bucksAwarded: schema.referrals.bucksAwarded,
        bucksAwardedAt: schema.referrals.bucksAwardedAt,
        createdAt: schema.referrals.createdAt,
        referrerName: schema.users.name,
        referrerEmail: schema.users.email,
      })
      .from(schema.referrals)
      .leftJoin(schema.users, eq(schema.referrals.referrerId, schema.users.id))
      .orderBy(desc(schema.referrals.createdAt));

    return referrals;
  }),
});
