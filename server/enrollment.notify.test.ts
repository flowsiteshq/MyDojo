/**
 * Tests for notifyStaffNewEnrollment
 * Verifies that the staff enrollment notification function handles
 * success, failure, and no-staff-configured scenarios correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock the sms800 module
vi.mock("./sms800", () => ({
  sendSms: vi.fn(),
}));

import { getDb } from "./db";
import { sendSms } from "./sms800";
import { notifyStaffNewEnrollment, type NewEnrollmentInfo } from "./notifyStaffNewEnrollment";

const mockEnrollment: NewEnrollmentInfo = {
  studentName: "Jane Doe",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  customerPhone: "2815551234",
  packageName: "Foundation",
  amountCharged: 248.0,
  program: "Karate",
};

describe("notifyStaffNewEnrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send SMS to all staff with enrollSmsNotify=1", async () => {
    const mockStaff = [
      { id: 1, name: "Coach Vincent", phone: "2815550001", enrollSmsNotify: 1 },
      { id: 2, name: "Staff Member", phone: "2815550002", enrollSmsNotify: 1 },
    ];

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStaff),
    };
    (getDb as any).mockResolvedValue(mockDb);
    (sendSms as any).mockResolvedValue({ success: true });

    await notifyStaffNewEnrollment(mockEnrollment);

    expect(sendSms).toHaveBeenCalledTimes(2);
    const firstCall = (sendSms as any).mock.calls[0][0];
    expect(firstCall.to).toBe("2815550001");
    expect(firstCall.message).toContain("New Enrollment");
    expect(firstCall.message).toContain("Jane Doe");
    expect(firstCall.message).toContain("$248.00");
  });

  it("should not send SMS when no staff are configured", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    (getDb as any).mockResolvedValue(mockDb);

    await notifyStaffNewEnrollment(mockEnrollment);

    expect(sendSms).not.toHaveBeenCalled();
  });

  it("should not throw even if sendSms fails", async () => {
    const mockStaff = [
      { id: 1, name: "Coach Vincent", phone: "2815550001", enrollSmsNotify: 1 },
    ];
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStaff),
    };
    (getDb as any).mockResolvedValue(mockDb);
    (sendSms as any).mockRejectedValue(new Error("SMS API error"));

    // Should not throw
    await expect(notifyStaffNewEnrollment(mockEnrollment)).resolves.not.toThrow();
  });

  it("should not throw if db is unavailable", async () => {
    (getDb as any).mockResolvedValue(null);

    await expect(notifyStaffNewEnrollment(mockEnrollment)).resolves.not.toThrow();
    expect(sendSms).not.toHaveBeenCalled();
  });

  it("should include student name separately from customer name in message", async () => {
    const enrollmentWithDifferentStudent: NewEnrollmentInfo = {
      studentName: "Child Name",
      customerName: "Parent Name",
      customerEmail: "parent@example.com",
      packageName: "Foundation",
      amountCharged: 248.0,
    };

    const mockStaff = [
      { id: 1, name: "Coach", phone: "2815550001", enrollSmsNotify: 1 },
    ];
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStaff),
    };
    (getDb as any).mockResolvedValue(mockDb);
    (sendSms as any).mockResolvedValue({ success: true });

    await notifyStaffNewEnrollment(enrollmentWithDifferentStudent);

    const call = (sendSms as any).mock.calls[0][0];
    expect(call.message).toContain("Child Name");
    expect(call.message).toContain("Parent Name");
  });
});
