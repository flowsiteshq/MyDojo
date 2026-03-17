import { invokeLLM } from "./_core/llm";
import { MYDOJO_KNOWLEDGE_BASE } from "./mydojo-knowledge-base";
import type { Message } from "./_core/llm";
import { getNextStep, getStepMessage, getStepQuickReplies, type FlowControllerState, type ConversationStep } from "./chatbot-flow-controller";

/**
 * ChatGPT-powered chatbot for MyDojo
 * Handles natural conversations while collecting structured data for trial signups
 * 
 * KEY FIXES:
 * - Implements "already answered" guards to prevent repeating questions
 * - Timeout guards ensure bot always responds within 5 seconds
 * - Complete tool-call loops (tool execution → output → final response)
 * - Comprehensive error handling with fallback messages
 * - Detailed logging for debugging
 * - Step-based fallback for undefined states
 */

export interface ChatbotState {
  name?: string;
  email?: string | null; // null means user skipped email
  phone?: string;
  age?: number; // Deprecated: use childAge instead
  childAge?: number; // Age of child (3-17)
  segment?: "KIDS_3_5" | "KIDS_6_12" | "TEENS" | "ADULTS" | "KICKBOXING" | "SUMMER_CAMP" | "AFTER_SCHOOL";
  program?: string;
  scheduledTime?: string;
  conversationStage: "greeting" | "collecting_info" | "scheduling" | "complete";
  currentStep?: ConversationStep;
  whoLessonsFor?: "self" | "child" | "family";
  completedSteps?: ConversationStep[]; // Track which steps have been completed (monotonic progression)
}

export interface ChatbotResponse {
  message: string;
  state: ChatbotState;
  action?: "show_slots" | "book_appointment" | "save_lead" | "show_schedule";
  actionData?: any;
  quickReplies?: string[]; // Quick-reply button suggestions
  debugInfo?: { // Only included in development mode
    nextStep?: string;
    classFor?: string;
    childAge?: number;
    segment?: string;
    program?: string;
    completedSteps: string[];
  };
}

