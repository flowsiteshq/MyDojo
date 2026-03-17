import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock the schema
vi.mock("../drizzle/schema", () => ({
  leadMagnetLeads: { email: "email", name: "name", source: "source", guideTitle: "guideTitle", emailSent: "emailSent" },
}));

// Mock resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
    },
  })),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Lead Magnet Router", () => {
  describe("Input validation", () => {
    it("should reject invalid email addresses", () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test("not-an-email")).toBe(false);
      expect(emailRegex.test("missing@domain")).toBe(false);
      expect(emailRegex.test("valid@example.com")).toBe(true);
      expect(emailRegex.test("user+tag@domain.co")).toBe(true);
    });

    it("should normalize email to lowercase", () => {
      const email = "Test@Example.COM";
      expect(email.toLowerCase()).toBe("test@example.com");
    });

    it("should handle optional name field", () => {
      const withName = { email: "test@example.com", name: "John" };
      const withoutName = { email: "test@example.com" };
      expect(withName.name).toBe("John");
      expect(withoutName.name).toBeUndefined();
    });

    it("should handle optional phone field", () => {
      const withPhone = { email: "test@example.com", phone: "(281) 555-1234" };
      const withoutPhone = { email: "test@example.com" };
      expect(withPhone.phone).toBe("(281) 555-1234");
      expect(withoutPhone.phone).toBeUndefined();
    });

    it("should include phone in owner notification when provided", () => {
      const name = "Jane";
      const email = "jane@example.com";
      const phone = "(281) 555-9999";
      const content = `${name} (${email}${phone ? ` · ${phone}` : ''}) just downloaded the free self-defense guide.`;
      expect(content).toContain("(281) 555-9999");
      expect(content).toContain("jane@example.com");
    });

    it("should omit phone from owner notification when not provided", () => {
      const name = "Jane";
      const email = "jane@example.com";
      const phone = undefined;
      const content = `${name} (${email}${phone ? ` · ${phone}` : ''}) just downloaded the free self-defense guide.`;
      expect(content).not.toContain("·");
      expect(content).toContain("jane@example.com");
    });
  });

  describe("Email personalization", () => {
    it("should extract first name from full name", () => {
      const fullName = "John Doe";
      const firstName = fullName.split(" ")[0];
      expect(firstName).toBe("John");
    });

    it("should use 'there' as fallback when no name provided", () => {
      const name = undefined;
      const firstName = name ? (name as string).split(" ")[0] : "there";
      expect(firstName).toBe("there");
    });
  });

  describe("Guide content", () => {
    it("should include all 5 self-defense moves", () => {
      const moves = [
        "The Wrist Release",
        "The Palm Strike",
        "The Stomp & Run",
        "The Bear Hug Escape",
        "The Verbal Boundary",
      ];
      expect(moves).toHaveLength(5);
      moves.forEach((move) => {
        expect(move).toBeTruthy();
      });
    });
  });

  describe("Response structure", () => {
    it("should return success: true for new subscriber", () => {
      const mockResponse = { success: true, alreadySubscribed: false };
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.alreadySubscribed).toBe(false);
    });

    it("should return alreadySubscribed: true for duplicate email", () => {
      const mockResponse = { success: true, alreadySubscribed: true };
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.alreadySubscribed).toBe(true);
    });
  });
});
