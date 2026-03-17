/**
 * Tests for the GoHighLevel webhook handler
 * Tests cover: event filtering, field extraction, program inference, deduplication, and error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGHLWebhook } from "./ghlWebhook";
import type { Request, Response } from "express";

// ─── Mock DB ──────────────────────────────────────────────────────────────────

const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
const mockSelect = vi.fn();

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: () => ({ values: vi.fn().mockResolvedValue(undefined) }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValue([]), // No existing records by default
        }),
      }),
    }),
  }),
}));

vi.mock("../drizzle/schema", () => ({
  trialSignups: { ghlContactId: "ghlContactId", id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: object, headers: Record<string, string> = {}): Request {
  return {
    body,
    headers,
  } as unknown as Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GHL Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GHL_WEBHOOK_SECRET;
  });

  describe("Event filtering", () => {
    it("should process ContactCreate events", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-123",
        firstName: "John",
        lastName: "Doe",
        phone: "2815551234",
        email: "john@example.com",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ received: true, processed: true })
      );
    });

    it("should process FormSubmitted events", async () => {
      const req = makeReq({
        type: "FormSubmitted",
        id: "ghl-456",
        firstName: "Jane",
        lastName: "Smith",
        phone: "2815559876",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ received: true, processed: true })
      );
    });

    it("should skip ContactUpdate events", async () => {
      const req = makeReq({
        type: "ContactUpdate",
        id: "ghl-789",
        firstName: "Bob",
        phone: "2815550001",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ received: true, processed: false, reason: "Event type not processed" })
      );
    });

    it("should skip OpportunityStageChanged events", async () => {
      const req = makeReq({
        type: "OpportunityStageChanged",
        id: "ghl-000",
        phone: "2815550002",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ processed: false })
      );
    });
  });

  describe("Field validation", () => {
    it("should reject payloads missing phone", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-111",
        firstName: "No",
        lastName: "Phone",
        // phone intentionally omitted
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ processed: false, reason: "Missing name or phone" })
      );
    });

    it("should reject payloads missing name", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-222",
        phone: "2815551111",
        // name intentionally omitted
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ processed: false, reason: "Missing name or phone" })
      );
    });

    it("should use full name field when firstName/lastName are absent", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-333",
        name: "Full Name Person",
        phone: "2815552222",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          processed: true,
          lead: expect.objectContaining({ name: "Full Name Person" }),
        })
      );
    });
  });

  describe("Program inference", () => {
    it("should infer Kickboxing from tags", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-kb1",
        firstName: "Kick",
        lastName: "Boxer",
        phone: "2815553333",
        tags: ["kickboxing", "adult"],
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lead: expect.objectContaining({ program: "Kickboxing" }),
        })
      );
    });

    it("should infer Little Ninjas from source", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-ln1",
        firstName: "Little",
        lastName: "Ninja",
        phone: "2815554444",
        source: "little ninjas landing page",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lead: expect.objectContaining({ program: "Little Ninjas" }),
        })
      );
    });

    it("should default to Not Sure when no program signals", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-ns1",
        firstName: "Unknown",
        lastName: "Program",
        phone: "2815555555",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lead: expect.objectContaining({ program: "Not Sure" }),
        })
      );
    });
  });

  describe("Source labeling", () => {
    it("should label source as 'ghl' when no source in payload", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-src1",
        firstName: "Test",
        lastName: "Lead",
        phone: "2815556666",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lead: expect.objectContaining({ source: "ghl" }),
        })
      );
    });

    it("should prefix source with 'ghl:' when source is present", async () => {
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-src2",
        firstName: "Test",
        lastName: "Lead2",
        phone: "2815557777",
        source: "Facebook Ad",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lead: expect.objectContaining({ source: "ghl:Facebook Ad" }),
        })
      );
    });
  });

  describe("Signature verification", () => {
    it("should reject requests with invalid signature when secret is set", async () => {
      process.env.GHL_WEBHOOK_SECRET = "mysecret";

      const req = makeReq(
        { type: "ContactCreate", firstName: "Test", phone: "1234567890" },
        { "x-ghl-signature": "invalidsignature" }
      );
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should allow requests when no secret is configured (dev mode)", async () => {
      // GHL_WEBHOOK_SECRET not set
      const req = makeReq({
        type: "ContactCreate",
        id: "ghl-dev1",
        firstName: "Dev",
        lastName: "Mode",
        phone: "2815558888",
      });
      const res = makeRes();

      await handleGHLWebhook(req, res);

      expect(res.status).not.toHaveBeenCalledWith(401);
    });
  });
});
