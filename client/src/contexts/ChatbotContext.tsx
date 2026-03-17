import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ChatGPTChatbot } from "@/components/ChatGPTChatbot";
import { IntakeChatbot } from "@/components/IntakeChatbot";

interface ChatbotContextType {
  isOpen: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
  openIntake: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  const openChatbot = () => setIsOpen(true);
  const closeChatbot = () => setIsOpen(false);
  const openIntake = () => setIsIntakeOpen(true);

  // Mount guard to prevent double initialization
  useEffect(() => {
    if ((window as any).__KAI_WIDGET_LOADED) {
      console.warn('[KAI BOT] Widget already loaded. Skipping duplicate mount.');
      return;
    }
    (window as any).__KAI_WIDGET_LOADED = true;
    
    // Dev indicator
    if (import.meta.env.DEV) {
      console.log('🤖 [KAI BOT INIT: v2] ChatGPT-powered assistant loaded');
    }

    // Listen for global openTrialChatbot (legacy ChatGPT bot) events
    const handleOpenChatbot = () => {
      console.log('[KAI BOT] Opening chatbot via event');
      setIsOpen(true);
    };
    // Listen for global openIntakeChatbot (primary enrollment bot) events
    const handleOpenIntakeChatbot = () => {
      console.log('[KAI BOT] Opening intake chatbot via event');
      setIsIntakeOpen(true);
    };
    window.addEventListener('openTrialChatbot', handleOpenChatbot);
    window.addEventListener('openIntakeChatbot', handleOpenIntakeChatbot);
    
    return () => {
      window.removeEventListener('openTrialChatbot', handleOpenChatbot);
      window.removeEventListener('openIntakeChatbot', handleOpenIntakeChatbot);
      (window as any).__KAI_WIDGET_LOADED = false;
    };
  }, []);

  return (
    <ChatbotContext.Provider value={{ isOpen, openChatbot, closeChatbot, openIntake }}>
      {children}
      {/* Primary enrollment chatbot — IntakeChatbot */}
      {isIntakeOpen && <IntakeChatbot onClose={() => setIsIntakeOpen(false)} />}
      {isOpen && (
        <>
          {/* Dev indicator - only visible in development */}
          {import.meta.env.DEV && (
            <div 
              style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#00ff00',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                zIndex: 999999,
                pointerEvents: 'none',
              }}
            >
              Kai Bot v2
            </div>
          )}
          <ChatGPTChatbot onClose={closeChatbot} />
        </>
      )}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
}
