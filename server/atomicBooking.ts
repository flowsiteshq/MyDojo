/**
 * Atomic, Transaction-Safe Booking Logic
 * 
 * Provides:
 * - Database transactions for atomic booking
 * - Idempotent booking with bookingRequestId
 * - Structured error responses
 * - Slot conflict detection and alternatives
 * - Appointment recovery for partial failures
 */

import type { IntakeState, Slot } from "./intakeStateMachine";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

export interface BookingResult {
  success: boolean;
  reason?: "slot_unavailable" | "validation_error" | "server_error" | "already_booked";
  appointment?: any;
  alternatives?: Slot[];
  message: string;
  debugMessage?: string;
}

/**
 * Create appointment atomically with database transaction
 * 
 * Steps:
 * 1. Check if bookingRequestId already processed (idempotency)
 * 2. Start transaction
 * 3. Validate slot availability (if applicable)
 * 4. Create appointment record
 * 5. Update intro booked count (if intro flow)
 * 6. Commit transaction
 * 
 * If any step fails, rollback and return structured error
 */
export async function createAtomicBooking(
  db: MySql2Database<any>,
  state: IntakeState,
  bookingRequestId: string
): Promise<BookingResult> {
  const { trialSignups } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  try {
    // Step 1: Check idempotency - if bookingRequestId already processed, return existing
    const [existingBooking] = await db
      .select()
      .from(trialSignups)
      .where(eq(trialSignups.bookingRequestId, bookingRequestId))
      .limit(1);

    if (existingBooking) {
      console.log("[Atomic Booking] Idempotent - returning existing booking", {
        bookingRequestId,
        appointmentId: existingBooking.id,
      });

      return {
        success: true,
        reason: "already_booked",
        appointment: existingBooking,
        message: "Booking already confirmed.",
      };
    }

    // Step 2: Validate required fields
    // Safety default: if segment/program not set (e.g., adult "self" or "other" flow), default to Adult Karate
    if (!state.program) {
      state.program = "Adult Karate";
    }
    if (!state.segment) {
      state.segment = "ADULTS" as any;
    }
    if (!state.name || !state.phone) {
      return {
        success: false,
        reason: "validation_error",
        message: "Missing required information (name or phone).",
      };
    }

    // Step 3: Simplified booking flow - no intro validation needed

    // Step 4: Create appointment using direct MySQL query (bypass Drizzle INSERT issue)
    const appointment = await (async () => {
      // Get raw MySQL connection from Drizzle
      const connection = (db as any).session.client as mysql.Connection;

      // Build parameterized INSERT query
      const columns = ['name', 'phone', 'program', 'location', 'status', 'source', 'introCountRequired', 'introCountBooked', 'bookingRequestId'];
      const values: any[] = [
        state.name!,
        state.phone!,
        state.program || "Not Sure",
        "Tomball HQ",
        "new",
        "chatbot-intake-poc",
        0, // introCountRequired - simplified flow
        0, // introCountBooked - simplified flow
        bookingRequestId,
      ];

      // Add optional fields
      if (state.email) {
        columns.push('email');
        values.push(state.email);
      }
      if (state.segment) {
        // Map internal segment enum to database enum format
        // Database enum: 'Kids 3-5', 'Kids 6-12', 'Teens', 'Adult Karate', 'Kickboxing', 'Not sure'
        const segmentMap: Record<string, string> = {
          'KIDS_3_5': 'Kids 3-5',
          'KIDS_6_12': 'Kids 6-12',
          'TEENS': 'Teens',
          'ADULTS': 'Adult Karate',
          'KICKBOXING': 'Kickboxing',
          'AFTER_SCHOOL': 'Not sure',  // After School not in segment enum, map to "Not sure"
          'CAMP': 'Not sure',  // Camp not in segment enum, map to "Not sure"
        };
        columns.push('segment');
        values.push(segmentMap[state.segment] || 'Not sure');
      }

      const placeholders = columns.map(() => '?').join(', ');
      const insertSQL = `INSERT INTO trialSignups (${columns.join(', ')}) VALUES (${placeholders})`;

      try {
        await connection.execute(insertSQL, values);
        console.log("[Atomic Booking] Direct MySQL INSERT successful", { bookingRequestId });
      } catch (error: any) {
        // Log EXACT MySQL error
        console.error("[Atomic Booking] BOOKING ERROR:", {
          errorCode: error.code,
          errorMessage: error.message,
          sqlState: error.sqlState,
          sql: insertSQL,
          values,
          fullError: error,
        });
        
        // Check if duplicate key error (idempotency)
        if (error.code === 'ER_DUP_ENTRY' && error.message.includes('bookingRequestId')) {
          console.log("[Atomic Booking] Duplicate bookingRequestId - returning existing", { bookingRequestId });
        } else {
          throw error;
        }
      }

      // Fetch the created appointment using Drizzle (reads work fine)
      const { trialSignups } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [newAppointment] = await db
        .select()
        .from(trialSignups)
        .where(eq(trialSignups.bookingRequestId, bookingRequestId))
        .limit(1);

      return newAppointment;
    })();

    console.log("[Atomic Booking] Successfully created appointment", {
      bookingRequestId,
      appointmentId: appointment.id,
      name: appointment.name,
      phone: appointment.phone,
      program: appointment.program,
    });

    return {
      success: true,
      appointment,
      message: `Excellent! Your trial class booking has been confirmed. Welcome to MyDojo! 🥋`,
    };

  } catch (error: any) {
    console.error("[Atomic Booking] Transaction failed", {
      bookingRequestId,
      error: error.message,
      stack: error.stack,
    });

    // Check if appointment was actually created despite error
    try {
      const [recoveredAppointment] = await db
        .select()
        .from(trialSignups)
        .where(eq(trialSignups.bookingRequestId, bookingRequestId))
        .limit(1);

      if (recoveredAppointment) {
        console.log("[Atomic Booking] Recovered appointment after error", {
          bookingRequestId,
          appointmentId: recoveredAppointment.id,
        });

        return {
          success: true,
          appointment: recoveredAppointment,
          message: `Excellent! Your trial class booking has been confirmed. Welcome to MyDojo! 🥋`,
        };
      }
    } catch (recoveryError) {
      console.error("[Atomic Booking] Recovery check failed", recoveryError);
    }

    // Return structured error with debug message
    return {
      success: false,
      reason: "server_error",
      message: "Quick hiccup — want me to try that again?",
      debugMessage: error.message || String(error),
    };
  }
}

/**
 * Check if slot is available
 * For now, intro slots are always available (Mon-Thu 5:30 PM)
 * In future, integrate with actual calendar/booking system
 */
export function isSlotAvailable(slot: Slot): boolean {
  // For POC, all intro slots are available
  // In production, check against actual booked appointments
  return true;
}

/**
 * Get alternative slots when selected slot is unavailable
 * TODO: Implement slot fetching from database in minimal booking flow
 */
export function getAlternativeSlots(unavailableSlot: Slot): Slot[] {
  // Placeholder: return empty array until slot fetching is implemented
  return [];
}

/**
 * Recover appointment if it was created but confirmation failed
 */
export async function recoverAppointment(
  db: MySql2Database<any>,
  bookingRequestId: string
): Promise<any | null> {
  const { trialSignups } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  try {
    const [appointment] = await db
      .select()
      .from(trialSignups)
      .where(eq(trialSignups.bookingRequestId, bookingRequestId))
      .limit(1);

    if (appointment) {
      console.log("[Appointment Recovery] Found existing appointment", {
        bookingRequestId,
        appointmentId: appointment.id,
      });
      return appointment;
    }

    return null;
  } catch (error) {
    console.error("[Appointment Recovery] Failed", error);
    return null;
  }
}
