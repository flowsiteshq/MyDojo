import { describe, it, expect, beforeAll } from "vitest";
import {
  createNotificationHistory,
  getNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} from "./db";

describe("Notification History", () => {
  const testUserId = 999998; // Use a high number to avoid conflicts

  beforeAll(async () => {
    // Create some test notifications
    await createNotificationHistory({
      userId: testUserId,
      title: "Test Class Update",
      message: "This is a test class update notification",
      type: "classUpdates",
    });

    await createNotificationHistory({
      userId: testUserId,
      title: "Test Schedule Change",
      message: "This is a test schedule change notification",
      type: "scheduleChanges",
    });

    await createNotificationHistory({
      userId: testUserId,
      title: "Test Special Event",
      message: "This is a test special event notification",
      type: "specialEvents",
    });
  });

  it("should create and retrieve notification history", async () => {
    const notifications = await getNotificationHistory(testUserId);
    expect(notifications).toBeDefined();
    expect(notifications.length).toBeGreaterThanOrEqual(3);
    
    const classUpdate = notifications.find((n) => n.type === "classUpdates");
    expect(classUpdate).toBeDefined();
    expect(classUpdate?.title).toBe("Test Class Update");
    expect(classUpdate?.isRead).toBe(0);
  });

  it("should filter notifications by type", async () => {
    const classNotifications = await getNotificationHistory(testUserId, {
      type: "classUpdates",
    });
    
    expect(classNotifications).toBeDefined();
    expect(classNotifications.length).toBeGreaterThan(0);
    classNotifications.forEach((n) => {
      expect(n.type).toBe("classUpdates");
    });
  });

  it("should filter notifications by read status", async () => {
    const unreadNotifications = await getNotificationHistory(testUserId, {
      isRead: 0,
    });
    
    expect(unreadNotifications).toBeDefined();
    unreadNotifications.forEach((n) => {
      expect(n.isRead).toBe(0);
    });
  });

  it("should mark notification as read", async () => {
    const notifications = await getNotificationHistory(testUserId, {
      isRead: 0,
      limit: 1,
    });
    
    expect(notifications.length).toBeGreaterThan(0);
    const notificationId = notifications[0].id;
    
    await markNotificationAsRead(notificationId, testUserId);
    
    const updated = await getNotificationHistory(testUserId);
    const readNotification = updated.find((n) => n.id === notificationId);
    expect(readNotification?.isRead).toBe(1);
    expect(readNotification?.readAt).toBeDefined();
  });

  it("should get unread notification count", async () => {
    const count = await getUnreadNotificationCount(testUserId);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should mark all notifications as read", async () => {
    await markAllNotificationsAsRead(testUserId);
    
    const unreadCount = await getUnreadNotificationCount(testUserId);
    expect(unreadCount).toBe(0);
    
    const notifications = await getNotificationHistory(testUserId);
    notifications.forEach((n) => {
      expect(n.isRead).toBe(1);
    });
  });

  it("should delete notification", async () => {
    const notifications = await getNotificationHistory(testUserId, { limit: 1 });
    expect(notifications.length).toBeGreaterThan(0);
    
    const notificationId = notifications[0].id;
    await deleteNotification(notificationId, testUserId);
    
    const updated = await getNotificationHistory(testUserId);
    const deleted = updated.find((n) => n.id === notificationId);
    expect(deleted).toBeUndefined();
  });

  it("should respect limit and offset parameters", async () => {
    const firstPage = await getNotificationHistory(testUserId, {
      limit: 1,
      offset: 0,
    });
    
    const secondPage = await getNotificationHistory(testUserId, {
      limit: 1,
      offset: 1,
    });
    
    expect(firstPage.length).toBeLessThanOrEqual(1);
    expect(secondPage.length).toBeLessThanOrEqual(1);
    
    if (firstPage.length > 0 && secondPage.length > 0) {
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    }
  });
});
