/**
 * Intent Router - Detects user intent before processing booking flow
 * 
 * Enables conversational intelligence: answer questions mid-flow without breaking state
 */

import { invokeLLM } from "./_core/llm";

export type Intent = 
  | "general_q"      // User asking a general question (what to wear, cost, etc.)
  | "pricing"        // User asking about pricing/membership
  | "enroll_now"     // User wants to enroll immediately
  | "schedule_only"  // User wants to see available slots
  | "trial"          // User wants to book a trial (continue normal flow)
  | "intake_continue"; // Continue with current intake step

export interface IntentDetectionResult {
  intent: Intent;
  confidence: number; // 0-1
  extractedEntities?: {
    name?: string;
    phone?: string;
    age?: number;
    program?: string;
    days?: string[];
    goals?: string;
  };
  reasoning?: string; // Why this intent was detected
}

/**
 * Detect user intent using LLM
 * 
 * @param userMessage - The user's message
 * @param currentStep - Current step in the booking flow
 * @param conversationHistory - Recent conversation history for context
 * @returns Intent detection result
 */
export async function detectIntent(
  userMessage: string,
  currentStep: string,
  conversationHistory?: string[]
): Promise<IntentDetectionResult> {
  const historyContext = conversationHistory?.slice(-3).join("\n") || "";

  const systemPrompt = `You are an intent classifier for a martial arts school chatbot.

Current booking flow step: ${currentStep}

Classify the user's message into ONE of these intents:
1. "general_q" - User asking a general question (What should I wear? What's the address? Do you have parking?)
2. "pricing" - User asking about pricing, membership costs, fees
3. "enroll_now" - User explicitly wants to enroll/sign up immediately (not just trial)
4. "schedule_only" - User wants to see available class times/slots
5. "trial" - User wants to book a trial class (continue normal booking flow)
6. "intake_continue" - User is answering the current booking flow question (name, phone, email, etc.)

Return JSON:
{
  "intent": "general_q" | "pricing" | "enroll_now" | "schedule_only" | "trial" | "intake_continue",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation why this intent was chosen",
  "extractedEntities": {
    "name": "if mentioned",
    "phone": "if mentioned",
    "age": number if mentioned,
    "program": "if mentioned",
    "days": ["Monday", "Tuesday"] if mentioned,
    "goals": "if mentioned"
  }
}

Examples:
- "How much does it cost?" → intent: "pricing"
- "What should I wear to class?" → intent: "general_q"
- "I want to enroll my son" → intent: "enroll_now"
- "When are classes?" → intent: "schedule_only"
- "My name is John" → intent: "intake_continue"
- "281-555-1234" → intent: "intake_continue"
- "I'd like to book a trial" → intent: "trial"

Recent conversation:
${historyContext}

User message: "${userMessage}"

Respond with ONLY the JSON object, no other text.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intent_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: ["general_q", "pricing", "enroll_now", "schedule_only", "trial", "intake_continue"],
              },
              confidence: {
                type: "number",
                description: "Confidence score between 0 and 1",
              },
              reasoning: {
                type: "string",
                description: "Brief explanation of why this intent was chosen",
              },
              extractedEntities: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  phone: { type: "string" },
                  age: { type: "number" },
                  program: { type: "string" },
                  days: {
                    type: "array",
                    items: { type: "string" },
                  },
                  goals: { type: "string" },
                },
                additionalProperties: false,
              },
            },
            required: ["intent", "confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const contentText = typeof content === 'string' ? content : JSON.stringify(content);
    const result: IntentDetectionResult = JSON.parse(contentText);

    console.log("[Intent Detection]", {
      userMessage,
      currentStep,
      detectedIntent: result.intent,
      confidence: result.confidence,
      reasoning: result.reasoning,
    });

    return result;
  } catch (error) {
    console.error("[Intent Detection] Error:", error);
    // Fallback: assume user is continuing intake flow
    return {
      intent: "intake_continue",
      confidence: 0.5,
      reasoning: "Fallback due to intent detection error",
    };
  }
}

/**
 * Answer a general question using LLM
 * 
 * @param question - User's question
 * @returns Brief answer to the question
 */
export async function answerGeneralQuestion(question: string): Promise<string> {
  const systemPrompt = `You are Kai, a helpful AI assistant for MyDojo martial arts school in Tomball, Texas.

Answer the user's question briefly and helpfully. Keep responses under 3 sentences.

School information:
- Location: Tomball HQ, 14750 Telge Rd, Houston, TX 77095
- Programs: Little Ninjas (ages 3-5), Dragon Kids (ages 6-12), Teens (ages 13-17), Adult Karate, Kickboxing
- What to wear: Comfortable athletic clothing (t-shirt, shorts/pants, bare feet)
- What to bring: Water bottle, positive attitude
- Parking: Free parking available in front of building
- Trial classes: Free trial class available for all programs
- Membership: Month-to-month with 60-day cancellation notice

If you don't know the answer, say "I'm not sure about that. Our team can help when you come in!"

User question: "${question}"

Respond with a brief, friendly answer (max 3 sentences).`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    });

    const content = response.choices[0].message.content;
    const answer = (typeof content === 'string' ? content : JSON.stringify(content)) || "I'm not sure about that. Our team can help when you come in!";

    console.log("[General Question]", {
      question,
      answer,
    });

    return answer;
  } catch (error) {
    console.error("[General Question] Error:", error);
    return "I'm not sure about that. Our team can help when you come in!";
  }
}
