import { eq } from "drizzle-orm";
import { users, InsertUser, User } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new user with email/password authentication
 */
export async function createUser(userData: {
  email: string;
  passwordHash: string;
  name?: string;
}): Promise<User> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [user] = await db
    .insert(users)
    .values({
      email: userData.email,
      passwordHash: userData.passwordHash,
      name: userData.name || null,
      loginMethod: "email",
      emailVerified: 0,
    })
    .$returningId();

  // Fetch the created user
  const [createdUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id));

  if (!createdUser) {
    throw new Error("Failed to create user");
  }

  return createdUser;
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

/**
 * Find a user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

/**
 * Update user's last sign-in timestamp
 */
export async function updateLastSignIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Update user's password
 */
export async function updatePassword(
  userId: number,
  passwordHash: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(users.id, userId));
}

/**
 * Set password reset token
 */
export async function setResetToken(
  email: string,
  token: string,
  expiry: Date
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(users)
    .set({ resetToken: token, resetTokenExpiry: expiry })
    .where(eq(users.email, email));
}

/**
 * Find user by reset token
 */
export async function findUserByResetToken(
  token: string
): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token));

  if (!user || !user.resetTokenExpiry) {
    return null;
  }

  // Check if token is expired
  if (new Date() > user.resetTokenExpiry) {
    return null;
  }

  return user;
}

/**
 * Verify user's email
 */
export async function verifyEmail(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ emailVerified: 1 }).where(eq(users.id, userId));
}
