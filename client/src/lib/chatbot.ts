// Global function to open the trial chatbot from anywhere in the app
// This dispatches a custom event that the ChatbotContext listens for
export function openTrialChatbot() {
  window.dispatchEvent(new CustomEvent('openTrialChatbot'));
}

export interface IntakeChatbotLeadData {
  name: string;
  phone?: string;
  email?: string;
}

/**
 * Open the intake/enrollment chatbot.
 * Optionally pass lead data so Kai can greet the visitor by name.
 */
export function openIntakeChatbot(lead?: IntakeChatbotLeadData) {
  window.dispatchEvent(
    new CustomEvent('openIntakeChatbot', { detail: lead ?? null })
  );
}

/**
 * Open the "Book a Free Class" lead-capture gate.
 * The gate collects name/phone/email, saves the lead, then opens Kai.
 */
export function openBookFreeClassGate() {
  window.dispatchEvent(new CustomEvent('openBookFreeClassGate'));
}
