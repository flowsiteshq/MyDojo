import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, notificationPreferences, InsertNotificationPreference, pushSubscriptions, InsertPushSubscription, notificationHistory, InsertNotificationHistory, testimonials, InsertTestimonial, trialSignups, InsertTrialSignup } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  // For email/password auth, email is required; for OAuth, openId is required
  if (!user.email && !user.openId) {
    throw new Error("User email or openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      email: user.email || `oauth_${user.openId}@placeholder.local`, // Placeholder for OAuth users
      openId: user.openId || null,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Notification Preferences
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notification preferences: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertNotificationPreferences(
  userId: number,
  preferences: Partial<Omit<InsertNotificationPreference, "userId" | "id">>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert notification preferences: database not available");
    return;
  }

  const values: InsertNotificationPreference = {
    userId,
    ...preferences,
  };

  await db
    .insert(notificationPreferences)
    .values(values)
    .onDuplicateKeyUpdate({
      set: preferences,
    });
}

// Push Subscriptions
export async function savePushSubscription(subscription: InsertPushSubscription) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save push subscription: database not available");
    return;
  }

  await db.insert(pushSubscriptions).values(subscription);
}

export async function getPushSubscriptionsByUser(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get push subscriptions: database not available");
    return [];
  }

  return await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

export async function deletePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete push subscription: database not available");
    return;
  }

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

// Notification History
export async function createNotificationHistory(notification: InsertNotificationHistory) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create notification history: database not available");
    return;
  }

  await db.insert(notificationHistory).values(notification);
}

export async function getNotificationHistory(
  userId: number,
  options?: {
    type?: string;
    isRead?: number;
    limit?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notification history: database not available");
    return [];
  }

  let query = db
    .select()
    .from(notificationHistory)
    .where(eq(notificationHistory.userId, userId))
    .$dynamic();

  if (options?.type) {
    query = query.where(eq(notificationHistory.type, options.type as any));
  }

  if (options?.isRead !== undefined) {
    query = query.where(eq(notificationHistory.isRead, options.isRead));
  }

  query = query.orderBy(desc(notificationHistory.createdAt));

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.offset(options.offset);
  }

  return await query;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark notification as read: database not available");
    return;
  }

  await db
    .update(notificationHistory)
    .set({ isRead: 1, readAt: new Date() })
    .where(
      and(
        eq(notificationHistory.id, notificationId),
        eq(notificationHistory.userId, userId)
      )
    );
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark all notifications as read: database not available");
    return;
  }

  await db
    .update(notificationHistory)
    .set({ isRead: 1, readAt: new Date() })
    .where(
      and(
        eq(notificationHistory.userId, userId),
        eq(notificationHistory.isRead, 0)
      )
    );
}

export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete notification: database not available");
    return;
  }

  await db
    .delete(notificationHistory)
    .where(
      and(
        eq(notificationHistory.id, notificationId),
        eq(notificationHistory.userId, userId)
      )
    );
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get unread notification count: database not available");
    return 0;
  }

  const result = await db
    .select()
    .from(notificationHistory)
    .where(
      and(
        eq(notificationHistory.userId, userId),
        eq(notificationHistory.isRead, 0)
      )
    );

  return result.length;
}

// =====================
// Testimonials Functions
// =====================

export async function getAllTestimonials(filters?: { program?: string; minRating?: number }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get testimonials: database not available");
    return [];
  }

  let query = db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isApproved, 1))
    .orderBy(desc(testimonials.featured), desc(testimonials.createdAt));

  const results = await query;

  // Apply filters in memory (could be optimized with SQL WHERE clauses)
  let filtered = results;
  
  if (filters?.program) {
    filtered = filtered.filter(t => t.program === filters.program);
  }
  
  if (filters?.minRating !== undefined) {
    filtered = filtered.filter(t => t.rating >= filters.minRating!);
  }

  return filtered;
}

