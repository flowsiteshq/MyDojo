import type { ChatbotState } from "./chatgpt-chatbot";

/**
 * Deterministic State Machine for Chatbot Conversation Flow
 * Ensures the chatbot ALWAYS knows what the next question should be
 * This prevents the conversation from stalling at any point
 */

// Required fields in order
export const REQUIRED_FIELDS = [
  "name",
  "phone",
  "email", // optional but asked once
  "classFor",
  "program",
  "preferredDays",
  "slot",
  "confirmation"
] as const;

export type RequiredField = typeof REQUIRED_FIELDS[number];

export type ConversationStep = 
  | "greeting"
  | "collect_name"
  | "collect_phone"
  | "collect_email"
  | "collect_class_for"
  | "collect_age"
  | "collect_program"
  | "collect_preferred_days"
  | "show_slots"
  | "book_appointment"
  | "confirmation"
  | "complete";

export interface FlowControllerState extends ChatbotState {
  currentStep: ConversationStep;
  classFor?: "self" | "child" | "family";
  preferredDays?: "weekdays" | "weekends" | "either";
  emailAsked?: boolean; // Track if we've asked for email
  confirmed?: boolean; // Track if booking is confirmed
}

/**
 * Step Guards: Check if a step has been completed
 * Prevents re-asking questions that have already been answered
 */
export function isStepCompleted(step: ConversationStep, state: FlowControllerState): boolean {
  const completedSteps = state.completedSteps || [];
  if (completedSteps.includes(step)) return true;
  
  // Also check state fields as fallback
  switch (step) {
    case "collect_name": return !!state.name;
    case "collect_phone": return !!state.phone;
    case "collect_email": return completedSteps.includes("collect_email") || state.email !== undefined; // Completed if skipped (null) or provided
    case "collect_class_for": return !!state.classFor;
    case "collect_age": return !!state.childAge;
    case "collect_program": return !!state.program;
    case "collect_preferred_days": return !!state.preferredDays;
    case "show_slots": return !!state.scheduledTime;
    case "confirmation": return !!state.confirmed;
    default: return false;
  }
}

/**
 * NextStepEnforcer: Determines the next required field that's missing
 * WITH STEP GUARDS: Never returns a step that's already completed
 */
export function getNextMissingField(state: FlowControllerState): RequiredField | null {
  // STEP GUARD: If state.classFor exists => skip STEP_CLASS_FOR
  if (!state.name) return "name";
  if (!state.phone) return "phone";
  // STEP GUARD: Check if email step is completed (either skipped or provided)
  const emailStepCompleted = state.completedSteps?.includes("collect_email") || state.email !== undefined;
  if (!emailStepCompleted) return "email"; // Ask once, even if optional
  
  // STEP GUARD: If classFor already exists, skip this step
  if (!state.classFor) return "classFor";
  
  // STEP GUARD: If classFor is child and we don't have childAge yet, we need age before program
  if (state.classFor === "child" && !state.childAge) {
    // Age collection happens in collect_age step, but program is auto-determined
    // So we still need to ask for age, but program will be set automatically
    return "program"; // This will trigger age question via flow controller
  }
  
  // STEP GUARD: If program is already set (auto-determined from age), skip to preferredDays
  if (!state.program) return "program";
  if (!state.preferredDays) return "preferredDays";
  if (!state.scheduledTime) return "slot";
  if (state.scheduledTime && !state.confirmed) return "confirmation";
  return null; // All required fields collected
}

/**
 * Map required field to conversation step
 */
export function fieldToStep(field: RequiredField): ConversationStep {
  const mapping: Record<RequiredField, ConversationStep> = {
    name: "collect_name",
    phone: "collect_phone",
    email: "collect_email",
    classFor: "collect_class_for",
    program: "collect_program",
    preferredDays: "collect_preferred_days",
    slot: "show_slots",
    confirmation: "confirmation"
  };
  return mapping[field];
}

/**
 * Determine the next step in the conversation based on current state
 * WITH MONOTONIC PROGRESSION: Steps only move forward, never backwards
 */
export function getNextStep(state: FlowControllerState): ConversationStep {
  const nextField = getNextMissingField(state);
  
  if (!nextField) {
    return "complete"; // All fields collected
  }
  
  const nextStep = fieldToStep(nextField);
  
  // MONOTONIC PROGRESSION: If the next step is already completed, skip it
  if (isStepCompleted(nextStep, state)) {
    // Find the next uncompleted step
    const allSteps: ConversationStep[] = [
      "collect_name",
      "collect_phone",
      "collect_email",
      "collect_class_for",
      "collect_age",
      "collect_program",
      "collect_preferred_days",
      "show_slots",
      "confirmation"
    ];
    
    for (const step of allSteps) {
      if (!isStepCompleted(step, state)) {
        return step;
      }
    }
    
    return "complete"; // All steps completed
  }
  
  return nextStep;
}

/**
 * Get the question/message for a specific conversation step
 */
export function getStepMessage(step: ConversationStep, state: FlowControllerState): string {
  const { name, classFor } = state;

  switch (step) {
    case "greeting":
      return "Hey there! 👋 I'm Kai from MyDojo. Are you looking to sign up for a free trial class? I'd love to help you find the perfect program!";
    
    case "collect_name":
      return "Awesome! To get started, what's your first and last name?";
    
    case "collect_phone":
      return `Great, ${name}! What's the best phone number to reach you at? We'll use this to confirm your trial class appointment.`;
    
    case "collect_email":
      return "Perfect! And what's your email address? (This is optional - we'll use it to send you class schedules and updates. You can skip this if you prefer.)";
    
    case "collect_class_for":
      return "Now, who are these lessons for? Are you signing up for yourself, your child, or someone else?";
    
    case "collect_age":
      const childType = classFor === "child" ? "your child" : "they";
      return `How old is ${childType}?`;
    
    case "collect_program":
      // If classFor is child, ask for age instead of program list
      if (classFor === "child") {
        return "How old is your child?";
      }
      // For adults/self, ask which program they want
      return "Which program are you interested in? We offer Kickboxing, traditional martial arts, or both!";
    
    case "collect_preferred_days":
      return "Great choice! Do you prefer weekdays, weekends, or are you flexible with either?";
    
    case "show_slots":
      return "Perfect! Let me show you the available class times.";
    
    case "book_appointment":
      return "Which time works best for you?";
    
    case "confirmation":
      return "Perfect! You're all set! I've booked your trial class. You'll receive a confirmation shortly with all the details.";
    
    case "complete":
      return "Is there anything else I can help you with?";
    
    default:
      return "How can I help you today?";
  }
}

/**
 * Get quick-reply button options for a specific step
 */
export function getStepQuickReplies(step: ConversationStep): string[] | undefined {
  switch (step) {
    case "collect_class_for":
      return ["For Me", "For My Child", "For My Family"];
    
    case "collect_preferred_days":
      return ["Weekdays", "Weekends", "Either"];
    
    case "collect_email":
      return ["Skip"];
    
    default:
      return undefined;
  }
}

/**
 * Check if a field has been answered
 */
export function isFieldAnswered(field: RequiredField, state: FlowControllerState): boolean {
  switch (field) {
    case "name":
      return !!state.name;
    case "phone":
      return !!state.phone;
    case "email":
      return !!state.emailAsked; // Track if asked, not if answered
    case "classFor":
      return !!state.classFor;
    case "program":
      return !!state.program;
    case "preferredDays":
      return !!state.preferredDays;
    case "slot":
      return !!state.scheduledTime;
    case "confirmation":
      return !!state.confirmed;
    default:
      return false;
  }
}
