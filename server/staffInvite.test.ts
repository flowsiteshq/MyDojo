import { describe, it, expect } from "vitest";
import { randomBytes } from "crypto";

// Utility functions extracted for testing (mirrors logic in routers.ts)
function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

function getInviteExpiry(hoursFromNow = 72): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return expiry;
}

function isInviteExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

function buildInviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/staff-invite?token=${token}`;
}

describe("Staff Invite Token Logic", () => {
  it("generates a 64-character hex token", () => {
    const token = generateInviteToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("generates unique tokens on each call", () => {
    const token1 = generateInviteToken();
    const token2 = generateInviteToken();
    expect(token1).not.toBe(token2);
  });

  it("sets expiry 72 hours in the future by default", () => {
    const before = new Date();
    const expiry = getInviteExpiry();
    const after = new Date();

    const expectedMs = 72 * 60 * 60 * 1000;
    const diffMs = expiry.getTime() - before.getTime();
    expect(diffMs).toBeGreaterThanOrEqual(expectedMs - 1000);
    expect(diffMs).toBeLessThanOrEqual(expectedMs + (after.getTime() - before.getTime()) + 1000);
  });

  it("sets expiry with custom hours", () => {
    const expiry = getInviteExpiry(24);
    const expectedMs = 24 * 60 * 60 * 1000;
    const diffMs = expiry.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(expectedMs - 5000);
    expect(diffMs).toBeLessThan(expectedMs + 5000);
  });

  it("correctly identifies a non-expired invite", () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    expect(isInviteExpired(futureDate)).toBe(false);
  });

  it("correctly identifies an expired invite", () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    expect(isInviteExpired(pastDate)).toBe(true);
  });

  it("builds a valid invite URL", () => {
    const token = "abc123def456";
    const url = buildInviteUrl("https://mydojoma.com", token);
    expect(url).toBe("https://mydojoma.com/staff-invite?token=abc123def456");
  });

  it("invite URL contains the token as a query param", () => {
    const token = generateInviteToken();
    const url = buildInviteUrl("https://mydojoma.com", token);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("token")).toBe(token);
  });
});