export async function getFeaturedTestimonials(limit: number = 3) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get featured testimonials: database not available");
    return [];
  }

  const results = await db
    .select()
    .from(testimonials)
    .where(
      and(
        eq(testimonials.isApproved, 1),
        eq(testimonials.featured, 1)
      )
    )
    .orderBy(desc(testimonials.createdAt))
    .limit(limit);

  return results;
}

export async function createTestimonial(testimonial: InsertTestimonial) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create testimonial: database not available");
    return null;
  }

  const result = await db.insert(testimonials).values(testimonial);
  return result;
}

// ============================================================================
// Trial Signups
// ============================================================================

export async function createTrialSignup(signup: InsertTrialSignup) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create trial signup: database not available");
    return null;
  }

  const result = await db.insert(trialSignups).values(signup);
  // Get the inserted ID and return the full lead object
  // For MySQL/TiDB, the insertId is in result[0].insertId
  const insertId = Number(result[0]?.insertId || (result as any).insertId);
  
  if (isNaN(insertId) || insertId === 0) {
    console.error("[Database] Failed to get insertId from result:", result);
    throw new Error("Failed to get inserted ID");
  }
  
  const [lead] = await db.select().from(trialSignups).where(eq(trialSignups.id, insertId)).limit(1);
  return lead;
}

export async function getAllTrialSignups() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get trial signups: database not available");
    return [];
  }

  const results = await db
    .select()
    .from(trialSignups)
    .orderBy(desc(trialSignups.createdAt));

  return results;
}

export async function getTrialSignupById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get trial signup: database not available");
    return null;
  }

  const results = await db
    .select()
    .from(trialSignups)
    .where(eq(trialSignups.id, id))
    .limit(1);

  return results[0] || null;
}

export async function updateTrialSignupStatus(id: number, status: "new" | "contacted" | "scheduled" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update trial signup status: database not available");
    return null;
  }

  const result = await db
    .update(trialSignups)
    .set({ status, updatedAt: new Date() })
    .where(eq(trialSignups.id, id));

  return result;
}

/**
 * Get available class schedules for specific programs
 * Returns upcoming class times for the next 7 days
 */
export async function getAvailableClassSchedules(programs: string[], location: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get class schedules: database not available");
    return [];
  }

  // Import classSchedule from schema
  const { classSchedule } = await import("../drizzle/schema");
  const { eq, and, inArray } = await import("drizzle-orm");

  // Query active classes for the specified programs and location
  const results = await db
    .select()
    .from(classSchedule)
    .where(
      and(
        inArray(classSchedule.program, programs as any),
        eq(classSchedule.location, location),
        eq(classSchedule.isActive, 1)
      )
    );

  return results;
}

/**
 * Create a new waiver signature record
 */
export async function createWaiverSignature(data: {
  name: string;
  phone: string;
  email: string;
  ipAddress?: string;
  waiverVersion?: string;
  acceptedLiability?: number;
  acceptedPhotoConsent?: number;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create waiver signature: database not available");
    return null;
  }

  const { waiverSignatures } = await import("../drizzle/schema");

  const [result] = await db.insert(waiverSignatures).values({
    name: data.name,
    phone: data.phone,
    email: data.email,
    ipAddress: data.ipAddress || null,
    waiverVersion: data.waiverVersion || "2026-02",
    acceptedLiability: data.acceptedLiability ?? 1,
    acceptedPhotoConsent: data.acceptedPhotoConsent ?? 1,
    signedAt: new Date(),
  });

  return result;
}

/**
 * Get top students with perfect attendance streaks
 * Returns students ordered by current streak (descending)
 */
export async function getPerfectAttendanceLeaderboard(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get attendance leaderboard: database not available");
    return [];
  }

  const { enrollments } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");

  const results = await db
    .select({
      id: enrollments.id,
      customerName: enrollments.customerName,
      currentStreak: enrollments.currentStreak,
      longestStreak: enrollments.longestStreak,
      beltRank: enrollments.beltRank,
    })
    .from(enrollments)
    .where(eq(enrollments.status, "active"))
    .orderBy(desc(enrollments.currentStreak))
    .limit(limit);

  return results;
}

