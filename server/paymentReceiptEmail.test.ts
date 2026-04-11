import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./emailService", () => ({
  sendRenewalSuccessEmail: vi.fn().mockResolvedValue(true),
  sendPaymentFailureEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock("./_core/env", () => ({
  ENV: {
    FLUIDPAY_WEBHOOK_SECRET: "",
    RESEND_API_KEY: "re_test_key",
    EMAIL_FROM: "noreply@mydojoma.com",
  },
}));

import { getDb } from "./db";
import { sendRenewalSuccessEmail } from "./emailService";
import { handleFluidPayWebhook } from "./fluidpayWebhook";
import type { Request, Response } from "express";

function buildMockDb(enrollmentRow: any, pkgRow?: any) {
  let selectCount = 0;
  const db = {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({ insertId: 99 }) }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) }),
    select: vi.fn().mockImplementation(() => {
      selectCount++;
      const rows = selectCount === 1
        ? [enrollmentRow]   // enrollment lookup
        : pkgRow ? [pkgRow] : []; // package lookup
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(rows),
      };
    }),
  };
  return db;
}

function buildWebhookRequest(payload: object): Request {
  const body = Buffer.from(JSON.stringify(payload));
  return {
    body,
    headers: { signature: "" },
  } as unknown as Request;
}

function buildMockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

const baseEnrollment = {
  id: 1,
  customerEmail: "parent@example.com",
  customerName: "Jane Parent",
  studentName: "Tim Student",
  membershipPackageId: 5,
  fluidpaySubscriptionId: "sub_fp_abc",
  status: "active",
};

describe("FluidPay Webhook — Payment Receipt Email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends receipt email on 'approved' status", async () => {
    const db = buildMockDb(baseEnrollment, { name: "Black Belt Program" });
    vi.mocked(getDb).mockResolvedValue(db as any);

    const payload = {
      transaction_id: "tx_001",
      type: "transaction_update",
      status: "approved",
      action_at: "2024-04-01T12:00:00Z",
      data: { amount: 9900, subscription_id: "sub_fp_abc" },
    };

    const req = buildWebhookRequest(payload);
    const res = buildMockResponse();
    await handleFluidPayWebhook(req, res);

    expect(sendRenewalSuccessEmail).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(sendRenewalSuccessEmail).mock.calls[0][0];
    expect(callArgs.toEmail).toBe("parent@example.com");
    expect(callArgs.amountCharged).toBe(99);
    expect(callArgs.packageName).toBe("Black Belt Program");
    expect(callArgs.transactionId).toBe("tx_001");
    expect(callArgs.paymentDate).toBeInstanceOf(Date);
  });

  it("sends receipt email on 'settled' status", async () => {
    const db = buildMockDb(baseEnrollment);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const payload = {
      transaction_id: "tx_002",
      type: "transaction_create",
      status: "settled",
      action_at: "2024-04-02T10:00:00Z",
      data: { amount: 14900, subscription_id: "sub_fp_abc" },
    };

    await handleFluidPayWebhook(buildWebhookRequest(payload), buildMockResponse());
    expect(sendRenewalSuccessEmail).toHaveBeenCalledOnce();
    expect(vi.mocked(sendRenewalSuccessEmail).mock.calls[0][0].amountCharged).toBe(149);
  });

  it("does NOT send receipt email on 'declined' status", async () => {
    const db = buildMockDb(baseEnrollment);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const payload = {
      transaction_id: "tx_003",
      type: "transaction_update",
      status: "declined",
      action_at: "2024-04-03T10:00:00Z",
      data: { amount: 9900, subscription_id: "sub_fp_abc" },
    };

    await handleFluidPayWebhook(buildWebhookRequest(payload), buildMockResponse());
    expect(sendRenewalSuccessEmail).not.toHaveBeenCalled();
  });

  it("does NOT send receipt email when no subscription_id in payload", async () => {
    const db = buildMockDb(baseEnrollment);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const payload = {
      transaction_id: "tx_004",
      type: "transaction_update",
      status: "approved",
      action_at: "2024-04-04T10:00:00Z",
      data: { amount: 9900 }, // no subscription_id
    };

    await handleFluidPayWebhook(buildWebhookRequest(payload), buildMockResponse());
    expect(sendRenewalSuccessEmail).not.toHaveBeenCalled();
  });

  it("uses student name in receipt when different from customer name", async () => {
    const db = buildMockDb(baseEnrollment, { name: "Foundation Program" });
    vi.mocked(getDb).mockResolvedValue(db as any);

    const payload = {
      transaction_id: "tx_005",
      type: "transaction_update",
      status: "approved",
      action_at: "2024-04-05T10:00:00Z",
      data: { amount: 7900, subscription_id: "sub_fp_abc" },
    };

    await handleFluidPayWebhook(buildWebhookRequest(payload), buildMockResponse());
    const callArgs = vi.mocked(sendRenewalSuccessEmail).mock.calls[0][0];
    expect(callArgs.studentName).toBe("Tim Student");
    expect(callArgs.customerName).toBe("Jane Parent");
  });
});
