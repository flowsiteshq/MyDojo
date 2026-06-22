import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ChatGPTChatbot } from "@/components/ChatGPTChatbot";
import { IntakeChatbot } from "@/components/IntakeChatbot";
import { LeadCaptureModal, LeadData } from "@/components/LeadCaptureModal";

interface ChatbotContextType {
  isOpen: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
  openIntake: () => void;
  openBookFreeClassGate: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  const openChatbot = () => setIsOpen(true);
  const closeChatbot = () => setIsOpen(false);
  const openIntake = () => setIsIntakeOpen(true);
  const openBookFreeClassGate = () => setIsGateOpen(true);

  /** Called when the lead-capture form is submitted successfully */
  function handleLeadCaptured(lead: LeadData) {
    setIsGateOpen(false);
    setLeadData(lead);
    setIsIntakeOpen(true);
  }

  // Mount guard to prevent double initialization
  useEffect(() => {
    if ((window as any).__KAI_WIDGET_LOADED) {
      console.warn('[KAI BOT] Widget already loaded. Skipping duplicate mount.');
      return;
    }
    (window as any).__KAI_WIDGET_LOADED = true;

    if (import.meta.env.DEV) {
      console.log('🤖 [KAI BOT INIT: v2] ChatGPT-powered assistant loaded');
    }

    // Legacy ChatGPT bot
    const handleOpenChatbot = () => {
      console.log('[KAI BOT] Opening chatbot via event');
      setIsOpen(true);
    };

    // Intake chatbot — optionally carries lead data in event.detail
    const handleOpenIntakeChatbot = (e: Event) => {
      console.log('[KAI BOT] Opening intake chatbot via event');
      const detail = (e as CustomEvent).detail as LeadData | null;
      if (detail?.name) {
        setLeadData(detail);
      }
      setIsIntakeOpen(true);
    };

    // Book-a-free-class gate
    const handleOpenGate = () => {
      console.log('[KAI BOT] Opening lead-capture gate via event');
      setIsGateOpen(true);
    };

    window.addEventListener('openTrialChatbot', handleOpenChatbot);
    window.addEventListener('openIntakeChatbot', handleOpenIntakeChatbot);
    window.addEventListener('openBookFreeClassGate', handleOpenGate);

    return () => {
      window.removeEventListener('openTrialChatbot', handleOpenChatbot);
      window.removeEventListener('openIntakeChatbot', handleOpenIntakeChatbot);
      window.removeEventListener('openBookFreeClassGate', handleOpenGate);
      (window as any).__KAI_WIDGET_LOADED = false;
    };
  }, []);

  return (
    <ChatbotContext.Provider
      value={{ isOpen, openChatbot, closeChatbot, openIntake, openBookFreeClassGate }}
    >
      {children}

      {/* ── Lead-capture gate ── */}
      {isGateOpen && (
        <LeadCaptureModal
          onSuccess={handleLeadCaptured}
          onClose={() => setIsGateOpen(false)}
        />
      )}

      {/* ── Primary enrollment chatbot — IntakeChatbot ── */}
      {isIntakeOpen && (
        <IntakeChatbot
          onClose={() => { setIsIntakeOpen(false); setLeadData(null); }}
          leadData={leadData}
        />
      )}

      {/* ── Legacy ChatGPT bot ── */}
      {isOpen && (
        <>
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
