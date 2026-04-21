import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Plus, Mic, Send } from "lucide-react";
import { Streamdown } from "streamdown";

// Format timestamp like iMessage: "Today 7:24 PM" or "Mon 5:30 PM"
function formatTimestamp(date: Date): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today ${timeStr}`;
  const dayStr = date.toLocaleDateString([], { weekday: "short" });
  return `${dayStr} ${timeStr}`;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  status?: "sending" | "sent" | "delivered" | "read";
  timestamp: Date;
}

interface ChatbotState {
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  program?: string;
  scheduledTime?: string;
  conversationStage: "greeting" | "collecting_info" | "scheduling" | "complete";
  leadId?: number;
}

// Swipeable message bubble with iMessage-style timestamp reveal + Kai avatar
function SwipeableMessage({
  message,
  isUser,
  isGrouped,
  showTimeHeader,
}: {
  message: Message;
  isUser: boolean;
  isGrouped: boolean;
  showTimeHeader: boolean;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - startXRef.current;
    setDragX(Math.max(-80, Math.min(0, delta)));
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragX < -30) {
      setTimeout(() => setDragX(0), 1500);
    } else {
      setDragX(0);
    }
  }, [dragX]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startXRef.current;
    setDragX(Math.max(-80, Math.min(0, delta)));
  }, [isDragging]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    if (dragX < -30) {
      setTimeout(() => setDragX(0), 1500);
    } else {
      setDragX(0);
    }
  }, [dragX]);

  return (
    <div>
      {/* Time group header */}
      {showTimeHeader && (
        <div className="flex justify-center my-2">
          <span className="text-[11px] text-gray-400 font-medium">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      )}

      <div
        className={`flex items-end gap-2 relative overflow-hidden select-none ${
          isUser ? "justify-end" : "justify-start"
        } ${isGrouped ? "mt-1" : "mt-4"}`}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Timestamp revealed on swipe */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-medium whitespace-nowrap pointer-events-none transition-opacity duration-200"
          style={{
            opacity: dragX < -20 ? 1 : 0,
            transform: `translateX(${80 + dragX}px) translateY(-50%)`,
          }}
        >
          {formatTimestamp(message.timestamp)}
        </div>

        {/* Kai avatar for assistant messages */}
        {!isUser && !isGrouped && (
          <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
            <img
              src="/images/logo-icon-white.webp"
              alt="Kai"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
        )}
        {!isUser && isGrouped && <div className="w-7 flex-shrink-0" />}

        {/* Bubble */}
        <div
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            maxWidth: "75%",
          }}
        >
          <div
            className={`relative px-4 py-2 ${
              isUser
                ? "bg-[#007AFF] text-white rounded-[20px]"
                : "bg-white text-black rounded-[20px]"
            }`}
            style={{
              borderBottomLeftRadius: !isUser && !isGrouped ? "4px" : "20px",
              borderBottomRightRadius: isUser && !isGrouped ? "4px" : "20px",
            }}
          >
            {/* Message tail */}
            {!isGrouped && (
              <div
                className={`absolute bottom-0 ${
                  isUser ? "right-0 translate-x-1" : "left-0 -translate-x-1"
                }`}
                style={{
                  width: 0,
                  height: 0,
                  borderStyle: "solid",
                  borderWidth: isUser ? "0 0 12px 12px" : "0 12px 12px 0",
                  borderColor: isUser
                    ? "transparent transparent #007AFF transparent"
                    : "transparent white transparent transparent",
                }}
              />
            )}
            <Streamdown>{message.content}</Streamdown>
          </div>
        </div>

        {/* Spacer for user messages to keep avatar alignment */}
        {isUser && <div className="w-0" />}
      </div>
    </div>
  );
}

export function ChatGPTChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatbotState, setChatbotState] = useState<ChatbotState>({
    conversationStage: "greeting",
  });
  
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [showingSchedule, setShowingSchedule] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatMutation = trpc.chatgpt.chat.useMutation();
  const saveLeadMutation = trpc.trialSignups.create.useMutation();
  const updateLeadMutation = trpc.trialSignups.update.useMutation();

  // Slide-up animation on mount + initialization guard
  useEffect(() => {
    // Additional safety check to prevent double mounting
    if ((window as any).__KAI_CHATBOT_INSTANCE) {
      console.warn('[KAI BOT] Chatbot instance already exists. Preventing duplicate mount.');
      return;
    }
    (window as any).__KAI_CHATBOT_INSTANCE = true;
    
    console.log('[KAI BOT] ChatGPT chatbot component mounted');
    
    // Trigger slide-up animation after a tiny delay
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    
    return () => {
      (window as any).__KAI_CHATBOT_INSTANCE = false;
      console.log('[KAI BOT] ChatGPT chatbot component unmounted');
    };
  }, []);

  // Handle close with slide-down animation
  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Handle actions from ChatGPT
  const handleAction = async (action: string, actionData: any) => {
    switch (action) {
      case "save_lead":
        try {
          const result = await saveLeadMutation.mutateAsync({
            name: actionData.name,
            email: actionData.email || "",
            phone: actionData.phone,
            program: actionData.program || "Not Sure",
            location: "HQ",
            source: "chatbot",
          });
          setChatbotState(prev => ({ ...prev, leadId: result.id }));
          console.log("Lead saved successfully, ID:", result.id);
        } catch (error) {
          console.error("Error saving lead:", error);
        }
        break;
      case "show_schedule":
        try {
          const mockSlots = [
            { dayOfWeek: "Monday", formattedDate: "Feb 19", formattedTime: "5:00 PM", isoDateTime: "2026-02-19T17:00:00" },
            { dayOfWeek: "Tuesday", formattedDate: "Feb 20", formattedTime: "5:00 PM", isoDateTime: "2026-02-20T17:00:00" },
            { dayOfWeek: "Wednesday", formattedDate: "Feb 21", formattedTime: "5:00 PM", isoDateTime: "2026-02-21T17:00:00" },
            { dayOfWeek: "Thursday", formattedDate: "Feb 22", formattedTime: "5:00 PM", isoDateTime: "2026-02-22T17:00:00" },
            { dayOfWeek: "Saturday", formattedDate: "Feb 24", formattedTime: "10:00 AM", isoDateTime: "2026-02-24T10:00:00" },
            { dayOfWeek: "Saturday", formattedDate: "Feb 24", formattedTime: "11:00 AM", isoDateTime: "2026-02-24T11:00:00" },
          ];
          setAvailableSlots(mockSlots);
          setShowingSchedule(true);
          console.log("Schedule loaded:", mockSlots);
        } catch (error) {
          console.error("Error loading schedule:", error);
        }
        break;
      case "book_appointment":
        try {
          if (!chatbotState.leadId) {
            console.error("No lead ID available for booking");
            return;
          }
          await updateLeadMutation.mutateAsync({
            id: chatbotState.leadId,
            // scheduledTime will be handled by the backend
          });
          setChatbotState(prev => ({ ...prev, scheduledTime: actionData.scheduledTime, conversationStage: "complete" }));
          console.log("Appointment booked:", actionData.scheduledTime);
        } catch (error) {
          console.error("Error booking appointment:", error);
        }
        break;
    }
  };

  // Send message to ChatGPT
  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      status: "sent",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Update status to delivered after a short delay
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === userMsg.id ? { ...msg, status: "delivered" as const } : msg
      ));
    }, 500);

    try {
      // Show typing indicator with natural delay
      setTimeout(() => setIsTyping(true), 150);

      // Natural delay before response (1.6-2.4s)
      const delay = 1600 + Math.random() * 800;
      await new Promise(resolve => setTimeout(resolve, delay));

      const response = await chatMutation.mutateAsync({
        message: userMessage,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        currentState: chatbotState,
      });

      setIsTyping(false);

      // Handle actions if present
      if (response.action && response.actionData) {
        await handleAction(response.action, response.actionData);
      }

      // Add assistant message
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        quickReplies: response.quickReplies,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Mark user message as read when assistant responds
      setMessages(prev => prev.map(msg => 
        msg.id === userMsg.id ? { ...msg, status: "read" as const } : msg
      ));

      // Chatbot state is managed internally
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot: any) => {
    setShowingSchedule(false);
    sendMessage(`I'd like to book ${slot.dayOfWeek} ${slot.formattedDate} at ${slot.formattedTime}`);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Send initial greeting
  useEffect(() => {
    const greeting: Message = {
      id: "greeting",
      role: "assistant",
      content: "Hi! I'm Kai, your MyDojo assistant. I'm here to help you book a free trial class. What's your name?",
      timestamp: new Date(),
    };
    setMessages([greeting]);
  }, []);

  // Helper to check if messages should be grouped
  const shouldGroupWithPrevious = (currentMsg: Message, index: number) => {
    if (index === 0) return false;
    const prevMsg = messages[index - 1];
    return prevMsg.role === currentMsg.role;
  };

  // Get the last user message for status display
  const lastUserMessage = messages.filter(m => m.role === "user").pop();

  return (
    <>
      {/* Full-screen overlay with slide-up animation */}
      <div
        className={`fixed inset-0 w-screen h-screen bg-[#f2f2f7] z-[999999] flex flex-col transition-transform duration-300 ease-out ${
          isClosing ? 'translate-y-full' : isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          height: '100dvh', // Use dynamic viewport height for mobile
          width: '100vw',
        }}
      >
        {/* Status bar (iPhone-style) */}
        <div className="h-11 bg-[#f2f2f7] flex items-center justify-between px-6 text-sm">
          <span className="font-semibold">10:21</span>
          <div className="flex items-center gap-1">
            {/* Signal icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="1" y="16" width="4" height="8" rx="1"/>
              <rect x="7" y="12" width="4" height="12" rx="1"/>
              <rect x="13" y="8" width="4" height="16" rx="1"/>
              <rect x="19" y="4" width="4" height="20" rx="1"/>
            </svg>
            {/* WiFi icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-6.364-6.364a7 7 0 0 1 9.899 0l-1.415 1.415a5 5 0 0 0-7.07 0l-1.414-1.415zm-2.829-2.828a11 11 0 0 1 15.556 0l-1.414 1.414a9 9 0 0 0-12.728 0l-1.414-1.414z"/>
            </svg>
            {/* Battery icon */}
            <svg className="w-6 h-3" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="1" y="2" width="18" height="8" rx="2"/>
              <rect x="3" y="4" width="14" height="4" fill="currentColor"/>
              <rect x="20" y="4" width="2" height="4" rx="1" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* ── BLACK BRANDED HEADER ── */}
        <div className="bg-black sticky top-0 z-10 flex flex-col">
          <div className="px-4 h-14 flex items-center justify-between">
            {/* Back button */}
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Center: logo + Kai name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                <img
                  src="/images/logo-icon-white.webp"
                  alt="MyDojo"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-bold tracking-wide leading-none">Kai</p>
                <p className="text-white/50 text-[10px] leading-none mt-0.5">MyDojo Assistant</p>
              </div>
            </div>

            {/* Spacer to balance layout */}
            <div className="w-16" />
          </div>
          {/* Red accent line */}
          <div className="h-0.5 bg-red-600" />
        </div>

        {/* Messages container - scrollable */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          }}
        >
          {messages.map((message, index) => {
            const isGrouped = shouldGroupWithPrevious(message, index);
            const isUser = message.role === "user";
            const prevMessage = index > 0 ? messages[index - 1] : undefined;
            const showTimeHeader = !prevMessage ||
              message.timestamp.getTime() - prevMessage.timestamp.getTime() > 5 * 60 * 1000;

            return (
              <SwipeableMessage
                key={message.id}
                message={message}
                isUser={isUser}
                isGrouped={isGrouped}
                showTimeHeader={showTimeHeader}
              />
            );
          })}

          {/* Typing indicator with Kai avatar */}
          {isTyping && (
            <div className="flex justify-start mt-4 items-end gap-2">
              {/* Kai avatar */}
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                <img
                  src="/images/logo-icon-white.webp"
                  alt="Kai"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <div className="bg-white text-black rounded-[20px] px-4 py-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Schedule slots */}
          {showingSchedule && availableSlots.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600 mb-2">Available times:</div>
              {availableSlots.slice(0, 6).map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-[#007AFF] hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold text-gray-900">
                    {slot.dayOfWeek}, {slot.formattedDate}
                  </div>
                  <div className="text-sm text-gray-600">{slot.formattedTime}</div>
                </button>
              ))}
              {availableSlots.length > 6 && (
                <button className="w-full text-[#007AFF] text-sm font-medium py-2">
                  See more times →
                </button>
              )}
            </div>
          )}

          {/* Message status (only show for last user message) */}
          {lastUserMessage && (
            <div className="flex justify-end mt-1 items-center gap-1">
              {lastUserMessage.status === "sending" && (
                <span className="text-xs text-gray-400">Sending...</span>
              )}
              {lastUserMessage.status === "sent" && (
                <>
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-gray-400">Sent</span>
                </>
              )}
              {lastUserMessage.status === "delivered" && (
                <>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12l5 5L18 4M7 12l5 5L24 4" />
                  </svg>
                  <span className="text-xs text-gray-400">Delivered</span>
                </>
              )}
              {lastUserMessage.status === "read" && (
                <>
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12l5 5L18 4M7 12l5 5L24 4" />
                  </svg>
                  <span className="text-xs text-red-500">Read</span>
                </>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom input bar (sticky) */}
        <div className="sticky bottom-0 bg-[#f2f2f7] border-t border-gray-300 px-4 py-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:bg-transparent p-0 h-auto"
          >
            <Plus className="w-6 h-6" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="iMessage"
              className="bg-white border-gray-300 rounded-full px-4 py-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
          </div>

          {input.trim() ? (
            <Button
              onClick={() => sendMessage(input)}
              disabled={isLoading}
              className="bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full w-8 h-8 p-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-transparent p-0 h-auto"
            >
              <Mic className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