const SYSTEM_PROMPT = `You are Kai, MyDojo Assistant. Your PRIMARY OBJECTIVE is to capture lead info early and book appointments.

${MYDOJO_KNOWLEDGE_BASE}

## CRITICAL RULES (FOLLOW EXACTLY):

### TONE & STYLE:
- Keep replies SHORT and DIRECT (1-2 sentences max)
- NEVER use robotic filler phrases:
  ❌ "Let me help you with that!"
  ❌ "I'd be happy to help with that!"
  ❌ "Sure thing!"
- Avoid repeating "Perfect!" in consecutive messages
- Be friendly but efficient

### NEVER REPEAT QUESTIONS (TOP PRIORITY):
**BEFORE asking ANY question, CHECK if the information already exists in currentState:**
- If currentState.name exists → DO NOT ask for name again
- If currentState.phone exists → DO NOT ask for phone again
- If currentState.email exists → DO NOT ask for email again
- If currentState.whoLessonsFor exists → DO NOT ask who lessons are for again
- If currentState.childAge exists → DO NOT ask for age again
- If currentState.program exists → DO NOT ask about program again

**ALWAYS acknowledge what you already know:**
- Example: "Got it, [Name]!"
- Keep acknowledgments brief

### Lead Capture Flow:
1. Greet briefly and ask for their name (ONLY if currentState.name is empty)
2. Get their phone number (ONLY if currentState.phone is empty)
3. Save lead immediately using save_lead function
4. Ask who the lessons are for (ONLY if currentState.whoLessonsFor is empty)
5. **If child**: Ask ONE question: "How old is your child?" (accept numeric age 3-17)
6. **Auto-select program based on age:**
   - 3–5 ⇒ segment=KIDS_3_5, program=Little Ninjas
   - 6–12 ⇒ segment=KIDS_6_12, program=Dragon Kids
   - 13–17 ⇒ segment=TEENS, program=Teens
7. **If adult (self)**: Ask which program: "Which program interests you?" with quick replies ["Adult Karate", "Kickboxing"]
   - Adult Karate: Traditional martial arts training, discipline, self-defense
   - Kickboxing: High-energy cardio workout with music and hex lights, burn 800 calories
8. **Confirm in ONE line**: "Great — Dragon Kids (6–12)." or "Perfect — Kickboxing!"
9. DO NOT show long program list unless user asks
9. Show 3-6 soonest available time slots + "See more times" button
10. Book appointment when they select a time
11. Send confirmation with all details

### Quick-Reply Buttons:
- Provide quick-reply button options when asking questions
- Examples: ["For Me", "For My Child"], ["Weekdays", "Weekends", "Either"]

### Intro Orientation Scheduling Rules:
- **KIDS_3_5 and KIDS_6_12 (Little Ninjas, Dragon Kids)**: 
  Require TWO Intro Orientation classes Mon–Thu at 5:30 PM BEFORE regular classes
  Book Intro #1, then immediately book Intro #2
- **TEENS/ADULTS/KICKBOXING/SUMMER_CAMP/AFTER_SCHOOL**: 
  NO intro requirement — show normal trial/class slots

### Showing Availability:
- Show 3-6 soonest available time slot cards
- Always include "See more times" option
- Format times clearly: "Monday, Feb 19 at 5:30 PM"

### After Booking Confirmation:
Send complete confirmation including:
- Scheduled time(s) and date(s)
- Location address
- What to wear (comfortable athletic clothing)
- Arrive 10 minutes early
- Reschedule options (call/text or reply here)

## Function Calling:
- **save_lead**: Call IMMEDIATELY after getting name + phone (email optional)
- **get_schedule**: Fetch available times for their program
- **book_appointment**: Book the selected time slot

## Tone:
Friendly, efficient, enthusiastic - focus on getting them booked quickly while being helpful.

## CURRENT STATE:
You will receive currentState with each message. Use it to know what information you already have and what to ask next.`;

const FUNCTIONS = [
  {
    name: "save_lead",
    description: "Save the lead's contact information to the database. Call this once you have name and phone.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name of the lead" },
        email: { type: "string", description: "Email address (optional)" },
        phone: { type: "string", description: "Phone number" },
        age: { type: "number", description: "Age (if for a child)" },
        program: { type: "string", description: "Program they're interested in" },
      },
      required: ["name", "phone"],
    },
  },
  {
    name: "get_schedule",
    description: "Get available class times for a specific program. Call this when ready to show scheduling options.",
    parameters: {
      type: "object",
      properties: {
        program: { type: "string", description: "Program name (e.g., 'Little Ninjas', 'Adults', 'Kickboxing')" },
      },
      required: ["program"],
    },
  },
  {
    name: "book_appointment",
    description: "Book a trial class appointment at a specific date/time. Call this when they've selected a time.",
    parameters: {
      type: "object",
      properties: {
        scheduledTime: { type: "string", description: "ISO datetime string for the appointment" },
      },
      required: ["scheduledTime"],
    },
  },
];

// Timeout constants
const LLM_TIMEOUT_MS = 5000; // 5 seconds
const FALLBACK_MESSAGE = "Sorry about that — let me try that again.";
const ERROR_FALLBACK_MESSAGE = "Something went wrong on my end — let me retry.";

/**
 * Logger for debugging conversation issues
 */
