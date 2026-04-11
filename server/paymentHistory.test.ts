import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock Stripe
vi.mock("stripe", () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    paymentIntents: {
      list: vi.fn().mockResolvedValue({ data: [] }),
    },
    invoices: {
      list: vi.fn().mockResolvedValue({ data: [] }),
    },
  }));
  return { default: MockStripe };
});

import { getDb } from "./db";
import { getMemberPaymentHistory } from "./memberDashboard";

/**
 * Build a mock DB that:
 * - First select() call (enrollments, no .limit()) resolves at .orderBy()
 * - Second select() call (webhookEvents, has .limit()) resolves at .limit()
 */
function buildMockDb(enrollmentRows: any[], webhookRows: any[]) {
  let selectCallCount = 0;

  const enrollChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(enrollmentRows),
    limit: vi.fn().mockResolvedValue(webhookRows),
  };

  const webhookChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(webhookRows),
  };

  const db = {
    select: vi.fn().mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return enrollChain;
      return webhookChain;
    }),
  };
  return db;
}

describe("getMemberPaymentHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no enrollments found", async () => {
    const db = buildMockDb([], []);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await getMemberPaymentHistory("noone@example.com");
    expect(result).toEqual([]);
  });

  it("returns down payment from enrollment when no webhook events", async () => {
    const enrollmentRow = {
      id: 1,
      fluidpaySubscriptionId: null,
      fluidpayCustomerId: null,
      downPaymentAmount: "199.00",
      createdAt: new Date("2024-01-15"),
    };

    const db = buildMockDb([enrollmentRow], []);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await getMemberPaymentHistory("parent@example.com");

    const downPayment = result.find(p => p.description === "Enrollment / Down Payment");
    expect(downPayment).toBeDefined();
    expect(downPayment?.amount).toBe(199);
    expect(downPayment?.currency).toBe("USD");
    expect(downPayment?.status).toBe("paid");
  });

  it("returns FluidPay webhook events sorted by date descending", async () => {
    const enrollmentRow = {
      id: 1,
      fluidpaySubscriptionId: "sub_fp_123",
      fluidpayCustomerId: "cust_fp_456",
      downPaymentAmount: "0",
      createdAt: new Date("2024-01-01"),
    };

    const webhookRow1 = {
      id: 10,
      fpSubscriptionId: "sub_fp_123",
      amountCents: 9900,
      eventType: "transaction_update",
      eventStatus: "approved",
      createdAt: new Date("2024-03-01"),
    };
    const webhookRow2 = {
      id: 11,
      fpSubscriptionId: "sub_fp_123",
      amountCents: 9900,
      eventType: "transaction_update",
      eventStatus: "approved",
      createdAt: new Date("2024-02-01"),
    };

    const db = buildMockDb([enrollmentRow], [webhookRow1, webhookRow2]);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await getMemberPaymentHistory("member@example.com");

    const monthlyPayments = result.filter(p => p.description === "Monthly Membership");
    expect(monthlyPayments.length).toBe(2);

    // Should be sorted newest first
    expect(monthlyPayments[0].created.getTime()).toBeGreaterThan(monthlyPayments[1].created.getTime());
    expect(monthlyPayments[0].amount).toBe(99);
  });

  it("deduplicates payments with same id", async () => {
    const enrollmentRow = {
      id: 1,
      fluidpaySubscriptionId: null,
      fluidpayCustomerId: null,
      downPaymentAmount: "150.00",
      createdAt: new Date("2024-01-01"),
    };

    const db = buildMockDb([enrollmentRow], []);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await getMemberPaymentHistory("dup@example.com");

    const ids = result.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("skips webhook events with zero or null amountCents", async () => {
    const enrollmentRow = {
      id: 1,
      fluidpaySubscriptionId: "sub_fp_789",
      fluidpayCustomerId: "cust_fp_789",
      downPaymentAmount: "0",
      createdAt: new Date("2024-01-01"),
    };

    const webhookRows = [
      { id: 20, fpSubscriptionId: "sub_fp_789", amountCents: 0, eventType: "transaction_update", eventStatus: "approved", createdAt: new Date("2024-03-01") },
      { id: 21, fpSubscriptionId: "sub_fp_789", amountCents: null, eventType: "transaction_update", eventStatus: "approved", createdAt: new Date("2024-02-01") },
      { id: 22, fpSubscriptionId: "sub_fp_789", amountCents: 4900, eventType: "transaction_update", eventStatus: "approved", createdAt: new Date("2024-01-15") },
    ];

    const db = buildMockDb([enrollmentRow], webhookRows);
    vi.mocked(getDb).mockResolvedValue(db as any);

    const result = await getMemberPaymentHistory("member2@example.com");

    // Only the $49 payment should appear
    expect(result.length).toBe(1);
    expect(result[0].amount).toBe(49);
  });
});
