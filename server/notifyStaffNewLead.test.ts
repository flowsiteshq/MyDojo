/**
 * Tests for notifyStaffNewLead helper
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database and SMS modules
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./sms800", () => ({
  sendSms: vi.fn(),
}));

vi.mock("../drizzle/schema", () => ({
  users: { id: "id", role: "role", phone: "phone", leadSmsNotify: "leadSmsNotify" },
}));

import { getDb } from "./db";
import { sendSms } from "./sms800";
import { notifyStaffNewLead } from "./notifyStaffNewLead";

describe("notifyStaffNewLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends SMS to all staff with phones and notifications enabled", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: 1, name: "Alice", phone: "+18325551234", leadSmsNotify: 1 },
        { id: 2, name: "Bob", phone: "+18325555678", leadSmsNotify: 1 },
      ]),
    };
    (getDb as any).mockResolvedValue(mockDb);
    (sendSms as any).mockResolvedValue({ success: true, messageId: "msg_123" });

    await notifyStaffNewLead({
      name: "John Doe",
      phone: "+18325559999",
      program: "Kickboxing",
      source: "ghl:Facebook Ads",
    });

    expect(sendSms).toHaveBeenCalledTimes(2);
    const firstCall = (sendSms as any).mock.calls[0][0];
    expect(firstCall.to).toBe("+18325551234");
    expect(firstCall.message).toContain("John Doe");
    expect(firstCall.message).toContain("Kickboxing");
  });

  it("skips sending when no staff have phones", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    await notifyStaffNewLead({ name: "Jane Smith" });

    expect(sendSms).not.toHaveBeenCalled();
  });

  it("does not throw when SMS fails", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: 1, name: "Alice", phone: "+18325551234", leadSmsNotify: 1 },
      ]),
    };
    (getDb as any).mockResolvedValue(mockDb);
    (sendSms as any).mockResolvedValue({ success: false, error: "API error" });

    // Should not throw
    await expect(notifyStaffNewLead({ name: "Test Lead" })).resolves.toBeUndefined();
  });

  it("does not throw when db is unavailable", async () => {
    (getDb as any).mockResolvedValue(null);

    // Should not throw
    await expect(notifyStaffNewLead({ name: "Test Lead" })).resolves.toBeUndefined();
    expect(sendSms).not.toHaveBeenCalled();
  });

  it("includes phone, program, and source in message", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: 1, name: "Alice", phone: "+18325551234", leadSmsNotify: 1 },
      ]),
    };
    (getDb as any).mockResolvedValue(mockDb);
    (sendSms as any).mockResolvedValue({ success: true });

    await notifyStaffNewLead({
      name: "Maria Garcia",
      phone: "+18325550001",
      program: "Little Ninjas",
      source: "Facebook",
    });

    const call = (sendSms as any).mock.calls[0][0];
    expect(call.message).toContain("Maria Garcia");
    expect(call.message).toContain("+18325550001");
    expect(call.message).toContain("Little Ninjas");
    expect(call.message).toContain("Facebook");
  });
});
