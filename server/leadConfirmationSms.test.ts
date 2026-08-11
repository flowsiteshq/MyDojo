import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLeadConfirmationSms,
  isValidSmsPhone,
  sendLeadConfirmationSms,
} from "./leadConfirmationSms";

describe("lead confirmation SMS", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("accepts standard U.S. phone formats and rejects malformed imported values", () => {
    expect(isValidSmsPhone("281-555-1234")).toBe(true);
    expect(isValidSmsPhone("+1 (281) 555-1234")).toBe(true);
    expect(isValidSmsPhone("left a text")).toBe(false);
    expect(isValidSmsPhone("")).toBe(false);
  });

  it("builds a scheduled appointment confirmation with opt-out language", () => {
    const message = buildLeadConfirmationSms({
      name: "Taylor Smith",
      program: "Dragon Kids",
      scheduledTime: new Date("2026-08-15T17:00:00"),
    });

    expect(message).toContain("Hi Taylor!");
    expect(message).toContain("Dragon Kids");
    expect(message).toContain("Your appointment is reserved");
    expect(message).toContain("Reply STOP to unsubscribe.");
  });

  it("does not call the SMS provider when the form phone number is invalid", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendLeadConfirmationSms({
      name: "No Phone",
      phone: "left a text",
      program: "Not Sure",
    });

    expect(result.success).toBe(false);
    expect(result.attempted).toBe(false);
    expect(result.error).toContain("valid U.S. mobile number");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a normalized confirmation text through 800.com", async () => {
    vi.stubEnv("EIGHT_HUNDRED_API_KEY", "test-key");
    vi.stubEnv("EIGHT_HUNDRED_FROM_NUMBER", "+18775555555");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "confirmation_123" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendLeadConfirmationSms({
      name: "Riley Jones",
      phone: "2815551234",
      program: "Kickboxing",
    });

    expect(result).toMatchObject({
      attempted: true,
      success: true,
      normalizedPhone: "+12815551234",
      messageId: "confirmation_123",
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.recipient).toBe("+12815551234");
    expect(body.message).toContain("Hi Riley!");
  });
});