/**
 * Get students who are close to next belt promotion (15+ classes at current belt)
 * Calculates classes since beltAchievedDate from attendance records
 */
export async function getRunnerUpForNextBelt(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get runner up for next belt: database not available");
    return [];
  }

  const { enrollments, attendance } = await import("../drizzle/schema");
  const { sql, desc, and, gte } = await import("drizzle-orm");

  // Get enrollments with their class count since belt achieved date
  const results = await db
    .select({
      id: enrollments.id,
      customerName: enrollments.customerName,
      beltRank: enrollments.beltRank,
      beltAchievedDate: enrollments.beltAchievedDate,
      classesAtCurrentBelt: sql<number>`COUNT(${attendance.id})`,
    })
    .from(enrollments)
    .leftJoin(
      attendance,
      and(
        eq(attendance.enrollmentId, enrollments.id),
        gte(attendance.checkInDate, sql`DATE(${enrollments.beltAchievedDate})`)
      )
    )
    .where(eq(enrollments.status, "active"))
    .groupBy(enrollments.id)
    .having(sql`COUNT(${attendance.id}) >= 15`)
    .orderBy(desc(sql`COUNT(${attendance.id})`))
    .limit(limit);

  return results;
}

/**
 * Record a check-in and update enrollment streak fields
 * This is the core function for kiosk check-ins
 */
export async function recordCheckIn(data: {
  studentId: number;
  enrollmentId: number;
  classId?: number;
  locationId?: string;
  programType?: string;
  source?: "kiosk" | "staff" | "admin" | "mobile";
  notes?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record check-in: database not available");
    return null;
  }

  const { attendance, enrollments } = await import("../drizzle/schema");
  const { sql } = await import("drizzle-orm");

  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Get enrollment record for belt and streak info
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, data.enrollmentId))
    .limit(1);

  if (!enrollment) {
    console.warn("[Database] Enrollment not found:", data.enrollmentId);
    return null;
  }

  // Guard: prevent duplicate check-ins for the same enrollment on the same day
  const [existingCheckIn] = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(
      and(
        eq(attendance.enrollmentId, data.enrollmentId),
        eq(attendance.checkInDate, today)
      )
    )
    .limit(1);

  if (existingCheckIn) {
    console.warn("[Database] Duplicate check-in prevented for enrollment", data.enrollmentId, "on", today);
    return {
      attendanceId: existingCheckIn.id,
      xpAwarded: 0,
      newStreak: enrollment.currentStreak,
      newLongestStreak: enrollment.longestStreak,
      newTotalXP: enrollment.totalXP,
      alreadyCheckedIn: true,
    };
  }

  // Detect birthday: compare MM-DD of dateOfBirth to today
  let isBirthday = false;
  if (enrollment.dateOfBirth) {
    // dateOfBirth may be stored as YYYY-MM-DD string or Date object
    const dob = typeof enrollment.dateOfBirth === 'string'
      ? enrollment.dateOfBirth
      : (enrollment.dateOfBirth as Date).toISOString().split('T')[0];
    const dobMMDD = dob.substring(5); // MM-DD
    const todayMMDD = today.substring(5); // MM-DD
    isBirthday = dobMMDD === todayMMDD;
  }

  // Calculate XP (base 10 + bonuses)
  let xpAwarded = 10;
  
  // Birthday bonus: +20 XP if today is birthday
  if (isBirthday) {
    xpAwarded += 20;
  }

  // Insert attendance record
  const [result] = await db.insert(attendance).values({
    studentId: data.studentId,
    enrollmentId: data.enrollmentId,
    classId: data.classId || null,
    locationId: data.locationId || "Tomball HQ",
    checkInDate: today,
    beltRankAtCheckIn: enrollment.beltRank,
    xpAwarded,
    source: data.source || "kiosk",
    programType: data.programType || null,
    notes: data.notes || null,
  });

  // Update enrollment streak fields
  const lastCheckIn = enrollment.lastCheckInDate;
  let newStreak = 1;

  if (lastCheckIn) {
    const lastDate = new Date(lastCheckIn);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      newStreak = enrollment.currentStreak + 1;
    } else if (diffDays === 0) {
      // Same day check-in (multiple classes)
      newStreak = enrollment.currentStreak;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  const newLongestStreak = Math.max(newStreak, enrollment.longestStreak);
  const newTotalXP = enrollment.totalXP + xpAwarded;

  // Update enrollment
  await db
    .update(enrollments)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastCheckInDate: today,
      totalXP: newTotalXP,
    })
    .where(eq(enrollments.id, data.enrollmentId));

  return {
    attendanceId: result.insertId,
    xpAwarded,
    newStreak,
    newLongestStreak,
    newTotalXP,
    isBirthday,
  };
}

