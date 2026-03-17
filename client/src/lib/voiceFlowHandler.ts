/**
 * Voice Flow Handler
 * Implements the optimized conversation flow for voice chat
 * Based on the new requirements:
 * 1. Greeting
 * 2. Identify Student (for you or child?)
 * 3. Get Age
 * 4. Auto-assign Program
 * 5. Show Real Schedule (2 options max)
 * 6. Collect Booking Info (name, phone)
 * 7. Confirmation
 */

export type VoiceStep =
  | "greeting"
  | "identify_student"
  | "get_age"
  | "show_schedule"
  | "get_name"
  | "get_email"
  | "get_phone"
  | "confirmation"
  | "complete";

export interface VoiceFlowState {
  step: VoiceStep;
  studentType: "self" | "child" | null;
  age: number | null;
  program: string | null;
  selectedClassTime: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Recommend program based on age
 * 3-5 → Little Ninjas
 * 6-12 → Dragon Kids
 * 13-15 → Teens
 * 16+ → Adults (can also choose Kickboxing)
 */
export function recommendProgramByAge(age: number): string {
  if (age >= 3 && age <= 5) return "Little Ninjas";
  if (age >= 6 && age <= 12) return "Dragon Kids";
  if (age >= 13 && age <= 15) return "Teens";
  if (age >= 16) return "Adults";
  return "Adults"; // Default fallback
}

/**
 * Generate bot response based on current step and user input
 */
export function generateVoiceResponse(
  state: VoiceFlowState,
  userInput: string
): {
  response: string;
  nextStep: VoiceStep;
  updatedState: Partial<VoiceFlowState>;
} {
  const lowerInput = userInput.toLowerCase();

  switch (state.step) {
    case "greeting":
      // Initial greeting
      return {
        response: "Hi, this is Kai from MyDojo. I can help you book a class or answer questions. What are you looking for today?",
        nextStep: "identify_student",
        updatedState: {},
      };

    case "identify_student":
      // Determine if it's for them or their child
      const isForSelf = lowerInput.match(/\b(me|myself|i|adult|for me)\b/);
      const isForChild = lowerInput.match(/\b(child|kid|son|daughter|my)\b/);

      if (isForSelf) {
        return {
          response: "How old are you?",
          nextStep: "get_age",
          updatedState: { studentType: "self" },
        };
      } else if (isForChild) {
        return {
          response: "How old are they?",
          nextStep: "get_age",
          updatedState: { studentType: "child" },
        };
      } else {
        // Unclear, ask again
        return {
          response: "Is this for you or for your child?",
          nextStep: "identify_student",
          updatedState: {},
        };
      }

    case "get_age":
      // Extract age from input
      const ageMatch = userInput.match(/\b(\d+)\b/);
      if (!ageMatch) {
        return {
          response: "I didn't catch that. How old?",
          nextStep: "get_age",
          updatedState: {},
        };
      }

      const age = parseInt(ageMatch[1]);
      if (age < 3 || age > 100) {
        return {
          response: "That doesn't seem right. How old?",
          nextStep: "get_age",
          updatedState: {},
        };
      }

      const program = recommendProgramByAge(age);

      return {
        response: `Perfect. The best fit is our ${program} classes.`,
        nextStep: "show_schedule",
        updatedState: { age, program },
      };

    case "show_schedule":
      // This step will be handled by the component to fetch real schedule
      // and present 2 options. User selects one.
      return {
        response: "", // Will be filled by component with actual schedule
        nextStep: "get_name",
        updatedState: { selectedClassTime: userInput },
      };

    case "get_name":
      return {
        response: "What's your email address?",
        nextStep: "get_email",
        updatedState: { name: userInput },
      };

    case "get_email":
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInput)) {
        return {
          response: "That doesn't look like a valid email. Could you say it again?",
          nextStep: "get_email",
          updatedState: {},
        };
      }
      return {
        response: "And a mobile number for confirmation?",
        nextStep: "get_phone",
        updatedState: { email: userInput },
      };

    case "get_phone":
      return {
        response: `You're booked for ${state.selectedClassTime}. Arrive 10 minutes early and wear comfortable clothes. We'll text your confirmation. Anything else I can help with?`,
        nextStep: "confirmation",
        updatedState: { phone: userInput },
      };

    case "confirmation":
      // Check if user has another question or wants to end
      if (lowerInput.match(/\b(no|nope|that's all|nothing|good|thanks)\b/)) {
        return {
          response: "Great! Looking forward to seeing you at MyDojo!",
          nextStep: "complete",
          updatedState: {},
        };
      } else {
        return {
          response: "How can I help you?",
          nextStep: "confirmation",
          updatedState: {},
        };
      }

    default:
      return {
        response: "I'm not sure what you mean. Can you rephrase?",
        nextStep: state.step,
        updatedState: {},
      };
  }
}

/**
 * Get initial greeting message
 */
export function getInitialGreeting(): string {
  return "Hi, this is Kai from MyDojo. I can help you book a class or answer questions. What are you looking for today?";
}

/**
 * Format schedule options for voice
 * Example: "Your next options are Tuesday at 5 PM, or Thursday at 6 PM. Which works better?"
 */
export function formatScheduleOptions(classes: Array<{ dayOfWeek: string; startTime: string }>): string {
  if (classes.length === 0) {
    return "Let me have a staff member confirm the best time. What's your number?";
  }

  if (classes.length === 1) {
    return `The next class is ${classes[0].dayOfWeek} at ${classes[0].startTime}. Does that work for you?`;
  }

  const options = classes.slice(0, 2).map(c => `${c.dayOfWeek} at ${c.startTime}`);
  return `Your next options are ${options.join(", or ")}. Which works better?`;
}

/**
 * Add conversion booster line
 */
export function getConversionBooster(): string {
  return "Most people start with our free intro class.";
}
