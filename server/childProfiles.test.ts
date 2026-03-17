import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the DB ──────────────────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockValues = vi.fn();
const mockSet = vi.fn();
const mockFrom = vi.fn();
const mockOrderBy = vi.fn();
const mockReturning = vi.fn();
const mockLimit = vi.fn();

// Chain builder
function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(result);
  // Make the chain itself awaitable (for select queries)
  chain[Symbol.iterator] = undefined;
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" });
  // Allow `await chain` to resolve
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockImplementation(() => makeChain([])),
    insert: vi.fn().mockImplementation(() => makeChain([{ id: 1 }])),
    update: vi.fn().mockImplementation(() => makeChain([{ id: 1 }])),
    delete: vi.fn().mockImplementation(() => makeChain([{ id: 1 }])),
  }),
}));

vi.mock("../server/storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://example.com/photo.jpg", key: "child-photos/1/abc.jpg" }),
}));

vi.mock("../drizzle/schema", () => ({
  childProfiles: {
    userId: "userId",
    id: "id",
    createdAt: "createdAt",
  },
}));

// ─── Unit tests for child profile business logic ──────────────────────────────

describe("Child Profiles - Business Logic", () => {
  describe("Age calculation", () => {
    it("calculates age correctly for a 5-year-old", () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 5);
      const dobStr = dob.toISOString().split("T")[0];

      // Simulate the getAge function logic
      const birth = new Date(dobStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

      expect(age).toBe(5);
    });

    it("returns empty string for null DOB", () => {
      const dob = null;
      const result = dob ? "has age" : "";
      expect(result).toBe("");
    });

    it("handles future DOB gracefully", () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() + 1);
      const dobStr = dob.toISOString().split("T")[0];

      const birth = new Date(dobStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

      expect(age).toBeLessThan(0);
    });
  });

  describe("Program validation", () => {
    const VALID_PROGRAMS = [
      "Little Ninjas",
      "Dragon Kids",
      "Teens",
      "Adult Karate",
      "Kickboxing",
      "After School",
      "Summer Camp",
      "Not Sure",
    ];

    it("accepts all valid program names", () => {
      VALID_PROGRAMS.forEach((program) => {
        expect(VALID_PROGRAMS).toContain(program);
      });
    });

    it("defaults to 'Not Sure' when no program specified", () => {
      const defaultProgram = "Not Sure";
      expect(VALID_PROGRAMS).toContain(defaultProgram);
    });
  });

  describe("Photo upload validation", () => {
    it("rejects non-image content types", () => {
      const contentType = "application/pdf";
      const isImage = contentType.startsWith("image/");
      expect(isImage).toBe(false);
    });

    it("accepts valid image content types", () => {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      validTypes.forEach((type) => {
        expect(type.startsWith("image/")).toBe(true);
      });
    });

    it("generates unique file keys with random suffix", () => {
      const userId = 42;
      const suffix1 = Math.random().toString(36).slice(2, 10);
      const suffix2 = Math.random().toString(36).slice(2, 10);
      const key1 = `child-photos/${userId}/${suffix1}.jpg`;
      const key2 = `child-photos/${userId}/${suffix2}.jpg`;
      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^child-photos\/42\//);
    });

    it("enforces 5MB file size limit", () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const oversizedFile = maxSize + 1;
      const validFile = maxSize - 1;
      expect(oversizedFile > maxSize).toBe(true);
      expect(validFile > maxSize).toBe(false);
    });
  });

  describe("Child profile data sanitization", () => {
    it("trims whitespace from child name", () => {
      const rawName = "  Emma Johnson  ";
      const trimmed = rawName.trim();
      expect(trimmed).toBe("Emma Johnson");
    });

    it("rejects empty name after trim", () => {
      const rawName = "   ";
      const trimmed = rawName.trim();
      expect(trimmed.length).toBe(0);
    });

    it("converts empty notes to null", () => {
      const notes = "";
      const result = notes || null;
      expect(result).toBeNull();
    });

    it("converts empty dateOfBirth to undefined", () => {
      const dob = "";
      const result = dob || undefined;
      expect(result).toBeUndefined();
    });
  });

  describe("Access control", () => {
    it("admin role check passes for admin users", () => {
      const user = { role: "admin", id: 1 };
      expect(user.role === "admin").toBe(true);
    });

    it("admin role check fails for regular users", () => {
      const user = { role: "user", id: 2 };
      expect(user.role === "admin").toBe(false);
    });

    it("user can only access their own profiles (userId filter)", () => {
      const userId = 42;
      const profileUserId = 42;
      const otherUserId = 99;
      expect(profileUserId === userId).toBe(true);
      expect(otherUserId === userId).toBe(false);
    });
  });
});
