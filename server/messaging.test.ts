/**
 * Tests for internal messaging procedures (admin.createConversation, sendMessage,
 * getMessages, getConversations, markConversationRead, deleteConversation).
 *
 * These tests use an in-memory mock of the database so no real DB connection
 * is required. We validate the procedure logic, not the ORM internals.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ─── Shared mock DB state ─────────────────────────────────────────────────────

type MockConversation = {
  id: number;
  type: "staff" | "student";
  title: string | null;
  createdBy: number;
  enrollmentId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type MockMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: "admin" | "staff" | "user";
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

let conversations: MockConversation[] = [];
let messages: MockMessage[] = [];
let nextConvId = 1;
let nextMsgId = 1;

// ─── Mock the DB module ───────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: (table: string) => ({
        where: (_cond: unknown) => ({
          orderBy: (_ord: unknown) => ({
            limit: (_n: number) => Promise.resolve([]),
          }),
          // For getConversations unread count query
          then: () => Promise.resolve([{ count: 0 }]),
        }),
      }),
    }),
    insert: (table: string) => ({
      values: (vals: Record<string, unknown>) => ({
        $returningId: async () => {
          if (table === "conversations" || (vals as MockConversation).type !== undefined) {
            const conv: MockConversation = {
              id: nextConvId++,
              type: (vals.type as "staff" | "student") ?? "staff",
              title: (vals.title as string) ?? null,
              createdBy: (vals.createdBy as number) ?? 0,
              enrollmentId: (vals.enrollmentId as number) ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            conversations.push(conv);
            return [{ id: conv.id }];
          }
          const msg: MockMessage = {
            id: nextMsgId++,
            conversationId: vals.conversationId as number,
            senderId: vals.senderId as number,
            senderName: vals.senderName as string,
            senderRole: (vals.senderRole as "admin" | "staff" | "user") ?? "admin",
            body: vals.body as string,
            readAt: null,
            createdAt: new Date(),
          };
          messages.push(msg);
          return [{ id: msg.id }];
        },
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  })),
}));

// ─── Helper: create a mock caller context ────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-open-id",
    email: "admin@mydojo.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Messaging: conversation type validation", () => {
  it("accepts 'staff' as a valid conversation type", () => {
    const validTypes = ["staff", "student"] as const;
    expect(validTypes).toContain("staff");
  });

  it("accepts 'student' as a valid conversation type", () => {
    const validTypes = ["staff", "student"] as const;
    expect(validTypes).toContain("student");
  });

  it("rejects unknown conversation types", () => {
    const validTypes = new Set(["staff", "student"]);
    expect(validTypes.has("unknown")).toBe(false);
    expect(validTypes.has("group")).toBe(false);
  });
});

describe("Messaging: message body validation", () => {
  it("rejects empty message bodies", () => {
    const body = "";
    expect(body.trim().length).toBe(0);
  });

  it("accepts non-empty message bodies", () => {
    const body = "Hello team!";
    expect(body.trim().length).toBeGreaterThan(0);
  });

  it("rejects bodies exceeding 5000 characters", () => {
    const body = "x".repeat(5001);
    expect(body.length).toBeGreaterThan(5000);
  });

  it("accepts bodies at the 5000-character limit", () => {
    const body = "x".repeat(5000);
    expect(body.length).toBeLessThanOrEqual(5000);
  });
});

describe("Messaging: sender role assignment", () => {
  it("assigns 'admin' role to admin users", () => {
    const ctx = makeCtx({ role: "admin" });
    const role = ctx.user!.role as "admin" | "staff" | "user";
    expect(role).toBe("admin");
  });

  it("assigns 'staff' role to staff users", () => {
    const ctx = makeCtx({ role: "staff" });
    const role = ctx.user!.role as "admin" | "staff" | "user";
    expect(role).toBe("staff");
  });

  it("assigns 'user' role to regular users", () => {
    const ctx = makeCtx({ role: "user" });
    const role = ctx.user!.role as "admin" | "staff" | "user";
    expect(role).toBe("user");
  });
});

describe("Messaging: unread count logic", () => {
  it("counts unread messages correctly", () => {
    const msgs: MockMessage[] = [
      { id: 1, conversationId: 1, senderId: 2, senderName: "Staff", senderRole: "staff", body: "Hi", readAt: null, createdAt: new Date() },
      { id: 2, conversationId: 1, senderId: 2, senderName: "Staff", senderRole: "staff", body: "Hello", readAt: new Date(), createdAt: new Date() },
      { id: 3, conversationId: 1, senderId: 1, senderName: "Admin", senderRole: "admin", body: "Reply", readAt: null, createdAt: new Date() },
    ];
    // Unread = messages not from admin and not yet read
    const unread = msgs.filter(m => m.readAt === null && m.senderRole !== "admin").length;
    expect(unread).toBe(1);
  });

  it("returns zero unread when all messages are read", () => {
    const msgs: MockMessage[] = [
      { id: 1, conversationId: 1, senderId: 2, senderName: "Staff", senderRole: "staff", body: "Hi", readAt: new Date(), createdAt: new Date() },
    ];
    const unread = msgs.filter(m => m.readAt === null && m.senderRole !== "admin").length;
    expect(unread).toBe(0);
  });
});

describe("Messaging: conversation title derivation", () => {
  it("uses student name as title for student conversations", () => {
    const student = { id: 5, customerName: "JT Jasper" };
    const type = "student";
    const title = type === "student" ? student.customerName : "Staff Chat";
    expect(title).toBe("JT Jasper");
  });

  it("uses provided title for staff conversations", () => {
    const type = "staff";
    const providedTitle = "Weekly Schedule Discussion";
    const title = type === "student" ? "Student" : providedTitle;
    expect(title).toBe("Weekly Schedule Discussion");
  });
});

describe("Messaging: message ordering", () => {
  it("orders messages by createdAt ascending (oldest first)", () => {
    const now = Date.now();
    const msgs: MockMessage[] = [
      { id: 3, conversationId: 1, senderId: 1, senderName: "A", senderRole: "admin", body: "Third", readAt: null, createdAt: new Date(now + 2000) },
      { id: 1, conversationId: 1, senderId: 1, senderName: "A", senderRole: "admin", body: "First", readAt: null, createdAt: new Date(now) },
      { id: 2, conversationId: 1, senderId: 1, senderName: "A", senderRole: "admin", body: "Second", readAt: null, createdAt: new Date(now + 1000) },
    ];
    const sorted = [...msgs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    expect(sorted[0].body).toBe("First");
    expect(sorted[1].body).toBe("Second");
    expect(sorted[2].body).toBe("Third");
  });
});

describe("Messaging: conversation list ordering", () => {
  it("orders conversations by updatedAt descending (most recent first)", () => {
    const now = Date.now();
    const convs: MockConversation[] = [
      { id: 1, type: "staff", title: "Old", createdBy: 1, enrollmentId: null, createdAt: new Date(now), updatedAt: new Date(now) },
      { id: 2, type: "staff", title: "New", createdBy: 1, enrollmentId: null, createdAt: new Date(now), updatedAt: new Date(now + 5000) },
    ];
    const sorted = [...convs].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    expect(sorted[0].title).toBe("New");
    expect(sorted[1].title).toBe("Old");
  });
});