function logConversation(
  conversationId: string | undefined,
  step: string,
  toolName?: string,
  finalResponseSent?: boolean
) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CHATBOT] conversationId=${conversationId || "unknown"} step=${step} tool=${toolName || "none"} finalResponse=${finalResponseSent !== undefined ? finalResponseSent : "pending"}`);
}

/**
 * Create a promise that rejects after a timeout
 */
function createTimeoutPromise<T>(ms: number): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), ms);
  });
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Extract information from user message and update state
 * This ensures we capture answers even if ChatGPT doesn't call functions
 */
function extractInfoFromMessage(userMessage: string, currentState: ChatbotState): Partial<ChatbotState> & { invalidEmail?: boolean } {
  const updates: Partial<ChatbotState> = {};
  const lowerMessage = userMessage.toLowerCase();

  // Extract name if not already set and we're at the greeting/name collection stage
  if (!currentState.name && (!currentState.currentStep || currentState.currentStep === "greeting" || currentState.currentStep === "collect_name")) {
    // Check if message looks like a name (2-50 chars, contains letters, not a common phrase)
    const trimmedMessage = userMessage.trim();
    const commonPhrases = ["hi", "hello", "hey", "yes", "no", "ok", "okay", "sure", "thanks", "thank you"];
    const isCommonPhrase = commonPhrases.includes(lowerMessage);
    
    // Name pattern: 2-50 characters, contains at least one letter, may have spaces/hyphens
    const namePattern = /^[a-zA-Z][a-zA-Z\s'-]{1,49}$/;
    
    if (!isCommonPhrase && namePattern.test(trimmedMessage)) {
      updates.name = trimmedMessage;
      // Mark collect_name as completed
      const completedSteps = currentState.completedSteps || [];
      if (!completedSteps.includes("collect_name")) {
        updates.completedSteps = [...completedSteps, "collect_name"];
      }
    }
  }

  // Extract "who lessons are for" if not already set
  if (!currentState.whoLessonsFor) {
    if (lowerMessage.includes("my child") || lowerMessage.includes("my son") || lowerMessage.includes("my daughter") || lowerMessage.includes("for my kid")) {
      updates.whoLessonsFor = "child";
      // Mark collect_class_for as completed
      const completedSteps = currentState.completedSteps || [];
      if (!completedSteps.includes("collect_class_for")) {
        updates.completedSteps = [...completedSteps, "collect_class_for"];
      }
    } else if (lowerMessage.includes("myself") || lowerMessage.includes("for me") || lowerMessage.includes("i am") || lowerMessage.includes("i'm")) {
      updates.whoLessonsFor = "self";
      const completedSteps = currentState.completedSteps || [];
      if (!completedSteps.includes("collect_class_for")) {
        updates.completedSteps = [...completedSteps, "collect_class_for"];
      }
    } else if (lowerMessage.includes("family") || lowerMessage.includes("all of us")) {
      updates.whoLessonsFor = "family";
      const completedSteps = currentState.completedSteps || [];
      if (!completedSteps.includes("collect_class_for")) {
        updates.completedSteps = [...completedSteps, "collect_class_for"];
      }
    }
  }

  // Extract child age if not already set (for children)
  if (!currentState.childAge && currentState.whoLessonsFor === "child") {
    const ageMatch = userMessage.match(/(\d+)\s*(year|yr|yo|y\/o)/i) || userMessage.match(/\b(\d+)\b/);
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      if (age >= 3 && age <= 17) {
        updates.childAge = age;
        updates.age = age; // Keep for backwards compatibility
        
        // Auto-determine segment and program based on age
        if (age >= 3 && age <= 5) {
          updates.segment = "KIDS_3_5";
          updates.program = "Little Ninjas";
        } else if (age >= 6 && age <= 12) {
          updates.segment = "KIDS_6_12";
          updates.program = "Dragon Kids";
        } else if (age >= 13 && age <= 17) {
          updates.segment = "TEENS";
          updates.program = "Teens";
        }
        
        // Mark age and program steps as completed
        const completedSteps = updates.completedSteps || currentState.completedSteps || [];
        const newCompletedSteps = [...completedSteps];
        if (!newCompletedSteps.includes("collect_age")) {
          newCompletedSteps.push("collect_age");
        }
        if (!newCompletedSteps.includes("collect_program")) {
          newCompletedSteps.push("collect_program");
        }
        updates.completedSteps = newCompletedSteps;
      }
    }
  }

  // Extract phone if not already set
  if (!currentState.phone) {
    const phoneMatch = userMessage.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      updates.phone = phoneMatch[1];
    }
  }

  // Extract email if not already set OR detect skip
  if (!currentState.email && currentState.currentStep === "collect_email") {
    // Input normalization: trim, lowercase, remove punctuation
    const normalizedInput = userMessage.trim().toLowerCase().replace(/[!.?]/g, "");
    
    // Valid email-skipping inputs
    const SKIP_PHRASES = ["skip", "no", "no thanks", "rather not", "prefer not", "not now"];
    const isSkip = SKIP_PHRASES.some(phrase => normalizedInput === phrase || normalizedInput.includes(phrase));
    
    if (isSkip) {
      // User wants to skip email
      updates.email = null;
      // Mark email step as completed
      const completedSteps = currentState.completedSteps || [];
      if (!completedSteps.includes("collect_email")) {
        updates.completedSteps = [...completedSteps, "collect_email"];
      }
    } else {
      // Try to extract email
      const emailMatch = userMessage.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      if (emailMatch) {
        const extractedEmail = emailMatch[1];
        // Validate email format
        if (isValidEmail(extractedEmail)) {
          updates.email = extractedEmail;
          // Mark email step as completed
          const completedSteps = currentState.completedSteps || [];
          if (!completedSteps.includes("collect_email")) {
            updates.completedSteps = [...completedSteps, "collect_email"];
          }
        } else {
          // Invalid email format
          return { invalidEmail: true };
        }
      }
    }
  }

  return updates;
}

/**
 * Generate acknowledgment message after capturing information
 */
function generateAcknowledgment(updates: Partial<ChatbotState>, currentState: ChatbotState): string | null {
  // Acknowledge name capture
  if (updates.name) {
    const firstName = updates.name.split(' ')[0];
    return `Nice to meet you, ${firstName}! 👋`;
  }
  
  if (updates.whoLessonsFor) {
    if (updates.whoLessonsFor === "child") {
      return "Got it — this is for your child 👍";
    } else if (updates.whoLessonsFor === "self") {
      return "Perfect! This is for you 👍";
    } else if (updates.whoLessonsFor === "family") {
      return "Awesome! This is for your family 👍";
    }
  }
  
  if (updates.childAge && updates.program) {
    // Confirm age and auto-selected program in one line
    const ageRange = updates.segment === "KIDS_3_5" ? "3–5" : updates.segment === "KIDS_6_12" ? "6–12" : "13–17";
    return `Great — ${updates.program} (${ageRange}).`;
  }
  
  if (updates.age) {
    return `Great! Age ${updates.age}.`;
  }
  
  if (updates.phone) {
    return `Perfect! I have your phone number: ${updates.phone} 👍`;
  }
  
  if (updates.email === null) {
    // User skipped email
    return "No problem 👍";
  }
  
  if (updates.email) {
    return `Thanks! I have your email: ${updates.email} 📧`;
  }
  
  return null;
}

/**
 * Get fallback step if current step is undefined
 */
function getFallbackStep(currentState: ChatbotState): ConversationStep {
  if (!currentState.name) return "collect_name";
  if (!currentState.phone) return "collect_phone";
  if (!currentState.whoLessonsFor) return "collect_class_for";
  if (currentState.whoLessonsFor === "child" && !currentState.age) return "collect_age";
  if (!currentState.program) return "collect_program";
  return "show_slots";
}

/**
 * Execute tool call with error handling
 */
async function executeToolCall(
  toolName: string,
  toolArgs: any,
  newState: ChatbotState
): Promise<{ action?: ChatbotResponse["action"]; actionData?: any; updatedState: ChatbotState }> {
  try {
    logConversation(undefined, newState.currentStep || "unknown", toolName, undefined);

    let action: ChatbotResponse["action"] | undefined;
    let actionData: any;
    const updatedState = { ...newState };

    switch (toolName) {
      case "save_lead":
        action = "save_lead";
        updatedState.name = toolArgs.name || updatedState.name;
        updatedState.email = toolArgs.email || updatedState.email;
        updatedState.phone = toolArgs.phone || updatedState.phone;
        updatedState.age = toolArgs.age || updatedState.age;
        updatedState.program = toolArgs.program || updatedState.program;
        updatedState.conversationStage = "scheduling";
        updatedState.currentStep = "collect_class_for";
        actionData = toolArgs;
        break;

      case "get_schedule":
        action = "show_schedule";
        updatedState.program = toolArgs.program;
        updatedState.currentStep = "show_slots";
        actionData = { program: toolArgs.program };
        break;

      case "book_appointment":
        action = "book_appointment";
        updatedState.scheduledTime = toolArgs.scheduledTime;
        updatedState.conversationStage = "complete";
        updatedState.currentStep = "confirmation";
        actionData = { scheduledTime: toolArgs.scheduledTime };
        break;

      default:
        console.warn(`[CHATBOT] Unknown tool: ${toolName}`);
    }

    return { action, actionData, updatedState };
  } catch (error) {
    console.error(`[CHATBOT] Tool execution error for ${toolName}:`, error);
    throw error; // Re-throw to be caught by outer try-catch
  }
}

export async function chatWithChatGPT(
  userMessage: string,
  conversationHistory: Message[],
  currentState: ChatbotState
): Promise<ChatbotResponse> {
  const conversationId = currentState.name || "anonymous";
  
  try {
    // STEP 1: Extract information from user message and update state immediately
    const extractedInfo = extractInfoFromMessage(userMessage, currentState);
    
    // STEP 1.1: Check for invalid email and return error message immediately
    if (extractedInfo.invalidEmail) {
      return {
        message: "Hmm, that doesn't look like a valid email address. Could you double-check it? (Or type 'skip' if you'd prefer not to share)",
        state: currentState, // Don't update state, keep asking for email
        quickReplies: ["skip"],
      };
    }
    
    let newState = { ...currentState, ...extractedInfo };
    
    // STEP 1.5: Ensure step is defined (fallback if undefined)
    if (!newState.currentStep) {
      newState.currentStep = getFallbackStep(newState);
      console.log(`[CHATBOT] Step was undefined, reset to: ${newState.currentStep}`);
    }
    
    logConversation(conversationId, newState.currentStep || "unknown");
    
    // STEP 2: Generate acknowledgment if we captured new information
    const acknowledgment = generateAcknowledgment(extractedInfo, newState);
    
    // STEP 3: Build context message that includes current state
    const stateContext = `

