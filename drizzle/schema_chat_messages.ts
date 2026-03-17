import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Chat messages table with full status tracking.
 * Supports sent/delivered/read receipts for web chat.
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Conversation this message belongs to */
  conversationId: varchar("conversationId", { length: 255 }).notNull(),
  
  /** Client-side message ID for deduplication and tracking */
  clientMessageId: varchar("clientMessageId", { length: 255 }),
  
  /** Message direction: inbound (from user) or outbound (from assistant) */
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  
  /** Channel: web, sms, voice */
  channel: mysqlEnum("channel", ["web", "sms", "voice"]).default("web").notNull(),
  
  /** Message content */
  content: text("content").notNull(),
  
  /** Message status progression */
  status: mysqlEnum("status", ["queued", "sent", "delivered", "read"]).default("queued").notNull(),
  
  /** When message was sent by assistant */
  sentAt: timestamp("sentAt"),
  
  /** When message was delivered to client (rendered in UI) */
  deliveredAt: timestamp("deliveredAt"),
  
  /** When message was read by user (visible in focused conversation) */
  readAt: timestamp("readAt"),
  
  /** Metadata as JSON (for buttons, cards, etc.) */
  metadata: text("metadata"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
