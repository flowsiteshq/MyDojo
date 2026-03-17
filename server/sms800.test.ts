import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizePhone, sendSms, validate800Credentials } from "./sms800";

// ─── normalizePhone ──────────────────────────────────────────────────────────

describe("normalizePhone", () => {
  it("formats a 10-digit US number to E.164", () => {
    expect(normalizePhone("2815551234")).toBe("+12815551234");
  });

  it("formats a formatted US number with dashes", () => {
    expect(normalizePhone("281-555-1234")).toBe("+12815551234");
  });

  it("formats a number with parentheses and spaces", () => {
    expect(normalizePhone("(281) 555-1234")).toBe("+12815551234");
  });

  it("handles 11-digit number starting with 1", () => {
    expect(normalizePhone("12815551234")).toBe("+12815551234");
  });

  it("passes through an already-formatted E.164 number", () => {
    expect(normalizePhone("+12815551234")).toBe("+12815551234");
  });
});

// ─── sendSms ─────────────────────────────────────────────────────────────────

describe("sendSms", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns error when EIGHT_HUNDRED_API_KEY is missing", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "");
    vi.stubEnv("EIGHT_HUNDRED_FROM_NUMBER", "+18775555555");
    const result = await sendSms({ to: "+12815551234", message: "Test" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("EIGHT_HUNDRED_API_KEY");
  });

  it("returns error when EIGHT_HUNDRED_FROM_NUMBER is missing", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "test-key");
    vi.stubEnv("EIGHT_HUNDRED_FROM_NUMBER", "");
    const result = await sendSms({ to: "+12815551234", message: "Test" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("EIGHT_HUNDRED_FROM_NUMBER");
  });

  it("calls the 800.com API with correct payload structure", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "test-key");
    vi.stubEnv("EIGHT_HUNDRED_FROM_NUMBER", "+18775555555");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: "msg_123" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await sendSms({
      to: "2815551234",
      message: "Hello from MyDojo!",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("msg_123");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.800.com/message");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body);
    expect(body.sender).toBe("+18775555555");
    expect(body.recipient).toBe("+12815551234");
    expect(body.message).toBe("Hello from MyDojo!");
  });

  it("returns error when API returns non-200", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "bad-key");
    vi.stubEnv("EIGHT_HUNDRED_FROM_NUMBER", "+18775555555");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "Unauthenticated" }),
    }));

    const result = await sendSms({ to: "+12815551234", message: "Test" });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles network errors gracefully", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "test-key");
    vi.stubEnv("EIGHT_HUNDRED_FROM_NUMBER", "+18775555555");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const result = await sendSms({ to: "+12815551234", message: "Test" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });
});

// ─── validate800Credentials ──────────────────────────────────────────────────

describe("validate800Credentials", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when API key is missing", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "");
    const valid = await validate800Credentials();
    expect(valid).toBe(false);
  });

  it("returns true when API responds with 200", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "valid-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200 }));
    const valid = await validate800Credentials();
    expect(valid).toBe(true);
  });

  it("returns false when API responds with 401", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "invalid-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401 }));
    const valid = await validate800Credentials();
    expect(valid).toBe(false);
  });
});
