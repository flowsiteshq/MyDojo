/**
 * Booking Validation and Idempotent Booking Logic
 * 
 * Provides preflight validation and idempotent booking to prevent:
 * - Double-bookings from double-taps
 * - Slot conflicts
 * - Missing required fields
 * - Invalid state transitions
 */

import type { IntakeState } from "./intakeStateMachine";
import { IntakeStep, Segment } from "./intakeStateMachine";

export interface BookingValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BookingPreflightCheck {
  hasRequiredFields: boolean;
  hasValidProgram: boolean;
  meetsIntroRequirements: boolean;
  isReadyForBooking: boolean;
  missingFields: string[];
  validationErrors: string[];
}

/**
 * Preflight validation before creating booking
 * Checks all required fields and business rules
 */
export function validateBookingPreflight(state: IntakeState): BookingPreflightCheck {
  const missingFields: string[] = [];
  const validationErrors: string[] = [];

  // Check required fields
  if (!state.name) missingFields.push("name");
  if (!state.phone) missingFields.push("phone");
  if (!state.program) missingFields.push("program");
  if (!state.classFor) missingFields.push("classFor");

  // Check child-specific requirements
  if (state.classFor === "child") {
    if (!state.childAge) {
      missingFields.push("childAge");
    }
    if (!state.segment) {
      missingFields.push("segment");
    }
  }

  // Simplified booking flow - no intro slot validation needed
  // User selects a single slot in SLOTS step

  // Check if state is at BOOK step (ready for booking)
  const isReadyForBooking = 
    state.currentStep === IntakeStep.BOOK;
  if (!isReadyForBooking) {
    validationErrors.push(
      `Booking can only be created at CONFIRMATION step. Current step: ${state.currentStep}`
    );
  }

  return {
    hasRequiredFields: missingFields.length === 0,
    hasValidProgram: !!state.program,
    meetsIntroRequirements: true, // Simplified booking flow - no intro requirements
    isReadyForBooking,
    missingFields,
    validationErrors,
  };
}

/**
 * Check if a booking request ID already exists
 * Returns existing trial signup if found
 */
export async function checkExistingBooking(
  db: any,
  bookingRequestId: string
): Promise<any | null> {
  const { trialSignups } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const [existing] = await db
    .select()
    .from(trialSignups)
    .where(eq(trialSignups.bookingRequestId, bookingRequestId))
    .limit(1);

  return existing || null;
}

/**
 * Create idempotent booking
 * If bookingRequestId exists, return existing booking
 * Otherwise create new booking
 */
export async function createIdempotentBooking(
  db: any,
  state: IntakeState,
  bookingRequestId: string
): Promise<{ booking: any; isNew: boolean }> {
  // Check if booking already exists
  const existing = await checkExistingBooking(db, bookingRequestId);
  
  if (existing) {
    return { booking: existing, isNew: false };
  }

  // Create new booking
  const { trialSignups } = await import("../drizzle/schema");
  
  const bookingData = {
    name: state.name!,
    phone: state.phone!,
    email: state.email || undefined,
    program: (state.program || "Not Sure") as any,
    segment: state.segment as any,
    location: "Tomball HQ",
    source: "chatbot-intake-poc",
    status: "new" as any,
    introCountRequired: 0, // Simplified booking flow
    introCountBooked: 0, // Simplified booking flow
    bookingRequestId,
  };

  const [newBooking] = await db
    .insert(trialSignups)
    .values(bookingData)
    .$returningId();

  // Fetch the created booking
  const { eq } = await import("drizzle-orm");
  const [booking] = await db
    .select()
    .from(trialSignups)
    .where(eq(trialSignups.id, newBooking.id))
    .limit(1);

  return { booking, isNew: true };
}

/**
 * Generate friendly error message for validation failures
 */
export function getValidationErrorMessage(check: BookingPreflightCheck): string {
  if (check.missingFields.length > 0) {
    return `Missing required information: ${check.missingFields.join(", ")}. Please complete the intake flow first.`;
  }

  if (check.validationErrors.length > 0) {
    return check.validationErrors[0]; // Return first error
  }

  return "Unable to create booking. Please try again.";
}

/**
 * Log booking error for debugging
 */
export function logBookingError(context: {
  conversationId: string;
  leadId?: number;
  selectedSlotId?: string;
  nextStep: string;
  bookingRequestId: string;
  error: Error;
}) {
  console.error("[Booking Error]", {
    timestamp: new Date().toISOString(),
    conversationId: context.conversationId,
    leadId: context.leadId,
    selectedSlotId: context.selectedSlotId,
    nextStep: context.nextStep,
    bookingRequestId: context.bookingRequestId,
    errorMessage: context.error.message,
    errorStack: context.error.stack,
  });
}
