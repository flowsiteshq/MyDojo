/**
 * Deterministic State Machine for Trial Chatbot
 * 
 * This module provides the SINGLE SOURCE OF TRUTH for conversation flow.
 * It prevents repeated questions, dead ends, and conversation stalls.
 */

import type { ConversationState } from "../drizzle/schema";

// Conversation steps enum
export enum ConversationStep {
  NAME = "NAME",
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  CLASS_FOR = "CLASS_FOR",
  CHILD_AGE = "CHILD_AGE",
  SEGMENT = "SEGMENT",
  INTRO_SLOTS = "INTRO_SLOTS",
  TRIAL_SLOTS = "TRIAL_SLOTS",
  CONFIRMATION = "CONFIRMATION",
}

// Segment types
export enum Segment {
  KIDS_3_5 = "KIDS_3_5",
  KIDS_6_12 = "KIDS_6_12",
  TEENS = "TEENS",
  ADULTS = "ADULTS",
  KICKBOXING = "KICKBOXING",
  CAMP = "CAMP",
  AFTER_SCHOOL = "AFTER_SCHOOL",
}

// Program mapping
export const SEGMENT_TO_PROGRAM: Record<Segment, string> = {
  [Segment.KIDS_3_5]: "Little Ninjas",
  [Segment.KIDS_6_12]: "Dragon Kids",
  [Segment.TEENS]: "Teens",
  [Segment.ADULTS]: "Adult Karate",
  [Segment.KICKBOXING]: "Kickboxing",
  [Segment.CAMP]: "Summer Camp",
  [Segment.AFTER_SCHOOL]: "After School",
};

/**
 * Resolve the next step in the conversation based on current state.
 * This is the ONLY function that determines conversation flow.
 * 
 * Flow order:
 * 1. NAME - Get user's name
 * 2. PHONE - Get phone number
 * 3. EMAIL - Get email (or allow skip)
 * 4. CLASS_FOR - Who is the class for (self/child/other)
 * 5. CHILD_AGE - If child, get age (3-17)
 * 6. SEGMENT - Auto-determined from age/classFor
 * 7. INTRO_SLOTS - Book 2 intro classes for kids 3-12
 * 8. TRIAL_SLOTS - Book trial class for teens/adults
 * 9. CONFIRMATION - Final confirmation
 */
export function resolveNextStep(state: Partial<ConversationState>): ConversationStep {
  // Parse askedKeys from JSON if needed
  const askedKeys: string[] = state.askedKeys ? JSON.parse(state.askedKeys) : [];

  // Step 1: NAME
  if (!state.name) {
    return ConversationStep.NAME;
  }

  // Step 2: PHONE
  if (!state.phone) {
    return ConversationStep.PHONE;
  }

  // Step 3: EMAIL (can be skipped)
  if (!state.email && !state.emailSkipped && !askedKeys.includes("email")) {
    return ConversationStep.EMAIL;
  }

  // Step 4: CLASS_FOR
  if (!state.classFor) {
    return ConversationStep.CLASS_FOR;
  }

  // Step 5: CHILD_AGE (only if classFor === "child")
  if (state.classFor === "child" && !state.childAge) {
    return ConversationStep.CHILD_AGE;
  }

  // Step 6: SEGMENT (auto-determined, but check if set)
  if (!state.segment) {
    return ConversationStep.SEGMENT;
  }

  // Step 7: INTRO_SLOTS (for kids 3-12 who need 2 intro classes)
  if (state.introRequired && (state.introBookedCount ?? 0) < 2) {
    return ConversationStep.INTRO_SLOTS;
  }

  // Step 8: TRIAL_SLOTS (for teens/adults or after intros)
  const introSlots = state.introSlots ? JSON.parse(state.introSlots) : [];
  const trialSlot = state.trialSlot ? JSON.parse(state.trialSlot) : null;
  
  if (!state.introRequired && !trialSlot) {
    return ConversationStep.TRIAL_SLOTS;
  }

  // Step 9: CONFIRMATION
  return ConversationStep.CONFIRMATION;
}

/**
 * Auto-determine segment and program based on classFor and childAge
 */
export function determineSegment(
  classFor: "self" | "child" | "other" | null,
  childAge: number | null
): { segment: Segment | null; program: string | null; introRequired: boolean } {
  if (classFor === "child" && childAge) {
    if (childAge >= 3 && childAge <= 5) {
      return {
        segment: Segment.KIDS_3_5,
        program: SEGMENT_TO_PROGRAM[Segment.KIDS_3_5],
        introRequired: true,
      };
    } else if (childAge >= 6 && childAge <= 12) {
      return {
        segment: Segment.KIDS_6_12,
        program: SEGMENT_TO_PROGRAM[Segment.KIDS_6_12],
        introRequired: true,
      };
    } else if (childAge >= 13 && childAge <= 17) {
      return {
        segment: Segment.TEENS,
        program: SEGMENT_TO_PROGRAM[Segment.TEENS],
        introRequired: false,
      };
    }
  } else if (classFor === "self") {
    // Default to adults for self
    return {
      segment: Segment.ADULTS,
      program: SEGMENT_TO_PROGRAM[Segment.ADULTS],
      introRequired: false,
    };
  }

  return { segment: null, program: null, introRequired: false };
}

/**
 * Check if a field has already been asked (to prevent re-asking)
 */
export function hasAskedKey(state: Partial<ConversationState>, key: string): boolean {
  const askedKeys: string[] = state.askedKeys ? JSON.parse(state.askedKeys) : [];
  return askedKeys.includes(key) || !!state[key as keyof ConversationState];
}

/**
 * Add a key to the askedKeys array
 */
export function markKeyAsAsked(state: Partial<ConversationState>, key: string): string {
  const askedKeys: string[] = state.askedKeys ? JSON.parse(state.askedKeys) : [];
  if (!askedKeys.includes(key)) {
    askedKeys.push(key);
  }
  return JSON.stringify(askedKeys);
}

/**
 * Get intro class slots (Mon-Thu @ 5:30 PM)
 */
export function getIntroSlots(): Array<{ day: string; time: string; date: string }> {
  const slots = [];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday"];
  const time = "5:30 PM";

  // Get next 4 weeks of Mon-Thu slots
  const today = new Date();
  for (let i = 0; i < 28; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    if (days.includes(dayName)) {
      slots.push({
        day: dayName,
        time,
        date: date.toISOString().split("T")[0], // YYYY-MM-DD
      });
    }
  }

  return slots.slice(0, 12); // Return next 12 intro slots
}

/**
 * Validate state transition
 * Returns error message if transition is invalid, null if valid
 */
export function validateStateTransition(
  currentState: Partial<ConversationState>,
  updates: Partial<ConversationState>
): string | null {
  // Prevent changing already-set fields unless explicitly allowed
  const protectedFields = ["name", "phone", "email", "classFor", "childAge"];

  for (const field of protectedFields) {
    const key = field as keyof ConversationState;
    if (currentState[key] && updates[key] && currentState[key] !== updates[key]) {
      return `Cannot change ${field} once set. Use "Change" button to modify.`;
    }
  }

  // Validate phone format
  if (updates.phone) {
    const digitsOnly = updates.phone.replace(/\D/g, "");
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      return "Phone number must be 10-11 digits";
    }
  }

  // Validate child age range
  if (updates.childAge !== undefined && updates.childAge !== null) {
    if (updates.childAge < 3 || updates.childAge > 17) {
      return "Child age must be between 3 and 17";
    }
  }

  return null;
}
