/**
 * Minimal Deterministic Intake State Machine
 * 
 * 7-step booking-only flow: NAME → PHONE → EMAIL → CLASS_FOR → AGE → SLOTS → BOOK
 * No enrollment, no intent detection, no flowMode switching, no dynamic branching.
 * Goal: 100% reliability without loops, stalls, or DB errors.
 */

import { parseName, parsePhone, parseEmail, isEmailSkipIntent, normalize, parseAge, parseClassFor, parseChildName } from "./inputNormalization";

// Intake steps - Trial-First Strategy (MASS Training)
export enum IntakeStep {
  // Contact Information
  NAME = "NAME",
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  
  // Rapport Building
  CLASS_FOR = "CLASS_FOR",
  CHILD_NAME = "CHILD_NAME",
  CHILD_AGE = "CHILD_AGE",
  RAPID_RAPPORT_ADULT = "RAPID_RAPPORT_ADULT",  // NEW: For adult students - prior training
  
  // Emotional Discovery (NEW - MASS Training Core)
  EMOTIONAL_DISCOVERY = "EMOTIONAL_DISCOVERY",  // What do you want to improve? What would be different?
  
  // Trial-First Flow (NEW)
  TRIAL_TRANSITION = "TRIAL_TRANSITION",  // Frame trial + create urgency
  FAST_FIRST_LESSON = "FAST_FIRST_LESSON",  // Offer 2 specific time slots
  SECONDARY_DECISION_MAKER = "SECONDARY_DECISION_MAKER",  // Check for spouse/partner
  PAYMENT_POSITIONING = "PAYMENT_POSITIONING",  // Secure trial payment
  ENROLLMENT_PREFRAME = "ENROLLMENT_PREFRAME",  // Pre-frame membership after first lesson
  
  // Hidden Enrollment Path (only triggered by explicit request)
  INTENT = "INTENT",  // Hidden: only shown if user explicitly requests enrollment
  PLAN_SELECTION = "PLAN_SELECTION",  // Hidden enrollment path
  
  // Location & Scheduling
  LOCATION = "LOCATION",
  SLOTS = "SLOTS",  // Legacy: replaced by FAST_FIRST_LESSON for trial flow
  
  // Completion
  CONFIRM = "CONFIRM",
  BOOK = "BOOK",
  COMPLETE = "COMPLETE",
}

// Segment types (simplified)
export enum Segment {
  KIDS_3_5 = "KIDS_3_5",       // Little Ninjas
  KIDS_6_12 = "KIDS_6_12",     // Dragon Kids
  TEENS = "TEENS",              // Teens
  ADULTS = "ADULTS",            // Adult Karate
}

// Program mapping
export const SEGMENT_TO_PROGRAM: Record<Segment, string> = {
  [Segment.KIDS_3_5]: "Little Ninjas",
  [Segment.KIDS_6_12]: "Dragon Kids",
  [Segment.TEENS]: "Teens",
  [Segment.ADULTS]: "Adult Karate",
};

// Slot type
export interface Slot {
  id: string;
  day: string;
  date: string; // YYYY-MM-DD
  time: string;
  displayText: string;
}

