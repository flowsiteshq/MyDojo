import { describe, it, expect, beforeAll } from "vitest";
import { getNotificationPreferences, upsertNotificationPreferences } from "./db";

describe("Notification Preferences", () => {
  const testUserId = 999999; // Use a high number to avoid conflicts

  beforeAll(async () => {
    // Clean up any existing test data
    try {
      await upsertNotificationPreferences(testUserId, {
        classUpdates: 1,
        scheduleChanges: 1,
        specialEvents: 1,
        promotions: 1,
        generalNews: 1,
      });
    } catch (error) {
      // Ignore errors during setup
    }
  });

  it("should create default notification preferences", async () => {
    await upsertNotificationPreferences(testUserId, {
      classUpdates: 1,
      scheduleChanges: 1,
      specialEvents: 1,
      promotions: 1,
      generalNews: 1,
    });

    const preferences = await getNotificationPreferences(testUserId);
    expect(preferences).toBeDefined();
    expect(preferences?.userId).toBe(testUserId);
    expect(preferences?.classUpdates).toBe(1);
    expect(preferences?.scheduleChanges).toBe(1);
    expect(preferences?.specialEvents).toBe(1);
    expect(preferences?.promotions).toBe(1);
    expect(preferences?.generalNews).toBe(1);
  });

  it("should update notification preferences", async () => {
    // Disable promotions and general news
    await upsertNotificationPreferences(testUserId, {
      promotions: 0,
      generalNews: 0,
    });

    const preferences = await getNotificationPreferences(testUserId);
    expect(preferences).toBeDefined();
    expect(preferences?.promotions).toBe(0);
    expect(preferences?.generalNews).toBe(0);
    // Other preferences should remain unchanged
    expect(preferences?.classUpdates).toBe(1);
    expect(preferences?.scheduleChanges).toBe(1);
    expect(preferences?.specialEvents).toBe(1);
  });

  it("should handle partial updates", async () => {
    // Only update class updates
    await upsertNotificationPreferences(testUserId, {
      classUpdates: 0,
    });

    const preferences = await getNotificationPreferences(testUserId);
    expect(preferences).toBeDefined();
    expect(preferences?.classUpdates).toBe(0);
    // Other preferences should remain from previous test
    expect(preferences?.promotions).toBe(0);
    expect(preferences?.generalNews).toBe(0);
  });

  it("should return undefined for non-existent user", async () => {
    const nonExistentUserId = 888888;
    const preferences = await getNotificationPreferences(nonExistentUserId);
    expect(preferences).toBeUndefined();
  });
});
