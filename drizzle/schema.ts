import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** User's email address - used for login and communication */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Hashed password for email/password authentication */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** User's full name */
  name: text("name"),
  /** Authentication method: 'email' for email/password, 'oauth' for Manus OAuth (legacy) */
  loginMethod: varchar("loginMethod", { length: 64 }).default("email").notNull(),
  /** Legacy Manus OAuth identifier - nullable for backwards compatibility */
  openId: varchar("openId", { length: 64 }).unique(),
  /** User role for access control */
  role: mysqlEnum("role", ["user", "admin", "staff"]).default("user").notNull(),
  /** Email verification status */
  emailVerified: int("emailVerified").default(0).notNull(), // 0 = not verified, 1 = verified
  /** Password reset token */
  resetToken: varchar("resetToken", { length: 255 }),
  /** Password reset token expiry */
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  /** Staff/admin phone number for SMS notifications */
  phone: varchar("phone", { length: 20 }),
  /** Whether this user wants to receive SMS when a new lead comes in (staff/admin only) */
  leadSmsNotify: int("leadSmsNotify").default(1).notNull(), // 1 = enabled, 0 = disabled
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Push notification subscriptions table.
 * Stores browser push subscription details for each user.
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Notification preferences table.
 * Stores user preferences for different types of notifications.
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  classUpdates: int("classUpdates").default(1).notNull(), // 1 = enabled, 0 = disabled
  scheduleChanges: int("scheduleChanges").default(1).notNull(),
  specialEvents: int("specialEvents").default(1).notNull(),
  promotions: int("promotions").default(1).notNull(),
  generalNews: int("generalNews").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Notification history table.
 * Stores all notifications sent to users for history tracking.
 */