// Intake state
export interface ChildInfo {
  name?: string;
  age: number | null;
  segment: Segment | null;
  program: string | null;
  selectedSlot: Slot | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface IntakeState {
  sessionId: string;
  currentStep: IntakeStep;
  completedSteps: IntakeStep[];  // RELIABILITY KERNEL: prevent repeating steps
  askedKeys: string[];            // RELIABILITY KERNEL: prevent re-asking fields
  name: string | null;
  phone: string | null;
  email: string | null;
  emailSkipped: boolean;
  classFor: "self" | "child" | "other" | null;
  childName: string | null;  // Child's name for personalization
  intent: "trial" | "enroll" | "summer_camp" | "after_school" | null;  // User's intent: trial class, enrollment, summer camp, or after school
  selectedLocation: string | null;  // Selected location (e.g., "Tomball HQ")
  selectedPlanId: number | null;  // Selected membership plan ID
  childAge: number | null;
  segment: Segment | null;
  program: string | null;
  selectedSlot: Slot | null;
  
  // NEW - Trial-First Strategy (MASS Training)
  emotionalGoal: string | null;  // What they want to improve (confidence, discipline, etc.)
  emotionalImpact: string | null;  // What would be different if they achieved that
  priorTraining: boolean | null;  // For adults: Have you trained before?
  skipTrial: boolean;  // Hidden enrollment path trigger (only if explicitly requested)
  secondaryDecisionMaker: string | null;  // Spouse, partner, other decision maker
  offeredSlots: Slot[];  // The 2 specific slots offered in FAST_FIRST_LESSON
  
  // Multi-child support
  multipleChildren: boolean;  // Whether enrolling multiple children
  childCount: number;  // Total number of children to enroll
  children: ChildInfo[];  // Array of child information
  currentChildIndex: number;  // Which child we're currently collecting info for (0-based)
  // Conversation memory
  messageHistory: ChatMessage[];  // Last 5 messages for context
  intakeComplete: boolean;
}

// Response from state machine
export interface IntakeResponse {
  assistantMessage: string;
  state: IntakeState;
  collectedFields: {
    name: string | null;
    phone: string | null;
    email: string | null;
    classFor: string | null;
    childAge: number | null;
    segment: string | null;
    program: string | null;
  };
  nextExpectedField: IntakeStep | null;
  availableSlots?: Slot[];
  membershipPlans?: any[];  // Membership plans for enrollment flow
  quickReplies?: string[];
  error: string | null;
}

/**
 * Initialize new intake state
 */
export function initializeIntakeState(sessionId: string): IntakeState {
  return {
    sessionId,
    currentStep: IntakeStep.CLASS_FOR,  // Trial-First: Start with "Who is this for?"
    completedSteps: [],
    askedKeys: [],
    name: null,
    phone: null,
    email: null,
    emailSkipped: false,
    classFor: null,
    childName: null,
    intent: null,  // Hidden: only set if user explicitly requests enrollment
    selectedLocation: null,
    selectedPlanId: null,
    childAge: null,
    segment: null,
    program: null,
    selectedSlot: null,
    
    // NEW - Trial-First Strategy
    emotionalGoal: null,
    emotionalImpact: null,
    priorTraining: null,
    skipTrial: false,  // Default: everyone goes through trial unless explicitly requested
    secondaryDecisionMaker: null,
    offeredSlots: [],
    
    multipleChildren: false,
    childCount: 0,
    children: [],
    currentChildIndex: 0,
    messageHistory: [],
    intakeComplete: false,
  };
}

/**
 * Get initial greeting - Trial-First Strategy (MASS Training)
 * Warm, confident, immediate engagement - guide, don't ask
 */
export function getInitialGreeting(userName?: string): string {
  const greeting = userName 
    ? `Hi ${userName}! I'm Kai from MyDojo.`
    : "Hi! I'm Kai from MyDojo.";
  
  return `${greeting} I saw you were looking into our martial arts programs. I'd love to help you get started!\n\nAre these lessons for you or for your child?`;
}

/**
 * Add message to conversation history (max 5 messages)
 */
function addToMessageHistory(state: IntakeState, role: "user" | "assistant", content: string): void {
  const message: ChatMessage = {
    role,
    content,
    timestamp: Date.now(),
  };
  
  state.messageHistory.push(message);
  
  // Keep only last 5 messages
  if (state.messageHistory.length > 5) {
    state.messageHistory = state.messageHistory.slice(-5);
  }
}

/**
 * Resolve next step based on current state - Trial-First Strategy (MASS Training)
 * RELIABILITY KERNEL: Single source of truth for step transitions
 * 
 * Flow:
 * 1. CLASS_FOR → Who is this for?
 * 2. CHILD_NAME (if child) → Child's name
 * 3. CHILD_AGE (if child) → Determine program
 * 4. RAPID_RAPPORT_ADULT (if adult) → Prior training?
 * 5. EMOTIONAL_DISCOVERY → What do you want to improve? What would be different?
 * 6. TRIAL_TRANSITION → Frame trial + urgency
 * 7. LOCATION (if multiple) → Select location
 * 8. FAST_FIRST_LESSON → Offer 2 specific slots
 * 9. SECONDARY_DECISION_MAKER → Check for spouse/partner
 * 10. Contact info (NAME → PHONE → EMAIL) if not collected
 * 11. PAYMENT_POSITIONING → Secure trial payment
 * 12. ENROLLMENT_PREFRAME → Pre-frame membership
 * 13. COMPLETE
 * 
 * Hidden Enrollment Path (only if skipTrial = true):
 * - After CLASS_FOR → PLAN_SELECTION → Contact → Payment → COMPLETE
 */
function resolveNextStep(state: IntakeState): IntakeStep {
  // Hidden Enrollment Path (only if explicitly requested)
  if (state.skipTrial) {
    if (!state.selectedPlanId && !state.completedSteps.includes(IntakeStep.PLAN_SELECTION)) {
      return IntakeStep.PLAN_SELECTION;
    }
    // After plan selection, collect contact info if needed
    if (!state.name && !state.completedSteps.includes(IntakeStep.NAME)) {
      return IntakeStep.NAME;
    }
    if (!state.phone && !state.completedSteps.includes(IntakeStep.PHONE)) {
      return IntakeStep.PHONE;
    }
    if (!state.email && !state.emailSkipped && !state.completedSteps.includes(IntakeStep.EMAIL)) {
      return IntakeStep.EMAIL;
    }
    // Skip to payment/completion for enrollment
    return IntakeStep.COMPLETE;
  }
  
  // Standard Trial-First Flow
  
  // 1. Who is this for?
  if (!state.classFor && !state.completedSteps.includes(IntakeStep.CLASS_FOR)) {
    return IntakeStep.CLASS_FOR;
  }
  
  // 2. Child's name (for personalization)
  if (state.classFor === "child" && !state.childName && !state.completedSteps.includes(IntakeStep.CHILD_NAME)) {
    return IntakeStep.CHILD_NAME;
  }
  
  // 3. Child's age (determine program/segment)
  if (state.classFor === "child" && !state.childAge && !state.completedSteps.includes(IntakeStep.CHILD_AGE)) {
    return IntakeStep.CHILD_AGE;
  }
  
  // 4. Rapid rapport for adults (prior training?)
  if (state.classFor === "self" && state.priorTraining === null && !state.completedSteps.includes(IntakeStep.RAPID_RAPPORT_ADULT)) {
    return IntakeStep.RAPID_RAPPORT_ADULT;
  }
  
  // 5. Emotional Discovery (What do you want to improve?)
  if (!state.emotionalGoal && !state.completedSteps.includes(IntakeStep.EMOTIONAL_DISCOVERY)) {
    return IntakeStep.EMOTIONAL_DISCOVERY;
  }
  
  // 5b. Emotional Discovery Part 2 (What would be different?)
  if (state.emotionalGoal && !state.emotionalImpact && !state.completedSteps.includes(IntakeStep.EMOTIONAL_DISCOVERY)) {
    return IntakeStep.EMOTIONAL_DISCOVERY;  // Still in emotional discovery, asking follow-up
  }
  
  // 6. Trial Transition (frame trial + urgency)
  if (!state.completedSteps.includes(IntakeStep.TRIAL_TRANSITION)) {
    return IntakeStep.TRIAL_TRANSITION;
  }
  
  // 7. Location selection (if multiple locations exist)
  // TODO: Check if multiple locations exist, for now assume single location
  // if (!state.selectedLocation && multipleLocations && !state.completedSteps.includes(IntakeStep.LOCATION)) {
  //   return IntakeStep.LOCATION;
  // }
  
  // 8. Fast First Lesson (offer 2 specific slots)
  if (!state.selectedSlot && !state.completedSteps.includes(IntakeStep.FAST_FIRST_LESSON)) {
    return IntakeStep.FAST_FIRST_LESSON;
  }
  
  // 9. Secondary Decision Maker (spouse/partner?)
  if (!state.secondaryDecisionMaker && !state.completedSteps.includes(IntakeStep.SECONDARY_DECISION_MAKER)) {
    return IntakeStep.SECONDARY_DECISION_MAKER;
  }
  
  // 10. Collect contact info if not already done
  if (!state.name && !state.completedSteps.includes(IntakeStep.NAME)) {
    return IntakeStep.NAME;
  }
  if (!state.phone && !state.completedSteps.includes(IntakeStep.PHONE)) {
    return IntakeStep.PHONE;
  }
  if (!state.email && !state.emailSkipped && !state.completedSteps.includes(IntakeStep.EMAIL)) {
    return IntakeStep.EMAIL;
  }
  
  // 11. Payment Positioning (secure trial payment)
  if (!state.completedSteps.includes(IntakeStep.PAYMENT_POSITIONING)) {
    return IntakeStep.PAYMENT_POSITIONING;
  }
  
  // 12. Enrollment Preframe (pre-frame membership after first lesson)
  if (!state.completedSteps.includes(IntakeStep.ENROLLMENT_PREFRAME)) {
    return IntakeStep.ENROLLMENT_PREFRAME;
  }
  
  // 13. Complete
  return IntakeStep.COMPLETE;
}

/**
 * Process user message through state machine
 * RELIABILITY KERNEL: Normalize inputs BEFORE committing state, commit state BEFORE generating response
 */
export function processIntakeMessage(state: IntakeState, userMessage: string): IntakeResponse {
  // Add user message to history (skip if empty and we're auto-advancing)
  if (userMessage) {
    addToMessageHistory(state, "user", userMessage);
  }
  
  const normalizedInput = normalize(userMessage);
  const currentStep = state.currentStep;

  // Messaging-only steps that don't require user input
  const messagingOnlySteps = [
    IntakeStep.TRIAL_TRANSITION,
    IntakeStep.PAYMENT_POSITIONING,
    IntakeStep.ENROLLMENT_PREFRAME
  ];
  
  // Skip validation for messaging-only steps
  if (messagingOnlySteps.includes(currentStep)) {
    // These steps just deliver messages and auto-advance
    // No validation needed
  } else {
    // RELIABILITY KERNEL: Check if we've already asked this field
    const fieldKey = `${currentStep}`;
    if (state.askedKeys.includes(fieldKey) && !normalizedInput) {
      // User sent empty message after we already asked - don't re-ask
      const response = {
        assistantMessage: "I didn't catch that. Could you please provide the information?",
        state,
        collectedFields: getCollectedFields(state),
        nextExpectedField: currentStep,
        quickReplies: currentStep === IntakeStep.EMAIL ? ["Skip"] : [],
        error: null,
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      return response;
    }
  }

  // Process based on current step
  switch (currentStep) {
    case IntakeStep.NAME: {
      const nameResult = parseName(normalizedInput);
      if (nameResult.valid && nameResult.name) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.name = nameResult.name;
        state.completedSteps.push(IntakeStep.NAME);
        state.askedKeys.push("NAME");
        state.currentStep = resolveNextStep(state);

        // Detect intent to enroll child/son/daughter
        const enrollChildIntent = /(?:enroll|sign up|register|book).*(?:my son|my daughter|my child|my kid|son|daughter|child)/i.test(userMessage);
        
        // Auto-detect classFor when child is mentioned
        if (enrollChildIntent) {
          state.classFor = "child";
          state.completedSteps.push(IntakeStep.CLASS_FOR);
          state.askedKeys.push("CLASS_FOR");
          
          // BUGFIX: Also set intent to "enroll" when enrollment keywords are detected
          if (/enroll|membership/i.test(userMessage)) {
            state.intent = "enroll";
            state.completedSteps.push(IntakeStep.INTENT);
            state.askedKeys.push("INTENT");
          }
        }
        
        // Detect multiple children mentions
        const multiChildPatterns = [
          /(two|2|three|3|four|4|five|5)\s*(?:sons|daughters|kids|children)/i,
          /both\s*(?:my|of my)?\s*(?:sons|daughters|kids|children)/i,
          /all\s*(?:my|of my)?\s*(?:sons|daughters|kids|children)/i,
          /my\s*(\d+)\s*(?:sons|daughters|kids|children)/i,
        ];
        
        let multipleChildren = false;
        let childCount = 0;
        for (const pattern of multiChildPatterns) {
          const match = userMessage.match(pattern);
          if (match) {
            multipleChildren = true;
            // Extract number
            if (match[1]) {
              const numStr = match[1].toLowerCase();
              const numMap: Record<string, number> = {
                'two': 2, '2': 2,
                'three': 3, '3': 3,
                'four': 4, '4': 4,
                'five': 5, '5': 5,
                'both': 2,
                'all': 2, // Default to 2 if "all" without number
              };
              childCount = numMap[numStr] || parseInt(numStr, 10) || 2;
            } else if (match[0].includes('both')) {
              childCount = 2;
            }
            break;
          }
        }
        
        // Store multi-child state
        if (multipleChildren && childCount > 0) {
          state.multipleChildren = true;
          state.childCount = childCount;
          // Initialize children array
          state.children = Array.from({ length: childCount }, () => ({
            age: null,
            segment: null,
            program: null,
            selectedSlot: null,
          }));
          state.currentChildIndex = 0;
        }
        
        // Extract child's age from message
        const agePatterns = [
          /(\d+)\s*(?:year|yr)s?\s*old/i,
          /(\d+)\s*-\s*year\s*-\s*old/i,
          /age\s*(\d+)/i,
          /(?:he's|she's|they're|is)\s*(\d+)/i,
        ];
        
        let detectedAge: number | null = null;
        for (const pattern of agePatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1]) {
            detectedAge = parseInt(match[1], 10);
            break;
          }
        }
        
        // Map age to program
        let suggestedProgram: string | null = null;
        if (detectedAge !== null) {
          if (detectedAge >= 3 && detectedAge <= 5) {
            suggestedProgram = "Little Ninjas";
          } else if (detectedAge >= 6 && detectedAge <= 12) {
            suggestedProgram = "Dragon Kids";
          } else if (detectedAge >= 13) {
            suggestedProgram = "Teens";
          }
        }
        
        let greeting = `Nice to meet you, ${nameResult.name}!`;
        if (multipleChildren && childCount > 0) {
          greeting += ` That's wonderful that you want to enroll ${childCount === 2 ? 'both' : 'all ' + childCount} of your children!`;
          greeting += " I'd be happy to help you book trial classes for each of them.";
          if (suggestedProgram) {
            greeting += ` Based on the age you mentioned, our ${suggestedProgram} program would be a great fit!`;
          }
        } else if (enrollChildIntent) {
          greeting += " I'd be happy to help you enroll your child.";
          if (suggestedProgram) {
            greeting += ` Based on their age, our ${suggestedProgram} program would be perfect for them!`;
          }
        }
        greeting += " What's your phone number?";

        const response = {
          assistantMessage: greeting,
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.PHONE,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      } else {
        const response = {
          assistantMessage: nameResult.error || "I didn't catch your name. Could you please tell me your full name?",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.NAME,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.PHONE: {
      const phoneResult = parsePhone(normalizedInput);
      if (phoneResult.valid && phoneResult.phone) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.phone = phoneResult.phone;
        state.completedSteps.push(IntakeStep.PHONE);
        state.askedKeys.push("PHONE");
        state.currentStep = resolveNextStep(state);

        const response = {
          assistantMessage: "Great! What's your email address? (or type 'skip' if you prefer not to share)",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.EMAIL,
          quickReplies: ["Skip"],
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      } else {
        const response = {
          assistantMessage: phoneResult.error || "That doesn't look like a valid phone number. Please provide a 10-digit phone number.",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.PHONE,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.EMAIL: {
      if (isEmailSkipIntent(normalizedInput)) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.emailSkipped = true;
        state.completedSteps.push(IntakeStep.EMAIL);
        state.askedKeys.push("EMAIL");
        state.currentStep = resolveNextStep(state);

        const response = {
          assistantMessage: "No problem! Is this class for you, your child, or someone else?",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.CLASS_FOR,
          quickReplies: ["For me", "For my child", "For someone else"],
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }

      const emailResult = parseEmail(normalizedInput);
      if (emailResult.valid && emailResult.email) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.email = emailResult.email;
        state.completedSteps.push(IntakeStep.EMAIL);
        state.askedKeys.push("EMAIL");
        state.currentStep = resolveNextStep(state);

        // Trial-First Strategy: Recursively process next step (likely PAYMENT_POSITIONING)
        return processIntakeMessage(state, "");
      } else {
        const response = {
          assistantMessage: emailResult.error || "That doesn't look like a valid email. Please provide a valid email address or type 'skip'.",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.EMAIL,
          quickReplies: ["Skip"],
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.CLASS_FOR: {
      const parsedClassFor = parseClassFor(normalizedInput);
      if (parsedClassFor) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.classFor = parsedClassFor;
        state.completedSteps.push(IntakeStep.CLASS_FOR);
        state.askedKeys.push("CLASS_FOR");
        
        // BUGFIX: Use resolveNextStep instead of hardcoding INTENT
        // This prevents asking for intent again if it's already collected
        const nextStep = resolveNextStep(state);
        state.currentStep = nextStep;
        
        // Generate appropriate response based on next step - Trial-First Strategy
        if (nextStep === IntakeStep.CHILD_NAME) {
          const response = {
            assistantMessage: "Great! What's their name?",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.CHILD_NAME,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else if (nextStep === IntakeStep.RAPID_RAPPORT_ADULT) {
          const response = {
            assistantMessage: "Have you trained before?",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.RAPID_RAPPORT_ADULT,
            quickReplies: ["Yes", "No"],
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else if (nextStep === IntakeStep.PLAN_SELECTION) {
          // Hidden enrollment path triggered
          const response = {
            assistantMessage: "Absolutely! I can help you enroll directly. Let me show you our membership plans.",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.PLAN_SELECTION,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else {
          // Recursively process next step
          return processIntakeMessage(state, "");
        }
      } else {
        const response = {
          assistantMessage: "Please let me know: is this class for you, your child, or someone else?",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.CLASS_FOR,
          quickReplies: ["For me", "For my child", "For someone else"],
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.CHILD_NAME: {
      const childNameResult = parseChildName(userMessage);
      if (childNameResult.valid && childNameResult.name) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.childName = childNameResult.name;
        state.completedSteps.push(IntakeStep.CHILD_NAME);
        state.askedKeys.push("CHILD_NAME");
        state.currentStep = resolveNextStep(state);

        // Trial-First Strategy: No intent question, move directly to next step
        // Recursively process next step (likely CHILD_AGE)
        return processIntakeMessage(state, "");
      } else {
        const response = {
          assistantMessage: childNameResult.error || "What's your child's name?",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.CHILD_NAME,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.INTENT: {
      const normalizedIntent = normalizedInput.toLowerCase();
      let parsedIntent: "trial" | "enroll" | "summer_camp" | "after_school" | null = null;

      if (normalizedIntent.includes("trial") || normalizedIntent.includes("book")) {
        parsedIntent = "trial";
      } else if (normalizedIntent.includes("enroll") || normalizedIntent.includes("membership")) {
        parsedIntent = "enroll";
      } else if (normalizedIntent.includes("summer") || normalizedIntent.includes("camp")) {
        parsedIntent = "summer_camp";
      } else if (normalizedIntent.includes("after school") || normalizedIntent.includes("afterschool")) {
        parsedIntent = "after_school";
      }

      if (parsedIntent) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.intent = parsedIntent;
        state.completedSteps.push(IntakeStep.INTENT);
        state.askedKeys.push("INTENT");

        if (parsedIntent === "enroll") {
          // Route to plan selection step
          state.currentStep = IntakeStep.PLAN_SELECTION;
          const response = {
            assistantMessage: "Great! Let me show you our membership plans. Choose the one that fits your goals:",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.PLAN_SELECTION,
            membershipPlans: [], // Will be populated by backend
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else if (parsedIntent === "summer_camp") {
          // Summer camp flow - ask for name first
          state.currentStep = IntakeStep.NAME;
          const response = {
            assistantMessage: "Awesome! Our summer camps are action-packed and fun! ☀️ What's your name?",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.NAME,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else if (parsedIntent === "after_school") {
          // After school program flow - ask for name first
          state.currentStep = IntakeStep.NAME;
          const response = {
            assistantMessage: "Great choice! Our after school program keeps kids active and engaged! 🎒 What's your name?",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.NAME,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else {
          // Trial flow - continue to age or slots
          if (state.classFor === "child") {
            state.currentStep = IntakeStep.CHILD_AGE;
            
            // Check if multi-child
            if (state.multipleChildren && state.childCount > 0) {
              const response = {
                assistantMessage: `Perfect! Let's start with child #1. How old is your first child?`,
                state,
                collectedFields: getCollectedFields(state),
                nextExpectedField: IntakeStep.CHILD_AGE,
                error: null,
              };
              addToMessageHistory(state, "assistant", response.assistantMessage);
              return response;
            } else {
              const response = {
                assistantMessage: "Perfect! How old is your child?",
                state,
                collectedFields: getCollectedFields(state),
                nextExpectedField: IntakeStep.CHILD_AGE,
                error: null,
              };
              addToMessageHistory(state, "assistant", response.assistantMessage);
              return response;
            }
          } else {
            // Self or other - assume adult
            state.segment = Segment.ADULTS;
            state.program = SEGMENT_TO_PROGRAM[Segment.ADULTS];
            state.completedSteps.push(IntakeStep.CHILD_AGE); // Skip age step
            state.currentStep = IntakeStep.SLOTS;

            const response = {
              assistantMessage: `Perfect! Let me show you available trial slots for ${state.program}.`,
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: IntakeStep.SLOTS,
              availableSlots: [], // Will be populated by backend
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            return response;
          }
        }
      } else {
        const response = {
          assistantMessage: "I can help you with:",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.INTENT,
          quickReplies: ["Book Trial Class", "Enroll for Membership", "Summer Camp", "After School Program"],
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.LOCATION: {
      const normalizedLocation = normalizedInput.toLowerCase();
      let parsedLocation: string | null = null;

      // Match location names
      if (normalizedLocation.includes("tomball") || normalizedLocation.includes("hq") || normalizedLocation.includes("headquarters")) {
        parsedLocation = "Tomball HQ";
      } else if (normalizedLocation.includes("spring")) {
        parsedLocation = "Spring";
      } else if (normalizedLocation.includes("cypress")) {
        parsedLocation = "Cypress";
      }

      if (parsedLocation) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.selectedLocation = parsedLocation;
        state.completedSteps.push(IntakeStep.LOCATION);
        state.askedKeys.push("LOCATION");
        state.currentStep = resolveNextStep(state);

        const response = {
          assistantMessage: `Great! I'll show you classes at our ${parsedLocation} location. What's your name?`,
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: state.currentStep,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      } else {
        const response = {
          assistantMessage: "Which location would you like to visit?",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.LOCATION,
          quickReplies: ["Tomball HQ", "Spring", "Cypress"],
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.PLAN_SELECTION: {
      // Plan selection is handled by backend (user clicks plan card)
      // This case handles text input if user types plan name
      const normalizedPlan = normalizedInput.toLowerCase();
      let selectedPlanId: number | null = null;

      // Match plan names (Foundation=1, Black Belt=2, Leadership=3)
      if (normalizedPlan.includes("foundation")) {
        selectedPlanId = 1;
      } else if (normalizedPlan.includes("black belt")) {
        selectedPlanId = 2;
      } else if (normalizedPlan.includes("leadership")) {
        selectedPlanId = 3;
      }

      if (selectedPlanId) {
        state.selectedPlanId = selectedPlanId;
        state.completedSteps.push(IntakeStep.PLAN_SELECTION);
        state.askedKeys.push("PLAN_SELECTION");
        
        // BUGFIX: Collect contact info before completing enrollment
        // Check if we already have name and phone
        if (state.name && state.phone) {
          // Already have contact info, complete enrollment
          state.currentStep = IntakeStep.COMPLETE;
          state.intakeComplete = true;

          const response = {
            assistantMessage: "Perfect! Your enrollment is ready. I'll generate a checkout link for you.",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.COMPLETE,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else {
          // Need to collect contact info first
          // BUGFIX: Ensure INTENT is marked complete to prevent loop
          if (!state.completedSteps.includes(IntakeStep.INTENT)) {
            state.completedSteps.push(IntakeStep.INTENT);
            state.askedKeys.push("INTENT");
          }
          state.currentStep = IntakeStep.NAME;
          const response = {
            assistantMessage: "Great choice! To complete your enrollment, I'll need a few details. What's your name?",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.NAME,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        }
      } else {
        const response = {
          assistantMessage: "Please select a membership plan from the options above.",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.PLAN_SELECTION,
          membershipPlans: [], // Will be populated by backend
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.CHILD_AGE: {
      // If no input provided (auto-advancing from previous step), ask the question
      if (!normalizedInput || normalizedInput.length === 0) {
        const response = {
          assistantMessage: "How old is your child?",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.CHILD_AGE,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
      
      const ageResult = parseAge(normalizedInput);
      if (ageResult.valid && ageResult.age !== null) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        
        // Determine segment and program based on age
        let segment: Segment;
        let program: string;
        if (ageResult.age >= 3 && ageResult.age <= 5) {
          segment = Segment.KIDS_3_5;
          program = SEGMENT_TO_PROGRAM[Segment.KIDS_3_5];
        } else if (ageResult.age >= 6 && ageResult.age <= 12) {
          segment = Segment.KIDS_6_12;
          program = SEGMENT_TO_PROGRAM[Segment.KIDS_6_12];
        } else if (ageResult.age >= 13 && ageResult.age <= 17) {
          segment = Segment.TEENS;
          program = SEGMENT_TO_PROGRAM[Segment.TEENS];
        } else {
          segment = Segment.ADULTS;
          program = SEGMENT_TO_PROGRAM[Segment.ADULTS];
        }
        
        // Handle multi-child flow
        if (state.multipleChildren && state.children.length > 0) {
          // Store current child's age
          state.children[state.currentChildIndex].age = ageResult.age;
          state.children[state.currentChildIndex].segment = segment;
          state.children[state.currentChildIndex].program = program;
          
          // Check if we need to ask for more children
          if (state.currentChildIndex < state.childCount - 1) {
            // Move to next child
            state.currentChildIndex++;
            const childNum = state.currentChildIndex + 1;
            
            const response = {
              assistantMessage: `Great! Child #${state.currentChildIndex} will be in our ${program} program. Now, how old is child #${childNum}?`,
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: IntakeStep.CHILD_AGE,
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            return response;
          } else {
            // All children ages collected, move to slots
            state.completedSteps.push(IntakeStep.CHILD_AGE);
            state.askedKeys.push("CHILD_AGE");
            state.currentStep = IntakeStep.SLOTS;
            state.currentChildIndex = 0; // Reset for slot selection
            
            // Build summary of programs
            const programSummary = state.children
              .map((child, idx) => `Child #${idx + 1}: ${child.program}`)
              .join(", ");
            
            const response = {
              assistantMessage: `Perfect! Here's the summary: ${programSummary}. Let me show you available trial slots for child #1 (${state.children[0].program}).`,
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: IntakeStep.SLOTS,
              availableSlots: [], // Will be populated by backend
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            return response;
          }
        } else {
          // Single child flow - Trial-First Strategy
          state.childAge = ageResult.age;
          state.segment = segment;
          state.program = program;
          state.completedSteps.push(IntakeStep.CHILD_AGE);
          state.askedKeys.push("CHILD_AGE");
          state.currentStep = resolveNextStep(state);

          // Enthusiastic affirmation, then move to emotional discovery
          const childNameText = state.childName || "Your child";
          const response = {
            assistantMessage: `That's a fantastic age to start!`,
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: state.currentStep,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          
          // Recursively process next step (EMOTIONAL_DISCOVERY)
          return processIntakeMessage(state, "");
        }
      } else {
        const childNum = state.multipleChildren ? ` for child #${state.currentChildIndex + 1}` : "";
        const response = {
          assistantMessage: ageResult.error || `Please provide your child's age${childNum} as a number (e.g., 7).`,
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.CHILD_AGE,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.RAPID_RAPPORT_ADULT: {
      // NEW - Trial-First Strategy: For adult students - prior training?
      
      if (state.priorTraining === null) {
        if (normalizedInput && normalizedInput.length > 0) {
          const input = normalizedInput.toLowerCase();
          const hasPriorTraining = input.includes('yes') || input.includes('trained') || input.includes('before');
          const noPriorTraining = input.includes('no') || input.includes('never') || input.includes("haven't") || input.includes("first time");
          
          if (hasPriorTraining) {
            state.priorTraining = true;
            state.completedSteps.push(IntakeStep.RAPID_RAPPORT_ADULT);
            state.askedKeys.push("RAPID_RAPPORT_ADULT");
            state.currentStep = resolveNextStep(state);
            
            const response = {
              assistantMessage: "That's great! What got you interested in starting again?",
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: state.currentStep,
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            
            // Move to EMOTIONAL_DISCOVERY
            return processIntakeMessage(state, "");
          } else if (noPriorTraining) {
            state.priorTraining = false;
            state.completedSteps.push(IntakeStep.RAPID_RAPPORT_ADULT);
            state.askedKeys.push("RAPID_RAPPORT_ADULT");
            state.currentStep = resolveNextStep(state);
            
            // Move to EMOTIONAL_DISCOVERY
            return processIntakeMessage(state, "");
          } else {
            // Unclear response, re-ask
            const response = {
              assistantMessage: "Have you trained before?",
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: IntakeStep.RAPID_RAPPORT_ADULT,
              quickReplies: ["Yes", "No"],
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            return response;
          }
        } else {
          // Ask for prior training
          const response = {
            assistantMessage: "Have you trained before?",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.RAPID_RAPPORT_ADULT,
            quickReplies: ["Yes", "No"],
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        }
      } else {
        // Already collected, move on
        state.completedSteps.push(IntakeStep.RAPID_RAPPORT_ADULT);
        state.currentStep = resolveNextStep(state);
        return processIntakeMessage(state, "");
      }
    }

    case IntakeStep.EMOTIONAL_DISCOVERY: {
      // NEW - Trial-First Strategy: 2-part emotional discovery
      // Q1: What would you like to see improve?
      // Q2: If that improved, what would be different?
      
      if (!state.emotionalGoal) {
        // Part 1: Collect emotional goal
        if (normalizedInput && normalizedInput.length > 2) {
          state.emotionalGoal = userMessage;  // Store raw message for emotional context
          
          // Validate and give enthusiastic affirmation
          const response = {
            assistantMessage: `That's exactly what we help families achieve! If ${state.childName || "they"} developed that, what would be different at home or school?`,
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.EMOTIONAL_DISCOVERY,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else {
          // Ask Q1
          const who = state.classFor === "child" 
            ? (state.childName || "your child")
            : "yourself";
          const response = {
            assistantMessage: `What would you most like to see ${who} improve?`,
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.EMOTIONAL_DISCOVERY,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        }
      } else if (!state.emotionalImpact) {
        // Part 2: Collect emotional impact
        if (normalizedInput && normalizedInput.length > 2) {
          state.emotionalImpact = userMessage;  // Store raw message
          state.completedSteps.push(IntakeStep.EMOTIONAL_DISCOVERY);
          state.askedKeys.push("EMOTIONAL_DISCOVERY");
          
          // Transition to TRIAL_TRANSITION
          state.currentStep = resolveNextStep(state);
          
          // Recursively process next step (TRIAL_TRANSITION)
          return processIntakeMessage(state, "");
        } else {
          // Re-ask Q2
          const response = {
            assistantMessage: `If ${state.childName || "they"} developed that, what would be different?`,
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.EMOTIONAL_DISCOVERY,
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        }
      } else {
        // Both collected, move to next step
        state.completedSteps.push(IntakeStep.EMOTIONAL_DISCOVERY);
        state.currentStep = resolveNextStep(state);
        return processIntakeMessage(state, "");
      }
    }

    case IntakeStep.TRIAL_TRANSITION: {
      // NEW - Trial-First Strategy: Frame trial + create urgency + offer slots
      // Combine TRIAL_TRANSITION message with FAST_FIRST_LESSON slot offering
      
      state.completedSteps.push(IntakeStep.TRIAL_TRANSITION);
      state.askedKeys.push("TRIAL_TRANSITION");
      state.currentStep = IntakeStep.FAST_FIRST_LESSON;  // Advance to slot selection
      
      // Generate default slots
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const slot1: Slot = {
        id: "default-1",
        day: "Today",
        date: now.toISOString().split('T')[0],
        time: "6:15 PM",
        displayText: "Today at 6:15 PM"
      };
      
      const slot2: Slot = {
        id: "default-2",
        day: "Tomorrow",
        date: tomorrow.toISOString().split('T')[0],
        time: "5:30 PM",
        displayText: "Tomorrow at 5:30 PM"
      };
      
      state.offeredSlots = [slot1, slot2];
      
      const transitionMessage = "That's exactly why most families start with our 2-Week Trial. " +
        "It gives you full classes plus the official uniform so you can experience everything properly. " +
        "We're enrolling new students this week and classes fill quickly.\n\n";
      
      const slotMessage = `I can get you in ${slot1.displayText} or ${slot2.displayText}. Which works best?`;
      
      const response = {
        assistantMessage: transitionMessage + slotMessage,
        state,
        collectedFields: getCollectedFields(state),
        nextExpectedField: IntakeStep.FAST_FIRST_LESSON,
        quickReplies: [slot1.displayText, slot2.displayText, "Neither works"],
        error: null,
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      return response;
    }

    case IntakeStep.FAST_FIRST_LESSON: {
      // NEW - Trial-First Strategy: Offer 2 specific time slots
      // TODO: Query actual availability from database
      // For now, use sensible defaults based on time of day and classFor
      
      if (!state.selectedSlot) {
        // Generate 2 slot options if not already offered
        if (state.offeredSlots.length === 0) {
          // Generate default slots (will be replaced with real availability later)
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const slot1: Slot = {
            id: "default-1",
            day: "Today",
            date: now.toISOString().split('T')[0],
            time: "6:15 PM",
            displayText: "Today at 6:15 PM"
          };
          
          const slot2: Slot = {
            id: "default-2",
            day: "Tomorrow",
            date: tomorrow.toISOString().split('T')[0],
            time: "5:30 PM",
            displayText: "Tomorrow at 5:30 PM"
          };
          
          state.offeredSlots = [slot1, slot2];
          
          const response = {
            assistantMessage: `I can get you in ${slot1.displayText} or ${slot2.displayText}. Which works best?`,
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.FAST_FIRST_LESSON,
            quickReplies: [slot1.displayText, slot2.displayText, "Neither works"],
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        } else {
          // User responded - check if they selected a slot
          const input = normalizedInput.toLowerCase();
          
          if (input.includes("neither") || input.includes("don't work") || input.includes("other")) {
            // Generate 2 new slots
            const now = new Date();
            const dayAfterTomorrow = new Date(now);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
            
            const slot3: Slot = {
              id: "default-3",
              day: dayAfterTomorrow.toLocaleDateString('en-US', { weekday: 'long' }),
              date: dayAfterTomorrow.toISOString().split('T')[0],
              time: "6:00 PM",
              displayText: `${dayAfterTomorrow.toLocaleDateString('en-US', { weekday: 'long' })} at 6:00 PM`
            };
            
            const slot4: Slot = {
              id: "default-4",
              day: dayAfterTomorrow.toLocaleDateString('en-US', { weekday: 'long' }),
              date: dayAfterTomorrow.toISOString().split('T')[0],
              time: "7:00 PM",
              displayText: `${dayAfterTomorrow.toLocaleDateString('en-US', { weekday: 'long' })} at 7:00 PM`
            };
            
            state.offeredSlots = [slot3, slot4];
            
            const response = {
              assistantMessage: `No problem! How about ${slot3.displayText} or ${slot4.displayText}?`,
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: IntakeStep.FAST_FIRST_LESSON,
              quickReplies: [slot3.displayText, slot4.displayText, "Still doesn't work"],
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            return response;
          } else if (input.includes("still")) {
            // User still can't make it - ask for their availability
            const response = {
              assistantMessage: "What days and times typically work best for you?",
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: IntakeStep.FAST_FIRST_LESSON,
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            return response;
          } else {
            // Try to match user input to offered slots
            let selectedSlot: Slot | null = null;
            
            for (const slot of state.offeredSlots) {
              if (input.includes(slot.day.toLowerCase()) || 
                  input.includes(slot.time.toLowerCase()) ||
                  input.includes("first") || input.includes("1") || input.includes("today")) {
                selectedSlot = slot;
                break;
              }
            }
            
            // Default to first slot if unclear
            if (!selectedSlot && (input.includes("yes") || input.includes("ok") || input.includes("sure"))) {
              selectedSlot = state.offeredSlots[0];
            } else if (!selectedSlot && (input.includes("second") || input.includes("2") || input.includes("tomorrow"))) {
              selectedSlot = state.offeredSlots[1];
            }
            
            if (selectedSlot) {
              state.selectedSlot = selectedSlot;
              state.completedSteps.push(IntakeStep.FAST_FIRST_LESSON);
              state.askedKeys.push("FAST_FIRST_LESSON");
              state.currentStep = resolveNextStep(state);
              
              // Move to next step
              return processIntakeMessage(state, "");
            } else {
              // Couldn't parse - re-offer
              const response = {
                assistantMessage: `Which time works better: ${state.offeredSlots[0].displayText} or ${state.offeredSlots[1].displayText}?`,
                state,
                collectedFields: getCollectedFields(state),
                nextExpectedField: IntakeStep.FAST_FIRST_LESSON,
                quickReplies: [state.offeredSlots[0].displayText, state.offeredSlots[1].displayText],
                error: null,
              };
              addToMessageHistory(state, "assistant", response.assistantMessage);
              return response;
            }
          }
        }
      } else {
        // Slot already selected, move on
        state.completedSteps.push(IntakeStep.FAST_FIRST_LESSON);
        state.currentStep = resolveNextStep(state);
        return processIntakeMessage(state, "");
      }
    }

    case IntakeStep.SECONDARY_DECISION_MAKER: {
      // NEW - Trial-First Strategy: Check for spouse/partner
      
      if (!state.secondaryDecisionMaker) {
        if (normalizedInput && normalizedInput.length > 0) {
          state.secondaryDecisionMaker = userMessage;
          state.completedSteps.push(IntakeStep.SECONDARY_DECISION_MAKER);
          state.askedKeys.push("SECONDARY_DECISION_MAKER");
          
          // If they mentioned spouse/partner, encourage them to attend
          const hasOtherDecisionMaker = /spouse|partner|husband|wife|other/i.test(userMessage);
          state.currentStep = resolveNextStep(state);  // Advance to next step (likely NAME)
          
          if (hasOtherDecisionMaker) {
            const response = {
              assistantMessage: "Great! We encourage them to attend the first lesson too. It's the best way to see how we teach.",
              state,
              collectedFields: getCollectedFields(state),
              nextExpectedField: state.currentStep,
              error: null,
            };
            addToMessageHistory(state, "assistant", response.assistantMessage);
            return response;
          } else {
            // Just me - recursively process next step
            return processIntakeMessage(state, "");
          }
        } else {
          const response = {
            assistantMessage: "Is there anyone else who needs to be involved in the decision to get started?",
            state,
            collectedFields: getCollectedFields(state),
            nextExpectedField: IntakeStep.SECONDARY_DECISION_MAKER,
            quickReplies: ["Just me", "My spouse/partner", "Other"],
            error: null,
          };
          addToMessageHistory(state, "assistant", response.assistantMessage);
          return response;
        }
      } else {
        state.completedSteps.push(IntakeStep.SECONDARY_DECISION_MAKER);
        state.currentStep = resolveNextStep(state);
        return processIntakeMessage(state, "");
      }
    }

    case IntakeStep.PAYMENT_POSITIONING: {
      // NEW - Trial-First Strategy: Secure trial payment
      
      state.completedSteps.push(IntakeStep.PAYMENT_POSITIONING);
      state.askedKeys.push("PAYMENT_POSITIONING");
      state.currentStep = resolveNextStep(state);  // Advance to ENROLLMENT_PREFRAME
      
      const slotText = state.selectedSlot ? state.selectedSlot.displayText : "your selected time";
      const message = `Perfect! To reserve your spot for ${slotText}, we just take care of the trial tuition now. You can use debit or credit — which is best?`;
      
      const response = {
        assistantMessage: message,
        state,
        collectedFields: getCollectedFields(state),
        nextExpectedField: state.currentStep,  // Will be ENROLLMENT_PREFRAME
        quickReplies: ["Debit", "Credit"],
        error: null,
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      
      // TODO: Generate payment link and send to user
      // Return this message, next user input will trigger ENROLLMENT_PREFRAME
      return response;
    }

    case IntakeStep.ENROLLMENT_PREFRAME: {
      // NEW - Trial-First Strategy: Pre-frame membership after first lesson
      
      state.completedSteps.push(IntakeStep.ENROLLMENT_PREFRAME);
      state.askedKeys.push("ENROLLMENT_PREFRAME");
      state.currentStep = resolveNextStep(state);  // Advance to COMPLETE
      
      const message = "After the first lesson, most families know right away this is the perfect fit. " +
        "If you love it as much as I think you will, I'll show you the membership options and how to save by enrolling that day. " +
        "For the first lesson, parents participate too. It's the best way to experience how we teach. The lesson lasts about 50 minutes.";
      
      const response = {
        assistantMessage: message,
        state,
        collectedFields: getCollectedFields(state),
        nextExpectedField: state.currentStep,  // Will be COMPLETE
        error: null,
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      
      // Return this message, conversation is complete
      return response;
    }

    case IntakeStep.SLOTS: {
      // Slot selection is handled by backend (user clicks slot card)
      // This case should not be reached through text input
      const response = {
        assistantMessage: "Please select a time slot from the options above.",
        state,
        collectedFields: getCollectedFields(state),
        nextExpectedField: IntakeStep.SLOTS,
        availableSlots: [], // Will be populated by backend
        error: null,
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      return response;
    }

    case IntakeStep.CONFIRM: {
      // Generate booking summary
      const childInfo = state.childName ? ` for ${state.childName}` : (state.classFor === "child" ? " for your child" : "");
      const ageInfo = state.childAge ? `, age ${state.childAge}` : "";
      const slotInfo = state.selectedSlot ? state.selectedSlot.displayText : "selected time";
      const locationInfo = state.selectedLocation || "your selected location";
      
      const summaryMessage = `📋 **Booking Summary**\n\n` +
        `👤 Parent: ${state.name}\n` +
        `📞 Phone: ${state.phone}\n` +
        `📧 Email: ${state.email || "Not provided"}\n` +
        `👶 Student: ${state.childName || "Your child"}${ageInfo}\n` +
        `🥋 Program: ${state.program}\n` +
        `📍 Location: ${locationInfo}\n` +
        `🕐 Time: ${slotInfo}\n\n` +
        `Please review the details above. Ready to confirm your booking?`;

      // Check if user confirmed
      const normalizedConfirm = normalizedInput.toLowerCase();
      if (normalizedConfirm.includes("confirm") || normalizedConfirm.includes("yes") || normalizedConfirm.includes("book") || normalizedConfirm.includes("correct")) {
        // RELIABILITY KERNEL: Commit state BEFORE generating response
        state.completedSteps.push(IntakeStep.CONFIRM);
        state.currentStep = resolveNextStep(state);

        const response = {
          assistantMessage: "Great! Processing your booking now...",
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: state.currentStep,
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      } else {
        // Show summary with confirmation buttons
        const response = {
          assistantMessage: summaryMessage,
          state,
          collectedFields: getCollectedFields(state),
          nextExpectedField: IntakeStep.CONFIRM,
          quickReplies: ["Confirm Booking", "Edit Details"],
          error: null,
        };
        addToMessageHistory(state, "assistant", response.assistantMessage);
        return response;
      }
    }

    case IntakeStep.BOOK: {
      // Booking is handled by backend after slot selection
      // This case should not be reached through text input
      const response = {
        assistantMessage: "Processing your booking...",
        state,
        collectedFields: getCollectedFields(state),
        nextExpectedField: IntakeStep.BOOK,
        error: null,
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      return response;
    }

    case IntakeStep.COMPLETE: {
      const response = {
        assistantMessage: "Your trial class is booked! We look forward to seeing you.",
        state,
        collectedFields: getCollectedFields(state),
        nextExpectedField: null,
        error: null,
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      return response;
    }

    default: {
      const response = {
        assistantMessage: "Something went wrong. Let's start over. What's your name?",
        state: initializeIntakeState(state.sessionId),
        collectedFields: getCollectedFields(state),
        nextExpectedField: IntakeStep.NAME,
        error: "Unknown step",
      };
      addToMessageHistory(state, "assistant", response.assistantMessage);
      return response;
    }
  }
}

/**
 * Helper: Get collected fields from state
 */
function getCollectedFields(state: IntakeState) {
  return {
    name: state.name,
    phone: state.phone,
    email: state.email,
    classFor: state.classFor,
    childAge: state.childAge,
    segment: state.segment,
    program: state.program,
  };
}