// ─── Staff Calendar DB Helpers ─────────────────────────────────────────────────

export async function getCalendarTasksForMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const { calendarTasks } = await import("../drizzle/schema");
  const { between } = await import("drizzle-orm");
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(calendarTasks)
    .where(between(calendarTasks.taskDate, start, end))
    .orderBy(calendarTasks.taskDate);
}

export async function getCalendarTasksForUser(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const { calendarTasks } = await import("../drizzle/schema");
  const { between, or, isNull } = await import("drizzle-orm");
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(calendarTasks)
    .where(
      and(
        between(calendarTasks.taskDate, start, end),
        or(eq(calendarTasks.assignedToUserId, userId), isNull(calendarTasks.assignedToUserId))
      )
    )
    .orderBy(calendarTasks.taskDate);
}

export async function createCalendarTask(task: import("../drizzle/schema").InsertCalendarTask) {
  const db = await getDb();
  if (!db) return null;
  const { calendarTasks } = await import("../drizzle/schema");
  const [result] = await db.insert(calendarTasks).values(task);
  return result;
}

export async function updateCalendarTask(id: number, updates: Partial<import("../drizzle/schema").InsertCalendarTask>) {
  const db = await getDb();
  if (!db) return;
  const { calendarTasks } = await import("../drizzle/schema");
  await db.update(calendarTasks).set(updates).where(eq(calendarTasks.id, id));
}

export async function deleteCalendarTask(id: number) {
  const db = await getDb();
  if (!db) return;
  const { calendarTasks } = await import("../drizzle/schema");
  await db.delete(calendarTasks).where(eq(calendarTasks.id, id));
}

export async function createTimeOffRequest(req: import("../drizzle/schema").InsertTimeOffRequest) {
  const db = await getDb();
  if (!db) return null;
  const { timeOffRequests } = await import("../drizzle/schema");
  const [result] = await db.insert(timeOffRequests).values(req);
  return result;
}

export async function getTimeOffRequestsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { timeOffRequests } = await import("../drizzle/schema");
  return db.select().from(timeOffRequests)
    .where(eq(timeOffRequests.userId, userId))
    .orderBy(desc(timeOffRequests.createdAt));
}

export async function getAllTimeOffRequests() {
  const db = await getDb();
  if (!db) return [];
  const { timeOffRequests } = await import("../drizzle/schema");
  return db.select().from(timeOffRequests)
    .orderBy(desc(timeOffRequests.createdAt));
}

export async function updateTimeOffRequest(id: number, updates: Partial<import("../drizzle/schema").InsertTimeOffRequest>) {
  const db = await getDb();
  if (!db) return;
  const { timeOffRequests } = await import("../drizzle/schema");
  await db.update(timeOffRequests).set(updates).where(eq(timeOffRequests.id, id));
}

export async function getApprovedTimeOffForMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const { timeOffRequests } = await import("../drizzle/schema");
  const { lte, gte } = await import("drizzle-orm");
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return db.select().from(timeOffRequests)
    .where(
      and(
        eq(timeOffRequests.status, "approved"),
        lte(timeOffRequests.startDate, end),
        gte(timeOffRequests.endDate, start)
      )
    );
}
