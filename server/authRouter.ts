import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  createUser,
  findUserByEmail,
  updateLastSignIn,
  setResetToken,
  findUserByResetToken,
  updatePassword,
} from "./authDb";
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateResetToken,
} from "./auth";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";

const TOKEN_COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Authentication router for email/password authentication
 */
export const authRouter = router({
  /**
   * Register a new user
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(100, "Password is too long"),
        name: z.string().min(1, "Name is required").max(255),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already exists
      const existingUser = await findUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      const user = await createUser({
        email: input.email,
        passwordHash,
        name: input.name,
      });

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req!);
      ctx.res?.cookie(TOKEN_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: COOKIE_MAX_AGE * 1000, // Convert to milliseconds
      });

      // Update last sign-in
      await updateLastSignIn(user.id);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Find user by email
      const user = await findUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(
        input.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req!);
      ctx.res?.cookie(TOKEN_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: COOKIE_MAX_AGE * 1000, // Convert to milliseconds
      });

      // Update last sign-in
      await updateLastSignIn(user.id);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  /**
   * Logout (clear auth cookie)
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req!);
    ctx.res?.clearCookie(TOKEN_COOKIE_NAME, cookieOptions);

    return { success: true };
  }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true };
      }

      // Generate reset token
      const token = generateResetToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await setResetToken(input.email, token, expiry);

      // TODO: Send email with reset link
      // For now, just log it (in production, use an email service)
      console.log(`Password reset token for ${input.email}: ${token}`);
      console.log(`Reset link: ${process.env.VITE_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`);

      return { success: true };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(100, "Password is too long"),
      })
    )
    .mutation(async ({ input }) => {
      // Find user by reset token
      const user = await findUserByResetToken(input.token);
      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(input.password);

      // Update password and clear reset token
      await updatePassword(user.id, passwordHash);

      return { success: true };
    }),
});
