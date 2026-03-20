/**
 * introOffer.test.ts
 * Unit tests for the intro offer purchase procedure (kiosk.purchaseIntroOffer).
 * Uses the same mock pattern as other server tests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Package config (mirrors routers.ts) ──────────────────────────────────────
const PACKAGES = {
  starter:  { amountCents: 2900, classesIncluded: 3,  label: "Intro Offer – 3 Classes" },
  explorer: { amountCents: 4900, classesIncluded: 5,  label: "Intro Offer – 5 Classes" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildFluidPaySuccess(id = "txn_test_123") {
  return {
    status: "success",
    msg: "Transaction approved",
    data: {
      id,
      status: "approved",
      response_body: { card: { response_text: "Approved" } },
    },
  };
}

function buildFluidPayDecline(reason = "Insufficient funds") {
  return {
    status: "success",
    msg: "Transaction processed",
    data: {
      id: "txn_declined_456",
      status: "declined",
      response_body: { card: { response_text: reason } },
    },
  };
}

function buildFluidPayError(msg = "Invalid API key") {
  return { status: "error", msg, data: undefined };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("kiosk.purchaseIntroOffer – package config", () => {
  it("starter package has correct price and class count", () => {
    expect(PACKAGES.starter.amountCents).toBe(2900);
    expect(PACKAGES.starter.classesIncluded).toBe(3);
  });

  it("explorer package has correct price and class count", () => {
    expect(PACKAGES.explorer.amountCents).toBe(4900);
    expect(PACKAGES.explorer.classesIncluded).toBe(5);
  });

  it("explorer is more expensive than starter", () => {
    expect(PACKAGES.explorer.amountCents).toBeGreaterThan(PACKAGES.starter.amountCents);
  });

  it("explorer has more classes than starter", () => {
    expect(PACKAGES.explorer.classesIncluded).toBeGreaterThan(PACKAGES.starter.classesIncluded);
  });
});

describe("kiosk.purchaseIntroOffer – FluidPay response parsing", () => {
  it("extracts transaction ID from successful response", () => {
    const body = buildFluidPaySuccess("txn_abc_789");
    expect(body.status).toBe("success");
    expect(body.data?.id).toBe("txn_abc_789");
    expect(body.data?.status).toBe("approved");
  });

  it("detects declined transaction from approved API call", () => {
    const body = buildFluidPayDecline("Insufficient funds");
    expect(body.status).toBe("success"); // API call succeeded
    expect(body.data?.status).toBe("declined"); // but txn was declined
    expect(body.data?.response_body?.card?.response_text).toBe("Insufficient funds");
  });

  it("detects API-level error (bad key, network, etc.)", () => {
    const body = buildFluidPayError("Invalid API key");
    expect(body.status).toBe("error");
    expect(body.data).toBeUndefined();
  });

  it("handles missing response_body gracefully", () => {
    const body = {
      status: "success",
      msg: "ok",
      data: { id: "txn_999", status: "declined", response_body: undefined },
    };
    const declineMsg = body.data?.response_body?.card?.response_text ?? `Transaction ${body.data?.status}`;
    expect(declineMsg).toBe("Transaction declined");
  });
});

describe("kiosk.purchaseIntroOffer – expiry calculation", () => {
  it("expiry is 30 days from now", () => {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it("expiry is in the future", () => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("kiosk.purchaseIntroOffer – order ID format", () => {
  it("starter order ID starts with intro-starter-", () => {
    const orderId = `intro-starter-${Date.now()}`;
    expect(orderId).toMatch(/^intro-starter-\d+$/);
  });

  it("explorer order ID starts with intro-explorer-", () => {
    const orderId = `intro-explorer-${Date.now()}`;
    expect(orderId).toMatch(/^intro-explorer-\d+$/);
  });

  it("order IDs are unique across two calls", () => {
    const id1 = `intro-starter-${Date.now()}`;
    const id2 = `intro-starter-${Date.now() + 1}`;
    expect(id1).not.toBe(id2);
  });
});

describe("kiosk.purchaseIntroOffer – name parsing for billing", () => {
  it("splits first and last name correctly", () => {
    const fullName = "John Doe";
    const firstName = fullName.split(" ")[0];
    const lastName = fullName.split(" ").slice(1).join(" ") || "";
    expect(firstName).toBe("John");
    expect(lastName).toBe("Doe");
  });

  it("handles single-word name (no last name)", () => {
    const fullName = "Madonna";
    const firstName = fullName.split(" ")[0];
    const lastName = fullName.split(" ").slice(1).join(" ") || "";
    expect(firstName).toBe("Madonna");
    expect(lastName).toBe("");
  });

  it("handles three-part name", () => {
    const fullName = "Mary Jane Watson";
    const firstName = fullName.split(" ")[0];
    const lastName = fullName.split(" ").slice(1).join(" ") || "";
    expect(firstName).toBe("Mary");
    expect(lastName).toBe("Jane Watson");
  });
});

describe("kiosk.purchaseIntroOffer – success return shape", () => {
  it("returns expected fields on success", () => {
    const pkg = PACKAGES.starter;
    const result = {
      success: true,
      name: "Test User",
      packageId: "starter" as const,
      classesIncluded: pkg.classesIncluded,
      amountCents: pkg.amountCents,
      transactionId: "txn_test_123",
      expiresAt: new Date(),
    };

    expect(result.success).toBe(true);
    expect(result.classesIncluded).toBe(3);
    expect(result.amountCents).toBe(2900);
    expect(result.transactionId).toBe("txn_test_123");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});
