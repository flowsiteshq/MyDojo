/**
 * AI SMS Assistant — tRPC Router
 * Admin-only procedures for managing SMS conversations and campaigns.
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { smsConversations, smsMessages, aiSmsCampaigns, trialSignups } from "../drizzle/schema";
import { eq, desc, and, like, sql, inArray } from "drizzle-orm";
import { sendSms } from "./sms800";
import { saveMessage, sendProactiveSms } from "./aiSms";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const aiSmsRouter = router({
  // ─── Conversations ─────────────────────────────────────────────────────────

  /** List all SMS conversations, ordered by most recent */
  listConversations: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        unreadOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const conditions = [];
      if (input.search) {
        conditions.push(
          sql`(${smsConversations.phone} LIKE ${`%${input.search}%`} OR ${smsConversations.contactName} LIKE ${`%${input.search}%`})`
        );
      }
      if (input.unreadOnly) {
        conditions.push(sql`${smsConversations.unreadCount} > 0`);
      }

      const rows = await db
        .select()
        .from(smsConversations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(smsConversations.lastMessageAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  /** Get a single conversation with its messages */
  getConversation: adminProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [conv] = await db
        .select()
        .from(smsConversations)
        .where(eq(smsConversations.id, input.conversationId))
        .limit(1);

      if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

      const messages = await db
        .select()
        .from(smsMessages)
        .where(eq(smsMessages.conversationId, input.conversationId))
        .orderBy(smsMessages.createdAt);

      // Mark as read
      await db
        .update(smsConversations)
        .set({ unreadCount: 0 })
        .where(eq(smsConversations.id, input.conversationId));

      return { conversation: conv, messages };
    }),

  /** Send a manual message from admin to a member */
  sendManualMessage: adminProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string().min(1).max(1600),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [conv] = await db
        .select()
        .from(smsConversations)
        .where(eq(smsConversations.id, input.conversationId))
        .limit(1);

      if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      if (conv.optedOut) throw new TRPCError({ code: "BAD_REQUEST", message: "Contact has opted out" });

      const result = await sendSms({ to: conv.phone, message: input.message });
      await saveMessage(
        conv.id,
        "outbound",
        "human",
        input.message,
        result.messageId,
        result.success ? "sent" : "failed"
      );

      return { success: result.success, error: result.error };
    }),

  /** Toggle AI on/off for a conversation (human takeover) */
  toggleAi: adminProcedure
    .input(z.object({ conversationId: z.number(), aiEnabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db
        .update(smsConversations)
        .set({ aiEnabled: input.aiEnabled } as any)
        .where(eq(smsConversations.id, input.conversationId));

      return { success: true };
    }),

  // ─── Campaigns ─────────────────────────────────────────────────────────────

  /** List all SMS campaigns */
  listCampaigns: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    return db
      .select()
      .from(aiSmsCampaigns)
      .orderBy(desc(aiSmsCampaigns.createdAt));
  }),

  /** Create a new SMS campaign */
  createCampaign: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["lead_followup", "class_reminder", "re_engagement", "custom"]),
        messageTemplate: z.string().min(1).max(1600),
        targetFilter: z.record(z.string(), z.unknown()).optional(),
        scheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [created] = await db
        .insert(aiSmsCampaigns)
        .values({
          name: input.name,
          type: input.type,
          messageTemplate: input.messageTemplate,
          targetFilter: input.targetFilter ?? null,
          scheduledAt: input.scheduledAt ?? null,
          createdBy: ctx.user.id,
        })
        .$returningId();

      return { id: created.id };
    }),

  /** Launch a campaign — sends to all matching leads/contacts */
  launchCampaign: adminProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [campaign] = await db
        .select()
        .from(aiSmsCampaigns)
        .where(eq(aiSmsCampaigns.id, input.campaignId))
        .limit(1);

      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      if (campaign.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign already launched" });
      }

      // Mark as running
      await db
        .update(aiSmsCampaigns)
        .set({ status: "running" } as any)
        .where(eq(aiSmsCampaigns.id, input.campaignId));

      // Get target phone numbers based on campaign type
      let phones: { phone: string; name: string }[] = [];

      if (campaign.type === "lead_followup") {
        // All new/contacted leads with phone numbers
        const leads = await db
          .select({ phone: trialSignups.phone, name: trialSignups.name })
          .from(trialSignups)
          .where(
            and(
              sql`${trialSignups.phone} IS NOT NULL`,
              sql`${trialSignups.phone} != ''`,
              inArray(trialSignups.status, ["new", "contacted"])
            )
          );
        phones = leads.filter((l) => l.phone) as { phone: string; name: string }[];
      } else if (campaign.type === "re_engagement") {
        // All conversations that haven't messaged in 30+ days
        phones = await db
          .select({ phone: smsConversations.phone, name: smsConversations.contactName })
          .from(smsConversations)
          .where(
            and(
              eq(smsConversations.optedOut, false),
              sql`${smsConversations.lastMessageAt} < DATE_SUB(NOW(), INTERVAL 30 DAY)`
            )
          )
          .then((rows) =>
            rows.map((r) => ({ phone: r.phone, name: r.name ?? "" }))
          );
      } else {
        // Custom / class_reminder — use all non-opted-out conversations
        phones = await db
          .select({ phone: smsConversations.phone, name: smsConversations.contactName })
          .from(smsConversations)
          .where(eq(smsConversations.optedOut, false))
          .then((rows) =>
            rows.map((r) => ({ phone: r.phone, name: r.name ?? "" }))
          );
      }

      // Send messages
      let sentCount = 0;
      for (const contact of phones) {
        const personalizedMsg = campaign.messageTemplate.replace(/\{\{name\}\}/gi, contact.name || "there");
        const result = await sendProactiveSms(contact.phone, personalizedMsg, "campaign", contact.name);
        if (result.success) sentCount++;
        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 100));
      }

      // Mark as completed
      await db
        .update(aiSmsCampaigns)
        .set({ status: "completed", sentCount } as any)
        .where(eq(aiSmsCampaigns.id, input.campaignId));

      return { success: true, sentCount, total: phones.length };
    }),

  /** Send a quick one-off SMS to a phone number */
  sendQuickSms: adminProcedure
    .input(
      z.object({
        phone: z.string().min(10),
        message: z.string().min(1).max(1600),
        contactName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendProactiveSms(
        input.phone,
        input.message,
        "campaign",
        input.contactName
      );
      return result;
    }),
});