CURRENT STATE (Information already collected - DO NOT ask for these again):
- Name: ${newState.name || "NOT COLLECTED YET"}
- Phone: ${newState.phone || "NOT COLLECTED YET"}
- Email: ${newState.email || "NOT COLLECTED YET (optional)"}
- Who lessons are for: ${newState.whoLessonsFor || "NOT COLLECTED YET"}
- Child age: ${newState.childAge || "NOT COLLECTED YET"}
- Segment: ${newState.segment || "NOT DETERMINED YET"}
- Program: ${newState.program || "NOT DETERMINED YET"}
- Current step: ${newState.currentStep || "greeting"}

REMEMBER: 
- If a field above shows a value, DO NOT ask for it again! Move to the next question.
- If whoLessonsFor=child AND childAge is missing, your NEXT message MUST ask for the age.
- Do NOT ask for program choice if childAge is missing.`;

    // Build messages array with system prompt, state context, and conversation history
    const messages: Message[] = [
      { role: "system", content: SYSTEM_PROMPT + stateContext },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    // STEP 4: Call ChatGPT with timeout guard
    let response: Awaited<ReturnType<typeof invokeLLM>>;
    try {
      response = (await Promise.race([
        invokeLLM({
          messages,
          tools: FUNCTIONS.map((fn) => ({
            type: "function" as const,
            function: fn,
          })),
          tool_choice: "auto" as const,
        }),
        createTimeoutPromise(LLM_TIMEOUT_MS),
      ])) as Awaited<ReturnType<typeof invokeLLM>>;
    } catch (timeoutError) {
      console.error(`[CHATBOT] LLM timeout after ${LLM_TIMEOUT_MS}ms`);
      logConversation(conversationId, newState.currentStep || "unknown", undefined, true);
      
      // Fallback: use flow controller to determine next step
      const fallbackStep = getFallbackStep(newState);
      return {
        message: getStepMessage(fallbackStep, newState as FlowControllerState),
        state: { ...newState, currentStep: fallbackStep },
        quickReplies: getStepQuickReplies(fallbackStep),
      };
    }

    const choice = response.choices[0];
    let assistantMessage = typeof choice.message.content === 'string' 
      ? choice.message.content 
      : JSON.stringify(choice.message.content) || "";
    const toolCalls = choice.message.tool_calls;

    // STEP 5: Handle function calls with complete tool-call loop
    let action: ChatbotResponse["action"] | undefined;
    let actionData: any;

    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      try {
        // Execute tool and get updated state
        const toolResult = await executeToolCall(functionName, functionArgs, newState);
        action = toolResult.action;
        actionData = toolResult.actionData;
        newState = toolResult.updatedState;

        // IMPORTANT: Complete the tool-call loop by sending tool output back to model
        // This ensures the model generates a final user-facing response
        if (!assistantMessage || assistantMessage.trim() === "") {
          const toolOutputMessages: Message[] = [
            ...messages,
            { 
              role: "assistant" as const, 
              content: assistantMessage || null,
              tool_calls: [toolCall] as any
            },
            {
              role: "tool" as const,
              content: JSON.stringify({ success: true, ...actionData }),
              tool_call_id: toolCall.id,
            } as any,
          ];

          try {
            const finalResponse: Awaited<ReturnType<typeof invokeLLM>> = (await Promise.race([
              invokeLLM({ messages: toolOutputMessages }),
              createTimeoutPromise(LLM_TIMEOUT_MS),
            ])) as Awaited<ReturnType<typeof invokeLLM>>;

            assistantMessage = typeof finalResponse.choices[0].message.content === 'string'
              ? finalResponse.choices[0].message.content
              : JSON.stringify(finalResponse.choices[0].message.content) || "";
          } catch (finalTimeoutError) {
            console.error(`[CHATBOT] Final response timeout after tool execution`);
            assistantMessage = "Let me help you with that!";
          }
        }
      } catch (toolError) {
        console.error(`[CHATBOT] Tool execution failed:`, toolError);
        logConversation(conversationId, newState.currentStep || "unknown", functionName, true);
        
        return {
          message: ERROR_FALLBACK_MESSAGE,
          state: newState,
          quickReplies: getStepQuickReplies(newState.currentStep || "collect_name"),
        };
      }
    }

    // STEP 6: Prepend acknowledgment if we have one
    if (acknowledgment) {
      assistantMessage = acknowledgment + "\n\n" + assistantMessage;
    }

    // STEP 7: NextStepEnforcer - CRITICAL: Ensure bot ALWAYS asks next question
    // This prevents dead-ends after generic responses like "Let me help with that."
    const flowState: FlowControllerState = { 
      ...newState, 
      currentStep: newState.currentStep || "collect_name",
      classFor: newState.whoLessonsFor,
      emailAsked: !!newState.email || newState.currentStep === "collect_email"
    };
    
    // Determine next step based on current state
    const nextStep = getNextStep(flowState);
    const nextStepMessage = getStepMessage(nextStep, flowState);
    const nextStepQuickReplies = getStepQuickReplies(nextStep);
    
    // ALWAYS check if we need to append next question
    // Rule: If not complete AND message doesn't contain a clear question, append next step
    const hasQuestion = assistantMessage.includes('?');
    const isComplete = nextStep === "complete";
    const needsNextQuestion = !isComplete && (!hasQuestion || nextStep !== newState.currentStep);
    
    // If we need next question, ALWAYS append it
    if (needsNextQuestion) {
      console.log(`[CHATBOT] NextStepEnforcer activated: current=${newState.currentStep}, next=${nextStep}, hasQuestion=${hasQuestion}`);
      
      // Update state to next step
      newState.currentStep = nextStep;
      
      // ALWAYS append next question (even if message already has content)
      // This ensures we never end on a generic statement
      if (!assistantMessage.trim().endsWith(nextStepMessage)) {
        // Add separator if message has content
        const separator = assistantMessage.trim().length > 0 ? "\n\n" : "";
        assistantMessage = assistantMessage.trim() + separator + nextStepMessage;
      }
    } else if (!isComplete && !hasQuestion) {
      // Safety net: If somehow we're not complete but have no question, force next step
      console.log(`[CHATBOT] Safety net activated: forcing next question`);
      newState.currentStep = nextStep;
      assistantMessage = assistantMessage.trim() + "\n\n" + nextStepMessage;
    }
    
    // STEP 8: Response Linter - Remove robotic filler text and banned phrases
    const BANNED_PHRASES = [
      "Let me help you with that",
      "let me help you with that",
      "I'd be happy to help with that",
      "I'd be happy to help with that",
      "Sure thing!",
      "sure thing!",
    ];
    
    for (const phrase of BANNED_PHRASES) {
      // Remove the phrase and any trailing punctuation/whitespace
      assistantMessage = assistantMessage.replace(new RegExp(phrase + "[!.]*\\s*", "gi"), "");
    }
    
    // Clean up any double spaces or empty lines created by removal
    assistantMessage = assistantMessage.replace(/\n\n\n+/g, "\n\n").trim();
    
    // STEP 9: Extract quick-reply buttons from message
    const quickReplies: string[] = [];
    const lines = assistantMessage.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^[-•*]\s*(.+)$/);
      if (match && match[1]) {
        const option = match[1].trim();
        if (option.length < 50 && !option.includes(':')) {
          quickReplies.push(option);
        }
      }
    }

    // Use flow controller for quick replies if ChatGPT didn't provide any
    const finalQuickReplies = quickReplies.length > 0 ? quickReplies : nextStepQuickReplies;

    logConversation(conversationId, newState.currentStep || "unknown", undefined, true);

    // STEP 10: Add debug info in development mode
    let debugInfo = undefined;
    if (process.env.NODE_ENV === "development") {
      debugInfo = {
        nextStep: newState.currentStep,
        classFor: newState.whoLessonsFor,
        childAge: newState.childAge,
        segment: newState.segment,
        program: newState.program,
        completedSteps: newState.completedSteps || [],
      };
      console.log("[CHATBOT DEBUG]", debugInfo);
    }

    return {
      message: assistantMessage,
      state: newState,
      action,
      actionData,
      quickReplies: finalQuickReplies,
      debugInfo, // Only included in development
    };
  } catch (error) {
    // STEP 8: Catch-all error handler - NEVER leave user without a response
    console.error(`[CHATBOT] Unhandled error:`, error);
    logConversation(conversationId, currentState.currentStep || "unknown", undefined, true);
    
    // Return fallback response with current state
    const fallbackStep = getFallbackStep(currentState);
    return {
      message: ERROR_FALLBACK_MESSAGE,
      state: { ...currentState, currentStep: fallbackStep },
      quickReplies: getStepQuickReplies(fallbackStep),
    };
  }
}