export const notificationHistory = mysqlTable("notificationHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["classUpdates", "scheduleChanges", "specialEvents", "promotions", "generalNews"]).notNull(),
  isRead: int("isRead").default(0).notNull(), // 0 = unread, 1 = read
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;
/**
 * Testimonials table.
 * Stores member reviews and success stories.
 */
export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  memberName: varchar("memberName", { length: 255 }).notNull(),
  memberPhoto: text("memberPhoto"), // URL to member photo
  program: mysqlEnum("program", ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School"]).notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  memberSince: varchar("memberSince", { length: 100 }), // e.g., "Member since 2023"
  featured: int("featured").default(0).notNull(), // 0 = not featured, 1 = featured
  isApproved: int("isApproved").default(1).notNull(), // 0 = pending, 1 = approved
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

/**
 * Trial signups table.
 * Stores free trial enrollment requests from the chatbot.
 */
export const trialSignups = mysqlTable("trialSignups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }), // Optional in new flow
  phone: varchar("phone", { length: 20 }).notNull(),
  program: mysqlEnum("program", ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Summer Camp", "Not Sure"]).notNull(),
  segment: mysqlEnum("segment", ["Kids 3-5", "Kids 6-12", "Teens", "Adult Karate", "Kickboxing", "Not sure"]), // New: who is this for
  goal: mysqlEnum("goal", ["Confidence", "Discipline", "Fitness", "Self-defense", "Bullying help", "Weight loss"]), // New: main goal
  preferredDays: mysqlEnum("preferredDays", ["Weekdays", "Weekends", "Either"]), // New: preferred days
  scheduledTime: timestamp("scheduledTime"), // New: actual booked appointment time
  location: varchar("location", { length: 255 }).notNull(),
  preferredContactMethod: mysqlEnum("preferredContactMethod", ["email", "phone", "text"]).default("phone").notNull(),
  message: text("message"), // Optional additional message from the user
  status: mysqlEnum("status", ["new", "contacted", "scheduled", "completed", "cancelled"]).default("new").notNull(),
  source: varchar("source", { length: 100 }).default("chatbot").notNull(), // Track where the signup came from
  ghlContactId: varchar("ghlContactId", { length: 255 }), // GoHighLevel contact ID for cross-reference
  introCountRequired: int("introCountRequired").default(0).notNull(), // Number of intro classes required (0 or 2)
  introCountBooked: int("introCountBooked").default(0).notNull(), // Number of intro classes booked
  introCountCompleted: int("introCountCompleted").default(0).notNull(), // Number of intro classes completed
  dojoFlowSyncStatus: mysqlEnum("dojoFlowSyncStatus", ["pending", "synced", "failed"]).default("pending").notNull(), // DojoFlow sync status
  dojoFlowSyncAttempts: int("dojoFlowSyncAttempts").default(0).notNull(), // Number of sync attempts made
  dojoFlowLastSyncAttempt: timestamp("dojoFlowLastSyncAttempt"), // Last sync attempt timestamp
  dojoFlowSyncError: text("dojoFlowSyncError"), // Last sync error message if failed
  /** Unique booking request ID for idempotent booking (prevents double-submit) */
  bookingRequestId: varchar("bookingRequestId", { length: 36 }).unique(),
  /** Kanban pipeline stage for visual sales tracking */
  pipelineStage: mysqlEnum("pipelineStage", ["new_lead", "contacted", "intro_scheduled", "showed_up", "offer_presented", "enrolled", "nurture"]).default("new_lead").notNull(),
  /** Staff notes about this lead */
  notes: text("notes"),
  /** Staff user ID assigned to this lead — they are responsible for follow-up */
  assignedStaffId: int("assignedStaffId"),
  /** Staff name at time of assignment (denormalized for display speed) */
  assignedStaffName: varchar("assignedStaffName", { length: 255 }),
  /** When this lead was assigned to a staff member */
  assignedAt: timestamp("assignedAt"),
  /** Timestamp of the last time staff contacted this lead (call, text, or email) */
  lastContactedAt: timestamp("lastContactedAt"),
  /** Method used for the last contact attempt */
  lastContactMethod: mysqlEnum("lastContactMethod", ["call", "text", "email"]),
  /** When the 24-hour intro reminder SMS was sent to this lead (null = not yet sent) */
  reminderSentAt: timestamp("reminderSentAt"),
  /** When the no-show follow-up SMS was sent to this lead (null = not yet sent) */
  noShowSentAt: timestamp("noShowSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrialSignup = typeof trialSignups.$inferSelect;
export type InsertTrialSignup = typeof trialSignups.$inferInsert;

/**
 * Chatbot conversations table.
 * Stores conversation state to remember returning users and continue from where they left off.
 */
export const chatbotConversations = mysqlTable("chatbotConversations", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier for the conversation (email or session ID) */
  identifier: varchar("identifier", { length: 320 }).notNull().unique(),
  /** User's name if provided */
  name: varchar("name", { length: 255 }),
  /** User's email if provided */
  email: varchar("email", { length: 320 }),
  /** User's phone if provided */
  phone: varchar("phone", { length: 20 }),
  /** Program interest if selected */
  program: varchar("program", { length: 100 }),
  /** Current step in the conversation flow */
  currentStep: varchar("currentStep", { length: 50 }).notNull().default("greeting"),
  /** Full conversation history as JSON (stored as text) */
  conversationHistory: text("conversationHistory"),
  /** Whether the trial signup was completed */
  completed: int("completed").default(0).notNull(), // 0 = in progress, 1 = completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = typeof chatbotConversations.$inferInsert;

/**
 * Chat messages table with full status tracking.
 * Supports sent/delivered/read receipts for web chat.
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  
  /** Conversation this message belongs to */
  conversationId: varchar("conversationId", { length: 255 }).notNull(),
  
  /** Client-side message ID for deduplication and tracking */
  clientMessageId: varchar("clientMessageId", { length: 255 }),
  
  /** Message direction: inbound (from user) or outbound (from assistant) */
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  
  /** Channel: web, sms, voice */
  channel: mysqlEnum("channel", ["web", "sms", "voice"]).default("web").notNull(),
  
  /** Message content */
  content: text("content").notNull(),
  
  /** Message status progression */
  status: mysqlEnum("status", ["queued", "sent", "delivered", "read"]).default("queued").notNull(),
  
  /** When message was sent by assistant */
  sentAt: timestamp("sentAt"),
  
  /** When message was delivered to client (rendered in UI) */
  deliveredAt: timestamp("deliveredAt"),
  
  /** When message was read by user (visible in focused conversation) */
  readAt: timestamp("readAt"),
  
  /** Metadata as JSON (for buttons, cards, etc.) */
  metadata: text("metadata"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Class schedule table.
 * Stores available class times by program, day, time, and location.
 */
export const classSchedule = mysqlTable("classSchedule", {
  id: int("id").autoincrement().primaryKey(),
  /** Program name */
  program: mysqlEnum("program", [
    "Little Ninjas",
    "Little Ninjas & Me",
    "Dragon Kids",
    "Dragon Kids & Teens",
    "Teens",
    "Teen Warriors",
    "Adult Karate",
    "Adult Karate + Kickboxing",
    "Kickboxing",
    "After School",
    "Summer Camp",
    "Intro Class",
    "Leadership",
    "Sparring",
    "Weapons Class",
    "Women's Self-Defense",
    "Advanced/Black Belt + Kickboxing",
    "Family Class",
    "Instructor Training",
    "Demo/Competition Team"
  ]).notNull(),
  /** Location name */
  location: varchar("location", { length: 255 }).notNull(),
  /** Day of week (Monday, Tuesday, etc.) */
  dayOfWeek: mysqlEnum("dayOfWeek", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]).notNull(),
  /** Start time (e.g., "5:00 PM") */
  startTime: varchar("startTime", { length: 20 }).notNull(),
  /** End time (e.g., "6:00 PM") */
  endTime: varchar("endTime", { length: 20 }).notNull(),
  /** Instructor name (optional) */
  instructor: varchar("instructor", { length: 255 }),
  /** Whether this class is active */
  isActive: int("isActive").default(1).notNull(), // 0 = inactive, 1 = active
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassSchedule = typeof classSchedule.$inferSelect;
export type InsertClassSchedule = typeof classSchedule.$inferInsert;

/**
 * Waiver signatures table.
 * Stores digital signatures for liability waivers and photo consent.
 */
export const waiverSignatures = mysqlTable("waiverSignatures", {
  id: int("id").autoincrement().primaryKey(),
  /** Full name of person signing waiver */
  name: varchar("name", { length: 255 }).notNull(),
  /** Phone number */
  phone: varchar("phone", { length: 20 }).notNull(),
  /** Email address */
  email: varchar("email", { length: 320 }).notNull(),
  /** IP address of person signing */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** Waiver version/date for tracking changes */
  waiverVersion: varchar("waiverVersion", { length: 50 }).default("2026-02").notNull(),
  /** Whether they accepted liability release */
  acceptedLiability: int("acceptedLiability").default(1).notNull(), // 1 = accepted
  /** Whether they accepted photo/video consent */
  acceptedPhotoConsent: int("acceptedPhotoConsent").default(1).notNull(), // 1 = accepted
  /** Timestamp when waiver was signed */
  signedAt: timestamp("signedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WaiverSignature = typeof waiverSignatures.$inferSelect;
export type InsertWaiverSignature = typeof waiverSignatures.$inferInsert;

/**
 * Conversation state machine table.
 * Stores deterministic state for trial chatbot to prevent repeated questions and dead ends.
 */
export const conversationStates = mysqlTable("conversationStates", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique conversation identifier (generated UUID) */
  conversationId: varchar("conversationId", { length: 36 }).notNull().unique(),
  /** Reference to trial signup if created */
  leadId: int("leadId"),
  /** User's full name */
  name: varchar("name", { length: 255 }),
  /** User's phone number */
  phone: varchar("phone", { length: 20 }),
  /** User's email address (optional) */
  email: varchar("email", { length: 320 }),
  /** Whether user explicitly skipped email */
  emailSkipped: int("emailSkipped").default(0).notNull(), // 0 = not skipped, 1 = skipped
  /** Who the class is for: self, child, other */
  classFor: mysqlEnum("classFor", ["self", "child", "other"]),
  /** User's intent: trial class, enrollment, summer camp, or after school */
  intent: mysqlEnum("intent", ["trial", "enroll", "summer_camp", "after_school"]),
  /** Selected membership plan ID (if intent=enroll) */
  selectedPlanId: int("selectedPlanId"),
  /** Child's age if classFor=child */
  childAge: int("childAge"),
  /** Determined segment based on age/classFor */
  segment: mysqlEnum("segment", ["KIDS_3_5", "KIDS_6_12", "TEENS", "ADULTS", "KICKBOXING", "CAMP", "AFTER_SCHOOL"]),
  /** Whether intro classes are required (kids 3-12) */
  introRequired: int("introRequired").default(0).notNull(), // 0 = not required, 1 = required
  /** Number of intro classes booked (0-2) */
  introBookedCount: int("introBookedCount").default(0).notNull(),
  /** JSON array of field keys already asked to prevent re-asking */
  askedKeys: text("askedKeys"), // JSON array: ["name", "phone", "email", etc.]
  /** Current step in conversation flow */
  nextStep: varchar("nextStep", { length: 50 }).notNull().default("NAME"),
  /** Location preference */
  location: varchar("location", { length: 255 }),
  /** Selected program name */
  program: varchar("program", { length: 100 }),
  /** Booked intro class slots as JSON */
  introSlots: text("introSlots"), // JSON array of slot objects
  /** Booked trial class slot as JSON */
  trialSlot: text("trialSlot"), // JSON slot object
  /** Complete enrollment state as JSON (for full enrollment flow) */
  enrollmentState: text("enrollmentState"), // JSON enrollment state object
  /** Whether intake flow is complete */
  intakeComplete: int("intakeComplete").default(0).notNull(), // 0 = incomplete, 1 = complete
  /** JSON array of completed steps to prevent repeating (RELIABILITY KERNEL) */
  completedSteps: text("completedSteps"), // JSON array: ["NAME", "PHONE", "EMAIL", etc.]
  /** Selected slot ID for booking (minimal booking flow) */
  selectedSlotId: varchar("selectedSlotId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConversationState = typeof conversationStates.$inferSelect;
export type InsertConversationState = typeof conversationStates.$inferInsert;

/**
 * Membership packages table.
 * Stores available membership tiers with pricing and benefits.
 */
export const membershipPackages = mysqlTable("membershipPackages", {
  id: int("id").autoincrement().primaryKey(),
  /** Package name: Foundation, Black Belt, Leadership */
  name: varchar("name", { length: 100 }).notNull().unique(),
  /** Duration in months (12, 36, etc.) */
  durationMonths: int("durationMonths").notNull(),
  /** Monthly membership fee (after $49 discount) */
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  /** Total program cost */
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  /** One-time registration fee */
  registrationFee: decimal("registrationFee", { precision: 10, scale: 2 }).notNull(),
  /** Down payment amount (total first-day charge = enrollmentFee + first month) */
  downPayment: decimal("downPayment", { precision: 10, scale: 2 }).notNull(),
  /** One-time enrollment fee charged on sign-up */
  enrollmentFee: decimal("enrollmentFee", { precision: 10, scale: 2 }).notNull().default('99.00'),
  /** Package description */
  description: text("description"),
  /** JSON array of benefits included in package */
  benefits: text("benefits"), // JSON: ["1 White Karate Gi", "2x 30min classes weekly", ...]
  /** Whether package requires invitation/approval */
  invitationOnly: int("invitationOnly").default(0).notNull(), // 0 = open, 1 = invitation only
  /** Whether package is currently active/available */
  isActive: int("isActive").default(1).notNull(), // 0 = inactive, 1 = active
  /** Stripe Product ID (optional, for Stripe integration) */
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  /** Stripe Price ID for monthly subscription (optional) */
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  /** Fluid Pay Recurring Plan ID for monthly subscription */
  fluidpayPlanId: varchar("fluidpayPlanId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MembershipPackage = typeof membershipPackages.$inferSelect;
export type InsertMembershipPackage = typeof membershipPackages.$inferInsert;

/**
 * Membership enrollments table.
 * Tracks customer enrollments and payment status.
 */
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to trial signup (if came from trial flow) */
  leadId: int("leadId"),
  /** Reference to membership package */
  membershipPackageId: int("membershipPackageId").notNull(),
  /** Customer name */
  customerName: varchar("customerName", { length: 255 }).notNull(),
  /** Customer email */
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  /** Customer phone */
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  /** Name of the student being enrolled (the child or participant). customerName is the paying parent/guardian. */
  studentName: varchar("studentName", { length: 255 }),
  /** Stripe Customer ID */
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  /** Stripe Payment Intent ID for initial payment */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /** Stripe Subscription ID (if recurring billing) */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  /** Fluid Pay Customer Vault ID */
  fluidpayCustomerId: varchar("fluidpayCustomerId", { length: 255 }),
  /** Fluid Pay Subscription ID for recurring billing */
  fluidpaySubscriptionId: varchar("fluidpaySubscriptionId", { length: 255 }),
  /** Down payment amount paid */
  downPaymentAmount: decimal("downPaymentAmount", { precision: 10, scale: 2 }).notNull(),
  /** Whether first month tuition was paid upfront */
  paidFirstMonth: int("paidFirstMonth").default(0).notNull(), // 0 = no, 1 = yes
  /** Remaining balance after down payment */
  remainingBalance: decimal("remainingBalance", { precision: 10, scale: 2 }).notNull(),
  /** Number of monthly payments remaining */
  monthlyPaymentsRemaining: int("monthlyPaymentsRemaining").notNull(),
  /** Enrollment status */
  status: mysqlEnum("status", ["pending", "active", "cancelled", "completed", "failed"]).default("pending").notNull(),
  /** Applied discount code/reason */
  discountApplied: varchar("discountApplied", { length: 255 }), // "LA_FITNESS", "MULTI_ENROLLMENT", "FULL_PACKAGE", etc.
  /** Discount amount */
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0.00"),
  /** Current belt rank */
  beltRank: mysqlEnum("beltRank", [
    // No rank
    "No Belt",
    // Beginner belts: 4 stripes on one side (16 classes each)
    "White Belt",
    "White Belt 1 White Stripe", "White Belt 2 White Stripes", "White Belt 3 White Stripes", "White Belt 4 White Stripes",
    "Yellow Belt",
    "Yellow Belt 1 Yellow Stripe", "Yellow Belt 2 Yellow Stripes", "Yellow Belt 3 Yellow Stripes", "Yellow Belt 4 Yellow Stripes",
    "Orange Belt",
    "Orange Belt 1 Orange Stripe", "Orange Belt 2 Orange Stripes", "Orange Belt 3 Orange Stripes", "Orange Belt 4 Orange Stripes",
    // Intermediate/Advanced belts: 4 stripes per side, 2 sides (32 classes each)
    "Green Belt",
    "Green Belt 1 Green Stripe", "Green Belt 2 Green Stripes", "Green Belt 3 Green Stripes", "Green Belt 4 Green Stripes",
    "Green Belt 5 Green Stripes", "Green Belt 6 Green Stripes", "Green Belt 7 Green Stripes", "Green Belt 8 Green Stripes",
    "Blue Belt",
    "Blue Belt 1 Blue Stripe", "Blue Belt 2 Blue Stripes", "Blue Belt 3 Blue Stripes", "Blue Belt 4 Blue Stripes",
    "Blue Belt 5 Blue Stripes", "Blue Belt 6 Blue Stripes", "Blue Belt 7 Blue Stripes", "Blue Belt 8 Blue Stripes",
    "Purple Belt",
    "Purple Belt 1 Purple Stripe", "Purple Belt 2 Purple Stripes", "Purple Belt 3 Purple Stripes", "Purple Belt 4 Purple Stripes",
    "Purple Belt 5 Purple Stripes", "Purple Belt 6 Purple Stripes", "Purple Belt 7 Purple Stripes", "Purple Belt 8 Purple Stripes",
    "Brown Belt",
    "Brown Belt 1 Brown Stripe", "Brown Belt 2 Brown Stripes", "Brown Belt 3 Brown Stripes", "Brown Belt 4 Brown Stripes",
    "Brown Belt 5 Brown Stripes", "Brown Belt 6 Brown Stripes", "Brown Belt 7 Brown Stripes", "Brown Belt 8 Brown Stripes",
    // Black belt ranks
    "Probationary Black", "Black Belt 1st Dan",
    "Black Belt 2nd Dan", "Black Belt 3rd Dan", "Black Belt 4th Dan", "Black Belt 5th Dan", "Black Belt 6th Dan"
  ]).default("No Belt").notNull(),
  /** Date when current belt was achieved */
  beltAchievedDate: timestamp("beltAchievedDate"),
  /** Student's date of birth for birthday celebrations */
  dateOfBirth: varchar("dateOfBirth", { length: 10 }), // YYYY-MM-DD format
  /** Total XP earned (gamification) */
  totalXP: int("totalXP").default(0).notNull(),
  /** Current attendance streak (consecutive days) */
  currentStreak: int("currentStreak").default(0).notNull(),
  /** Longest attendance streak achieved */
  longestStreak: int("longestStreak").default(0).notNull(),
  /** Last check-in date for streak calculation */
  lastCheckInDate: varchar("lastCheckInDate", { length: 10 }), // YYYY-MM-DD format
  /** Student photo URL for kiosk display */
  photoUrl: text("photoUrl"),
  /** Timestamp when enrollment agreement was signed */
  agreementSignedAt: timestamp("agreementSignedAt"),
  /** Typed full name used as digital signature on enrollment agreement */
  agreementSignature: varchar("agreementSignature", { length: 255 }),
  /** IP address at time of agreement signing */
  agreementSignedIp: varchar("agreementSignedIp", { length: 45 }),
  /** Payment start date */
  startDate: timestamp("startDate"),
  /** Payment completion date (when fully paid) */
  completionDate: timestamp("completionDate"),
  /** Date cancellation was requested (30-day notice starts here) */
  cancellationRequestedAt: timestamp("cancellationRequestedAt"),
  /** Date the final billing cycle will run (cancellationRequestedAt + 30 days) */
  cancellationEffectiveDate: timestamp("cancellationEffectiveDate"),
  /** Reason provided for cancellation */
  cancellationReason: varchar("cancellationReason", { length: 500 }),
  /** Whether the final billing cycle has been processed */
  finalBillingProcessed: int("finalBillingProcessed").default(0).notNull(), // 0=no, 1=yes
  /** Freeze start date */
  freezeStartDate: timestamp("freezeStartDate"),
  /** Freeze end date */
  freezeEndDate: timestamp("freezeEndDate"),
  /** Reason for freeze */
  freezeReason: varchar("freezeReason", { length: 500 }),
  /** Whether membership is currently frozen */
  isFrozen: int("isFrozen").default(0).notNull(), // 0=no, 1=yes
  /** Total classes attended at current belt rank (resets on belt promotion) */
  classesAtCurrentBelt: int("classesAtCurrentBelt").default(0).notNull(),
  /** Current stripe phase (1-4). Resets to 1 on belt promotion. */
  currentStripePhase: int("currentStripePhase").default(1).notNull(),
  /** Stripes earned in current phase. Resets to 0 on phase completion. */
  stripesInCurrentPhase: int("stripesInCurrentPhase").default(0).notNull(),
  /** Whether student is eligible for belt exam (exam required belts only) */
  beltExamEligible: int("beltExamEligible").default(0).notNull(), // 0=no, 1=yes
  /** Whether belt exam fee has been paid */
  beltExamFeePaid: int("beltExamFeePaid").default(0).notNull(), // 0=no, 1=yes
  /** Belt exam fee payment transaction ID */
  beltExamPaymentId: varchar("beltExamPaymentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

/**
 * Students table.
 * Stores student records for enrollment (can be child or adult).
 */
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to trial signup (if came from trial flow) */
  leadId: int("leadId"),
  /** Student's full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Date of birth */
  dateOfBirth: varchar("dateOfBirth", { length: 10 }), // YYYY-MM-DD format
  /** Age (if DOB not provided yet) */
  age: int("age"),
  /** Street address */
  address: varchar("address", { length: 500 }),
  /** City */
  city: varchar("city", { length: 100 }),
  /** State */
  state: varchar("state", { length: 2 }),
  /** Zip code */
  zip: varchar("zip", { length: 10 }),
  /** Emergency contact name */
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  /** Emergency contact phone */
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 20 }),
  /** Program enrolled in */
  program: mysqlEnum("program", ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Summer Camp"]).notNull(),
  /** Enrollment status */
  status: mysqlEnum("status", ["pending", "active", "inactive", "cancelled"]).default("pending").notNull(),
  /** Location */
  location: varchar("location", { length: 255 }).default("Tomball HQ").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

/**
 * Attendance table - Source of truth for all check-in events.
 * This is the foundation for gamification, streaks, belt progression tracking, and analytics.
 */
export const attendance = mysqlTable("attendance", {
  /** Primary key */
  id: int("id").autoincrement().primaryKey(),
  /** Reference to student (can link to students table or enrollments table) */
  studentId: int("studentId").notNull(),
  /** Reference to enrollment record for belt/XP tracking */
  enrollmentId: int("enrollmentId"),
  /** Reference to class schedule */
  classId: int("classId"),
  /** Location where check-in occurred */
  locationId: varchar("locationId", { length: 255 }).default("Tomball HQ").notNull(),
  /** Full timestamp of check-in */
  checkInTimestamp: timestamp("checkInTimestamp").defaultNow().notNull(),
  /** Date only (for streak calculations and daily queries) */
  checkInDate: varchar("checkInDate", { length: 10 }).notNull(), // YYYY-MM-DD format
  /** Belt rank at time of check-in (for tracking classes at each belt level) */
  beltRankAtCheckIn: varchar("beltRankAtCheckIn", { length: 50 }),
  /** XP awarded for this check-in (base + bonuses) */
  xpAwarded: int("xpAwarded").default(0).notNull(),
  /** Check-in source: kiosk, staff, admin, mobile */
  source: mysqlEnum("source", ["kiosk", "staff", "admin", "mobile"]).default("kiosk").notNull(),
  /** Program/class type attended */
  programType: varchar("programType", { length: 100 }),
  /** Notes or special circumstances */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

/**
 * Guardians table.
 * Stores parent/guardian information for minor students.
 */
export const guardians = mysqlTable("guardians", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to student */
  studentId: int("studentId").notNull(),
  /** Guardian's full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Guardian's phone */
  phone: varchar("phone", { length: 20 }).notNull(),
  /** Guardian's email */
  email: varchar("email", { length: 320 }),
  /** Relationship to student (Mother, Father, Guardian, etc.) */
  relationship: varchar("relationship", { length: 50 }),
  /** Whether this is the primary contact */
  isPrimary: int("isPrimary").default(1).notNull(), // 0 = secondary, 1 = primary
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guardian = typeof guardians.$inferSelect;
export type InsertGuardian = typeof guardians.$inferInsert;

/**
 * Enrollment intents table.
 * Tracks enrollment payment intents before completion.
 */
export const enrollmentIntents = mysqlTable("enrollmentIntents", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to student */
  studentId: int("studentId").notNull(),
  /** Reference to membership package */
  planId: int("planId").notNull(),
  /** Amount to be paid */
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  /** Stripe Payment Intent ID */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).unique(),
  /** Stripe Checkout Session ID */
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).unique(),
  /** Payment status */
  status: mysqlEnum("status", ["pending", "processing", "succeeded", "failed", "cancelled"]).default("pending").notNull(),
  /** Payment type: deposit or full */
  paymentType: mysqlEnum("paymentType", ["deposit", "full"]).default("deposit").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EnrollmentIntent = typeof enrollmentIntents.$inferSelect;
export type InsertEnrollmentIntent = typeof enrollmentIntents.$inferInsert;

/**
 * Waiver signatures v2 table.
 * Stores waiver signatures linked to students and guardians.
 */
export const waiverSignaturesV2 = mysqlTable("waiverSignaturesV2", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to student */
  studentId: int("studentId").notNull(),
  /** Reference to guardian (if minor) */
  guardianId: int("guardianId"),
  /** Waiver version (e.g., "2026-02") */
  waiverVersion: varchar("waiverVersion", { length: 20 }).notNull(),
  /** Timestamp when signed */
  signedAt: timestamp("signedAt").notNull(),
  /** IP address of signer */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** Accepted liability waiver */
  acceptedLiability: int("acceptedLiability").default(1).notNull(), // 0 = no, 1 = yes
  /** Accepted photo/video consent */
  acceptedPhotoConsent: int("acceptedPhotoConsent").default(1).notNull(), // 0 = no, 1 = yes
  /** Signature method: digital or in-person */
  signatureMethod: mysqlEnum("signatureMethod", ["digital", "in-person"]).default("digital").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WaiverSignatureV2 = typeof waiverSignaturesV2.$inferSelect;
export type InsertWaiverSignatureV2 = typeof waiverSignaturesV2.$inferInsert;

/**
 * Staff callbacks table.
 * Stores callback requests when booking fails or user needs assistance.
 */
export const staffCallbacks = mysqlTable("staffCallbacks", {
  id: int("id").autoincrement().primaryKey(),
  /** Phone number to call back */
  phone: varchar("phone", { length: 20 }).notNull(),
  /** Name of person requesting callback */
  name: varchar("name", { length: 255 }),
  /** Email if provided */
  email: varchar("email", { length: 255 }),
  /** Reason for callback */
  reason: varchar("reason", { length: 500 }).notNull(),
  /** Program they were interested in */
  program: varchar("program", { length: 100 }),
  /** Status of callback */
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  /** Notes from staff */
  staffNotes: text("staffNotes"),
  /** When callback was completed */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffCallback = typeof staffCallbacks.$inferSelect;
export type InsertStaffCallback = typeof staffCallbacks.$inferInsert;

/**
 * Membership change requests table.
 * Stores member requests to pause or cancel their membership.
 * Requires admin approval before action is taken.
 */
export const membershipChangeRequests = mysqlTable("membershipChangeRequests", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to enrollment */
  enrollmentId: int("enrollmentId").notNull(),
  /** Reference to user who made the request */
  userId: int("userId").notNull(),
  /** Type of change requested */
  requestType: mysqlEnum("requestType", ["pause", "cancel"]).notNull(),
  /** Reason provided by member */
  reason: text("reason").notNull(),
  /** Request status */
  status: mysqlEnum("status", ["pending", "approved", "denied"]).default("pending").notNull(),
  /** Admin who reviewed the request */
  reviewedBy: int("reviewedBy"),
  /** Admin notes/response */
  adminNotes: text("adminNotes"),
  /** When request was reviewed */
  reviewedAt: timestamp("reviewedAt"),
  /** When the change should take effect (if approved) */
  effectiveDate: timestamp("effectiveDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MembershipChangeRequest = typeof membershipChangeRequests.$inferSelect;
export type InsertMembershipChangeRequest = typeof membershipChangeRequests.$inferInsert;

/**
 * Belt curriculum content table.
 * Stores curriculum content for each belt rank with access control.
 */
export const curriculumContent = mysqlTable("curriculumContent", {
  id: int("id").autoincrement().primaryKey(),
  /** Belt rank this content belongs to */
  beltRank: mysqlEnum("beltRank", [
    "No Belt", "White Belt", "Yellow Belt", "Orange Belt", "Green Belt", 
    "Advanced Green", "Blue Belt", "Advanced Blue", "Purple Belt", "Advanced Purple",
    "Brown Belt", "Advanced Brown", "Probationary Black", "Black Belt 1st Dan"
  ]).notNull(),
  /** Content category */
  category: mysqlEnum("category", [
    "Equipment", "Striking Techniques", "Defensive Techniques", "Grappling", 
    "Combos", "Self-Defense", "Sets", "Knowledge", "Forms"
  ]).notNull(),
  /** Content title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Content description/instructions */
  description: text("description").notNull(),
  /** Video URL (if applicable) */
  videoUrl: text("videoUrl"),
  /** Image URL (if applicable) */
  imageUrl: text("imageUrl"),
  /** Order within category */
  sortOrder: int("sortOrder").default(0).notNull(),
  /** Whether this content is published */
  isPublished: int("isPublished").default(1).notNull(), // 0 = draft, 1 = published
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CurriculumContent = typeof curriculumContent.$inferSelect;
export type InsertCurriculumContent = typeof curriculumContent.$inferInsert;

/**
 * Student progress tracking table.
 * Tracks which curriculum items a student has completed.
 */
export const studentProgress = mysqlTable("studentProgress", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to enrollment */
  enrollmentId: int("enrollmentId").notNull(),
  /** Reference to curriculum content */
  curriculumContentId: int("curriculumContentId").notNull(),
  /** Completion status */
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  /** Completion date */
  completedAt: timestamp("completedAt"),
  /** Instructor notes */
  instructorNotes: text("instructorNotes"),
  /** Instructor feedback */
  instructorFeedback: text("instructorFeedback"),
  /** ID of instructor who gave feedback */
  instructorId: int("instructorId"),
  /** Date when feedback was given */
  feedbackDate: timestamp("feedbackDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProgress = typeof studentProgress.$inferSelect;
export type InsertStudentProgress = typeof studentProgress.$inferInsert;

/**
 * Class attendance table.
 * Tracks student check-ins for classes.
 */
export const classAttendance = mysqlTable("classAttendance", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to enrollment */
  enrollmentId: int("enrollmentId").notNull(),
  /** Reference to user (student account) */
  userId: int("userId").notNull(),
  /** Reference to class schedule */
  classScheduleId: int("classScheduleId").notNull(),
  /** Date of attendance (YYYY-MM-DD) */
  attendanceDate: varchar("attendanceDate", { length: 10 }).notNull(),
  /** Check-in timestamp */
  checkInTime: timestamp("checkInTime").notNull(),
  /** Check-in method: manual, qr_code, admin */
  checkInMethod: mysqlEnum("checkInMethod", ["manual", "qr_code", "admin"]).default("manual").notNull(),
  /** Check-out timestamp (optional) */
  checkOutTime: timestamp("checkOutTime"),
  /** Attendance status */
  status: mysqlEnum("status", ["present", "late", "absent", "excused"]).default("present").notNull(),
  /** Notes from instructor or admin */
  notes: text("notes"),
  /** IP address of check-in (for security) */
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassAttendance = typeof classAttendance.$inferSelect;
export type InsertClassAttendance = typeof classAttendance.$inferInsert;

/**
 * Streak milestone log — records each time a student hits a streak milestone.
 * Used to prevent duplicate notifications and to display milestone history in admin.
 */
export const streakMilestones = mysqlTable("streakMilestones", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to enrollment */
  enrollmentId: int("enrollmentId").notNull(),
  /** The milestone reached (5, 10, 25, 50, 100) */
  milestone: int("milestone").notNull(),
  /** Email address the notification was sent to */
  emailSentTo: varchar("emailSentTo", { length: 320 }),
  /** Whether the email was successfully delivered */
  emailSent: int("emailSent").default(0).notNull(), // 0 = no, 1 = yes
  /** Streak value at the time of the milestone */
  streakAtMilestone: int("streakAtMilestone").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StreakMilestone = typeof streakMilestones.$inferSelect;
export type InsertStreakMilestone = typeof streakMilestones.$inferInsert;

/**
 * Staff invitations — admin sends an invite link to a staff member.
 * When the staff member clicks the link and logs in, they are automatically
 * granted the 'staff' role (or 'admin' if specified).
 */
export const staffInvites = mysqlTable("staffInvites", {
  id: int("id").autoincrement().primaryKey(),
  /** Email address the invite was sent to */
  email: varchar("email", { length: 320 }).notNull(),
  /** Name of the invitee (optional, for the email greeting) */
  name: varchar("name", { length: 255 }),
  /** Unique token embedded in the invite link */
  token: varchar("token", { length: 128 }).notNull().unique(),
  /** Role to grant on acceptance: 'staff' or 'admin' */
  inviteRole: mysqlEnum("inviteRole", ["staff", "admin"]).default("staff").notNull(),
  /** Who sent the invite (admin user ID) */
  invitedBy: int("invitedBy").notNull(),
  /** Whether the invite has been accepted */
  accepted: int("accepted").default(0).notNull(), // 0 = pending, 1 = accepted
  /** When the invite was accepted */
  acceptedAt: timestamp("acceptedAt"),
  /** User ID of the person who accepted (populated on acceptance) */
  acceptedByUserId: int("acceptedByUserId"),
  /** When the invite expires (48 hours after creation) */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StaffInvite = typeof staffInvites.$inferSelect;
export type InsertStaffInvite = typeof staffInvites.$inferInsert;

// ─── Internal Communication ────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  /** 'staff' = admin/staff group chat; 'student' = direct message to a student */
  type: mysqlEnum("type", ["staff", "student"]).notNull().default("staff"),
  /** Display title for the conversation */
  title: varchar("title", { length: 255 }),
  /** User ID who created the conversation */
  createdBy: int("createdBy").notNull(),
  /** For student conversations: the enrollment ID of the student */
  enrollmentId: int("enrollmentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;

export const conversationParticipants = mysqlTable("conversationParticipants", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  /** When this participant last read the conversation */
  lastReadAt: timestamp("lastReadAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;

export const internalMessages = mysqlTable("internalMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderRole: mysqlEnum("senderRole", ["admin", "staff", "user"]).notNull().default("admin"),
  body: text("body").notNull(),
  /** When a student read this message (for student conversations) */
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InternalMessage = typeof internalMessages.$inferSelect;

// ─── Lead Magnet ──────────────────────────────────────────────────────────────
export const leadMagnetLeads = mysqlTable("leadMagnetLeads", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  source: varchar("source", { length: 100 }).default("popup").notNull(),
  guideTitle: varchar("guideTitle", { length: 255 }).default("5 Self-Defense Moves Every Parent Should Teach Their Child").notNull(),
  phone: varchar("phone", { length: 20 }),
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeadMagnetLead = typeof leadMagnetLeads.$inferSelect;
export type InsertLeadMagnetLead = typeof leadMagnetLeads.$inferInsert;

// ─── Admin Config ─────────────────────────────────────────────────────────────
/** Key-value store for admin-level settings (e.g., delete PIN hash) */
export const adminConfig = mysqlTable("adminConfig", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdminConfig = typeof adminConfig.$inferSelect;

// ─── Deletion Audit Log ───────────────────────────────────────────────────────
/** Immutable record of every lead/student deletion, including who did it */
export const deletionAuditLog = mysqlTable("deletionAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  /** Type of record deleted: 'lead' or 'student' */
  targetType: mysqlEnum("targetType", ["lead", "student"]).notNull(),
  /** Primary key of the deleted record */
  targetId: int("targetId").notNull(),
  /** Human-readable name of the deleted record (name at time of deletion) */
  targetName: varchar("targetName", { length: 255 }).notNull(),
  /** User ID of the admin/staff who performed the deletion */
  performedBy: int("performedBy").notNull(),
  /** Name of the admin/staff who performed the deletion */
  performedByName: varchar("performedByName", { length: 255 }).notNull(),
  /** Email of the admin/staff who performed the deletion */
  performedByEmail: varchar("performedByEmail", { length: 320 }).notNull(),
  /** Optional extra context (e.g., bulk delete count) */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DeletionAuditLog = typeof deletionAuditLog.$inferSelect;
export type InsertDeletionAuditLog = typeof deletionAuditLog.$inferInsert;

// ─── Day Passes ───────────────────────────────────────────────────────────────
/** Walk-in day pass purchases made at the kiosk */
export const dayPasses = mysqlTable("dayPasses", {
  id: int("id").autoincrement().primaryKey(),
  /** Guest name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Guest email */
  email: varchar("email", { length: 320 }).notNull(),
  /** Guest phone */
  phone: varchar("phone", { length: 30 }),
  /** Program they are attending */
  program: varchar("program", { length: 100 }).notNull(),
  /** Amount charged in cents (e.g. 2000 = $20.00) */
  amountCents: int("amountCents").notNull(),
  /** Payment processor transaction ID (Fluid Pay transaction ID) */
  paymentTransactionId: varchar("paymentTransactionId", { length: 255 }),
  /** Payment status: pending | paid | failed */
  status: mysqlEnum("status", ["pending", "paid", "failed"]).default("pending").notNull(),
  /** Attendance record ID created on successful check-in */
  attendanceId: int("attendanceId"),
  /** Class schedule ID they checked into */
  classId: int("classId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DayPass = typeof dayPasses.$inferSelect;
export type InsertDayPass = typeof dayPasses.$inferInsert;

// ─── Fluid Pay Webhook Events Log ─────────────────────────────────────────────
/**
 * Raw webhook event log for Fluid Pay notifications.
 * Every inbound webhook is stored here before processing so we can replay/debug.
 */
export const webhookEvents = mysqlTable("webhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  /** Fluid Pay transaction_id from the webhook envelope */
  fpTransactionId: varchar("fpTransactionId", { length: 255 }),
  /** Webhook type: transaction_create, transaction_update, etc. */
  eventType: varchar("eventType", { length: 100 }).notNull(),
  /** Transaction / subscription status from the payload */
  eventStatus: varchar("eventStatus", { length: 100 }),
  /** Fluid Pay subscription_id (present on recurring transactions) */
  fpSubscriptionId: varchar("fpSubscriptionId", { length: 255 }),
  /** Fluid Pay customer vault ID */
  fpCustomerId: varchar("fpCustomerId", { length: 255 }),
  /** Amount in cents */
  amountCents: int("amountCents"),
  /** Full raw JSON payload stored for debugging / replay */
  rawPayload: json("rawPayload"),
  /** Whether signature verification passed */
  signatureValid: boolean("signatureValid").default(false).notNull(),
  /** Processing result: pending | processed | ignored | error */
  processingStatus: mysqlEnum("processingStatus", ["pending", "processed", "ignored", "error"])
    .default("pending")
    .notNull(),
  /** Error message if processing failed */
  processingError: text("processingError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

// ─── Payment Failures ─────────────────────────────────────────────────────────
/**
 * Tracks individual payment failures for recurring subscriptions.
 * Used to send dunning emails and manage member status.
 */
export const paymentFailures = mysqlTable("paymentFailures", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the enrollment */
  enrollmentId: int("enrollmentId").notNull(),
  /** Fluid Pay transaction ID of the failed charge */
  fpTransactionId: varchar("fpTransactionId", { length: 255 }),
  /** Fluid Pay subscription ID */
  fpSubscriptionId: varchar("fpSubscriptionId", { length: 255 }),
  /** Amount that failed (in cents) */
  amountCents: int("amountCents"),
  /** Processor decline reason / message */
  failureReason: varchar("failureReason", { length: 500 }),
  /** Number of retry attempts so far */
  retryCount: int("retryCount").default(0).notNull(),
  /** Whether a dunning email was sent */
  emailSent: boolean("emailSent").default(false).notNull(),
  /** Status: open | resolved | written_off */
  status: mysqlEnum("status", ["open", "resolved", "written_off"]).default("open").notNull(),
  /** Webhook event ID that triggered this record */
  webhookEventId: int("webhookEventId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentFailure = typeof paymentFailures.$inferSelect;
export type InsertPaymentFailure = typeof paymentFailures.$inferInsert;

// ─── Belt Promotions Audit Log ────────────────────────────────────────────────
/**
 * Records every belt promotion performed by an admin/instructor.
 * Provides a full audit trail: who promoted whom, from which belt to which, and when.
 */
export const beltPromotions = mysqlTable("beltPromotions", {
  id: int("id").autoincrement().primaryKey(),
  /** Enrollment ID of the student being promoted */
  enrollmentId: int("enrollmentId").notNull(),
  /** Student's name at time of promotion */
  studentName: varchar("studentName", { length: 255 }).notNull(),
  /** Belt rank before promotion */
  fromBelt: varchar("fromBelt", { length: 100 }).notNull(),
  /** Belt rank after promotion */
  toBelt: varchar("toBelt", { length: 100 }).notNull(),
  /** Number of classes the student had at the old belt (reset to 0 after promotion) */
  classesAtPromotion: int("classesAtPromotion").notNull(),
  /** User ID of the admin/instructor who performed the promotion */
  promotedBy: int("promotedBy").notNull(),
  /** Name of the admin/instructor who performed the promotion */
  promotedByName: varchar("promotedByName", { length: 255 }).notNull(),
  /** Optional notes (e.g., "Awarded at Saturday ceremony") */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BeltPromotion = typeof beltPromotions.$inferSelect;
export type InsertBeltPromotion = typeof beltPromotions.$inferInsert;

// ─── Website Popup Leads ──────────────────────────────────────────────────────
/**
 * Stores leads captured from targeted website popups (e.g., Summer Camp, Kickboxing).
 * Each record is unique per email + campaign combination.
 */
export const popupLeads = mysqlTable("popupLeads", {
  id: int("id").autoincrement().primaryKey(),
  /** Campaign identifier: 'summer_camp' | 'kickboxing' */
  campaign: varchar("campaign", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  /** Where on the site the popup was triggered */
  source: varchar("source", { length: 100 }).default("popup").notNull(),
  /** Whether a confirmation/follow-up email was sent */
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PopupLead = typeof popupLeads.$inferSelect;
export type InsertPopupLead = typeof popupLeads.$inferInsert;

// ─── Child Profiles (Parent Self-Service) ─────────────────────────────────────
/**
 * Child profiles created by parents from the member portal.
 * Linked to the parent's user account. Stores name, DOB, program interest, and photo.
 */
export const childProfiles = mysqlTable("childProfiles", {
  id: int("id").autoincrement().primaryKey(),
  /** Parent's user ID (from users table) */
  userId: int("userId").notNull(),
  /** Child's full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Date of birth in YYYY-MM-DD format */
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  /** Program the child is interested in */
  program: mysqlEnum("program", ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Summer Camp", "Not Sure"]).default("Not Sure").notNull(),
  /** S3 URL for the child's photo */
  photoUrl: varchar("photoUrl", { length: 1000 }),
  /** S3 key for the child's photo (used for deletion) */
  photoKey: varchar("photoKey", { length: 500 }),
  /** Optional notes from the parent */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChildProfile = typeof childProfiles.$inferSelect;
export type InsertChildProfile = typeof childProfiles.$inferInsert;

// ─── Staff Commissions ─────────────────────────────────────────────────────────
/**
 * Commissions table.
 * Records a commission earned by a staff member when their assigned lead enrolls.
 * The bonus amount is pulled from adminConfig at time of enrollment.
 */
export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  /** Staff member who earned the commission */
  staffUserId: int("staffUserId").notNull(),
  /** Staff member name at time of commission (denormalized for history) */
  staffName: varchar("staffName", { length: 255 }).notNull(),
  /** The lead (trialSignup) that enrolled */
  leadId: int("leadId").notNull(),
  /** Lead name at time of commission */
  leadName: varchar("leadName", { length: 255 }).notNull(),
  /** Program the lead enrolled in */
  program: varchar("program", { length: 100 }).notNull(),
  /** Bonus amount in cents (e.g. 5000 = $50.00) */
  bonusAmountCents: int("bonusAmountCents").notNull(),
  /** Commission status: pending (earned, not yet paid) | paid | voided */
  status: mysqlEnum("status", ["pending", "paid", "voided"]).default("pending").notNull(),
  /** Admin notes (e.g., "Paid via check on 3/15") */
  adminNotes: text("adminNotes"),
  /** When the commission was marked as paid */
  paidAt: timestamp("paidAt"),
  /** Who marked it as paid (admin user ID) */
  paidByUserId: int("paidByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

// ─── Meal Plan (Kickboxing Program) ───────────────────────────────────────────

/**
 * Stores the health intake questionnaire answers for a member's meal plan.
 * One record per member (upsert on re-submission).
 */
export const mealPlanIntake = mysqlTable("mealPlanIntake", {
  id: int("id").autoincrement().primaryKey(),
  /** User ID (from users table) */
  userId: int("userId").notNull().unique(),
  /** Primary health goal(s) — JSON array of strings */
  goals: text("goals").notNull(), // JSON: ["lose_weight", "lower_blood_pressure", ...]
  /** Current weight in lbs */
  weightLbs: int("weightLbs"),
  /** Target weight in lbs */
  targetWeightLbs: int("targetWeightLbs"),
  /** Height in inches */
  heightInches: int("heightInches"),
  /** Age */
  age: int("age"),
  /** Biological sex for nutritional calculations */
  sex: mysqlEnum("sex", ["male", "female", "other"]),
  /** Activity level outside of kickboxing */
  activityLevel: mysqlEnum("activityLevel", ["sedentary", "light", "moderate", "active", "very_active"]),
  /** Any dietary restrictions — JSON array */
  dietaryRestrictions: text("dietaryRestrictions"), // JSON: ["vegetarian", "gluten_free", ...]
  /** Any health conditions to consider — JSON array */
  healthConditions: text("healthConditions"), // JSON: ["high_blood_pressure", "diabetes", ...]
  /** Number of meals per day preferred */
  mealsPerDay: int("mealsPerDay").default(3),
  /** Whether to include snacks */
  includeSnacks: int("includeSnacks").default(1), // 0/1 boolean
  /** Free-text notes from the member */
  additionalNotes: text("additionalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MealPlanIntake = typeof mealPlanIntake.$inferSelect;
export type InsertMealPlanIntake = typeof mealPlanIntake.$inferInsert;

/**
 * Stores AI-generated daily meal plans for a member.
 * A new plan is generated each day (or on demand).
 */
export const mealPlans = mysqlTable("mealPlans", {
  id: int("id").autoincrement().primaryKey(),
  /** User ID */
  userId: int("userId").notNull(),
  /** Date this plan is for (YYYY-MM-DD) */
  planDate: varchar("planDate", { length: 10 }).notNull(),
  /** Full meal plan as JSON — array of meals with name, foods, calories, macros */
  planJson: text("planJson").notNull(),
  /** Total estimated calories for the day */
  totalCalories: int("totalCalories"),
  /** Total protein in grams */
  totalProteinG: int("totalProteinG"),
  /** Total carbs in grams */
  totalCarbsG: int("totalCarbsG"),
  /** Total fat in grams */
  totalFatG: int("totalFatG"),
  /** Whether the member has marked this plan as completed */
  completed: int("completed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = typeof mealPlans.$inferInsert;
