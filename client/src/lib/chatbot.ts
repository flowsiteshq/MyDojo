// Global function to open the trial chatbot from anywhere in the app
// This dispatches a custom event that the ChatbotContext listens for
export function openTrialChatbot() {
  window.dispatchEvent(new CustomEvent('openTrialChatbot'));
}

// Global function to open the intake/enrollment chatbot from anywhere in the app
// This dispatches a custom event that the ChatbotContext listens for
export function openIntakeChatbot() {
  window.dispatchEvent(new CustomEvent('openIntakeChatbot'));
}
