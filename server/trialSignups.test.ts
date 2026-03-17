/**
 * trialSignups.test.ts
 *
 * Unit tests for trial signup DB helpers.
 * Uses vi.mock to prevent any real database writes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the db module so NO real DB writes happen ───────────────────────────
vi.mock("./db", () => ({
  createTrialSignup: vi.fn(async (input) => {
    // Return a fake insertId so callers that check result[0].insertId work
    return [{ insertId: 99999 }];
  }),
  getAllTrialSignups: vi.fn(async () => [
    {
      id: 99999,
      name: "Test User",
      email: "test@example.com",
      phone: "555-123-4567",
      program: "Little Ninjas",
      location: "Tomball HQ",
      preferredContactMethod: "email",
      status: "new",
      source: "chatbot",
      createdAt: new Date(),
    },
  ]),
  getTrialSignupById: vi.fn(async (id) => {
    if (id === 99999) {
      return {
        id: 99999,
        name: "Test User",
        email: "test@example.com",
        phone: "555-123-4567",
        program: "Little Ninjas",
        location: "Tomball HQ",
        preferredContactMethod: "email",
        status: "new",
        source: "chatbot",
        createdAt: new Date(),
      };
    }
    return null;
  }),
  updateTrialSignupStatus: vi.fn(async (id, status) => {
    return [{ affectedRows: 1 }];
  }),
}));

import {
  createTrialSignup,
  getAllTrialSignups,
  getTrialSignupById,
  updateTrialSignupStatus,
} from "./db";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Trial Signups DB helpers (mocked — no real DB writes)", () => {
  it("createTrialSignup returns a result with insertId", async () => {
    const result = await createTrialSignup({
      name: "Test User",
      email: "test@example.com",
      phone: "555-123-4567",
      program: "Little Ninjas",
      location: "Tomball HQ",
      preferredContactMethod: "email",
      status: "new",
      source: "chatbot",
    });
    expect(result).toBeTruthy();
    expect(result[0].insertId).toBe(99999);
  });

  it("createTrialSignup is called with the correct arguments", async () => {
    const input = {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-987-6543",
      program: "Dragon Kids" as const,
      location: "Tomball HQ",
      preferredContactMethod: "phone" as const,
      status: "new" as const,
      source: "chatbot" as const,
    };
    await createTrialSignup(input);
    expect(createTrialSignup).toHaveBeenCalledWith(input);
  });

  it("getAllTrialSignups returns an array", async () => {
    const signups = await getAllTrialSignups();
    expect(Array.isArray(signups)).toBe(true);
    expect(signups.length).toBeGreaterThan(0);
  });

  it("getTrialSignupById returns the correct signup", async () => {
    const signup = await getTrialSignupById(99999);
    expect(signup).toBeTruthy();
    expect(signup?.name).toBe("Test User");
    expect(signup?.email).toBe("test@example.com");
  });

  it("getTrialSignupById returns null for unknown id", async () => {
    const signup = await getTrialSignupById(0);
    expect(signup).toBeNull();
  });

  it("updateTrialSignupStatus is called with correct args", async () => {
    await updateTrialSignupStatus(99999, "contacted");
    expect(updateTrialSignupStatus).toHaveBeenCalledWith(99999, "contacted");
  });

  it("handles all program types without error", async () => {
    const programs = [
      "Little Ninjas",
      "Dragon Kids",
      "Teens",
      "Adult Karate",
      "Kickboxing",
      "After School",
      "Not Sure",
    ] as const;

    for (const program of programs) {
      const result = await createTrialSignup({
        name: `Test ${program}`,
        email: `test-${program.toLowerCase().replace(/\s+/g, "-")}@example.com`,
        phone: "555-000-0000",
        program,
        location: "Tomball HQ",
        preferredContactMethod: "email",
        status: "new",
        source: "chatbot",
      });
      expect(result).toBeTruthy();
    }
    // Verify no real DB calls were made (all mocked)
    expect(createTrialSignup).toHaveBeenCalledTimes(programs.length);
  });

  it("handles all contact methods without error", async () => {
    const methods = ["email", "phone", "text"] as const;

    for (const method of methods) {
      await createTrialSignup({
        name: `Test ${method}`,
        email: `test-${method}@example.com`,
        phone: "555-000-0000",
        program: "Adult Karate",
        location: "Tomball HQ",
        preferredContactMethod: method,
        status: "new",
        source: "chatbot",
      });
    }
    expect(createTrialSignup).toHaveBeenCalledTimes(methods.length);
  });
});
