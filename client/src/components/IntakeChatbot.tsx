import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ChevronLeft, Send, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Streamdown } from "streamdown";
import { FluidPayEnrollmentForm } from "@/components/FluidPayEnrollmentForm";

// Feature flag: set VITE_KAI_TRIAL_FIRST_V2=true to enable new Trial-First Strategy
const USE_TRIAL_FIRST_V2 = import.meta.env.VITE_KAI_TRIAL_FIRST_V2 === "true";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "read";
}

interface IntakeSlot {
  day: string;
  date: string;
  time: string;
  displayText: string;
}

interface IntakeChatbotProps {
  onClose: () => void;
}

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

// ─── Shared Header ─────────────────────────────────────────────────────────
function ChatHeader({ onClose, extraControls }: { onClose: () => void; extraControls?: React.ReactNode }) {
  return (
    <div className="bg-black flex flex-col flex-shrink-0">
      <div className="px-4 h-14 flex items-center justify-between">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Center: logo + Kai name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            <img
              src="/images/logo-icon-white.99cb4daa.webp"
              alt="MyDojo"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-bold tracking-wide leading-none">Kai</p>
            <p className="text-white/50 text-[10px] leading-none mt-0.5">MyDojo Assistant</p>
          </div>
        </div>

        {/* Right side: extra controls or spacer */}
        <div className="w-16 flex justify-end">
          {extraControls}
        </div>
      </div>
      {/* Red accent line */}
      <div className="h-0.5 bg-red-600" />
    </div>
  );
}

// ─── Swipeable Message Bubble ───────────────────────────────────────────────
function SwipeableMessage({
  message,
  isUser,
  showTimeHeader,
  isLastUserMsg,
}: {
  message: Message;
  isUser: boolean;
  showTimeHeader: boolean;
  isLastUserMsg: boolean;
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
        <div className="flex justify-center my-3">
          <span className="text-[11px] text-gray-400 font-medium">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      )}

      <div
        className={`flex items-end gap-2 relative overflow-hidden select-none ${
          isUser ? "justify-end" : "justify-start"
        }`}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Timestamp revealed on swipe (right side) */}
        <div
          className="absolute right-0 top-1/2 text-[11px] text-gray-400 font-medium whitespace-nowrap pointer-events-none"
          style={{
            opacity: dragX < -20 ? 1 : 0,
            transform: `translateX(${80 + dragX}px) translateY(-50%)`,
            transition: "opacity 0.15s",
          }}
        >
          {formatTimestamp(message.timestamp)}
        </div>

        {/* Kai avatar for assistant messages */}
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden self-end mb-1">
            <img
              src="/images/logo-icon-white.99cb4daa.webp"
              alt="Kai"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
        )}

        {/* Bubble */}
        <div
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            maxWidth: "80%",
          }}
        >
          <div
            className={`relative px-4 py-2.5 rounded-2xl ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {message.role === "assistant" ? (
              <Streamdown>{message.content}</Streamdown>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* Read/Delivered receipt — only on last user message */}
          {isUser && isLastUserMsg && (
            <div className="flex justify-end items-center gap-1 mt-0.5 pr-1">
              {message.status === "sending" && (
                <span className="text-[11px] text-gray-400">Sending...</span>
              )}
              {message.status === "sent" && (
                <>
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[11px] text-gray-400">Sent</span>
                </>
              )}
              {message.status === "delivered" && (
                <>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 10l4 4L14 4M8 10l4 4 6-8" />
                  </svg>
                  <span className="text-[11px] text-gray-400">Delivered</span>
                </>
              )}
              {message.status === "read" && (
                <>
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 10l4 4L14 4M8 10l4 4 6-8" />
                  </svg>
                  <span className="text-[11px] text-red-500">Read</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator with Kai Avatar ──────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mt-4">
      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
        <img src="/images/logo-icon-white.99cb4daa.webp" alt="Kai" className="w-full h-full object-contain p-0.5" />
      </div>
      <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

// ─── Message List ───────────────────────────────────────────────────────────
function MessageList({ messages, isProcessing }: { messages: Message[]; isProcessing: boolean }) {
  const lastUserMsgId = [...messages].reverse().find(m => m.role === "user")?.id;

  return (
    <>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const prevMessage = index > 0 ? messages[index - 1] : undefined;
        const showTimeHeader =
          !prevMessage ||
          message.timestamp.getTime() - prevMessage.timestamp.getTime() > 5 * 60 * 1000;

        return (
          <SwipeableMessage
            key={message.id}
            message={message}
            isUser={isUser}
            showTimeHeader={showTimeHeader}
            isLastUserMsg={message.id === lastUserMsgId}
          />
        );
      })}
      {isProcessing && <TypingIndicator />}
    </>
  );
}

// ─── V2 Trial-First Chatbot ────────────────────────────────────────────────

function IntakeChatbotV2({ onClose }: IntakeChatbotProps) {
  const [sessionId] = useState(() => `intake-v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tfState, setTfState] = useState<any>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<any | null>(null);
  const [debugExpanded, setDebugExpanded] = useState(false);

  // Detect if user is outside CST to show timezone notice
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isOutsideCST = !userTimezone.includes("Chicago") && !userTimezone.includes("Central");
  const userTzAbbr = (() => {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: userTimezone, timeZoneName: "short" })
        .formatToParts(new Date())
        .find(p => p.type === "timeZoneName")?.value || userTimezone;
    } catch { return userTimezone; }
  })();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDev = import.meta.env.DEV;

  const greetingQuery = trpc.chat.getIntakeGreetingV2.useQuery();

  const intakeStepV2Mutation = trpc.chat.intakeStepV2.useMutation({
    onSuccess: (data) => {
      const upgradeResult = (data as any).upgradeResult;
      let displayMessage = data.message;
      if (upgradeResult && !upgradeResult.found) {
        displayMessage = upgradeResult.message;
      }
      // Show typing indicator for 2 seconds before Kai's response appears
      setTimeout(() => {
        setMessages(prev => {
          // Mark last user message as "read"
          const updated = prev.map((m, i) =>
            m.role === "user" && i === prev.length - 1 ? { ...m, status: "read" as const } : m
          );
          return [
            ...updated,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: displayMessage,
              timestamp: new Date(),
            },
          ];
        });
        setTfState(data.state);
        setQuickReplies(data.quickReplies || []);
        if ((data as any).enrollmentData) setEnrollmentData((data as any).enrollmentData);
        setIsProcessing(false);
      }, 2000);
    },
    onError: (error) => {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `I ran into a snag. Let's try that again — or call us at (877) 4-MYDOJO.`,
          timestamp: new Date(),
        },
      ]);
      console.error("[IntakeChatbotV2] Error:", error);
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    if (greetingQuery.data) {
      // Show typing indicator for 2 seconds before greeting appears
      setIsProcessing(true);
      setTimeout(() => {
        setMessages([{
          id: "greeting",
          role: "assistant",
          content: greetingQuery.data!.message,
          timestamp: new Date(),
        }]);
        setTfState(greetingQuery.data!.state);
        setQuickReplies(greetingQuery.data!.quickReplies || []);
        setIsProcessing(false);
      }, 2000);
    }
  }, [greetingQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isProcessing && messages.length > 0) inputRef.current?.focus();
  }, [isProcessing, messages.length]);

  const handleSendMessage = (message: string) => {
    if (!message.trim() || isProcessing) return;

    const newMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
      status: "sending",
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue("");
    setQuickReplies([]);
    setEnrollmentData(null);
    setIsProcessing(true);

    // Simulate sent → delivered progression
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: "sent" } : m));
    }, 300);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: "delivered" } : m));
    }, 800);

    intakeStepV2Mutation.mutate({ message, sessionId, state: tfState });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ height: "100dvh" }}>
      {/* ── Full-screen enrollment overlay ── */}
      {enrollmentData && (
        <div className="absolute inset-0 z-20 bg-background flex flex-col" style={{ height: "100dvh" }}>
          {/* Overlay header */}
          <div className="bg-black flex items-center px-4 h-14 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEnrollmentData(null)}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Chat
            </button>
            <span className="flex-1 text-center text-white font-bold text-base">Enrollment</span>
            <div className="w-24" />
          </div>
          <div className="h-0.5 bg-red-600 flex-shrink-0" />
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <FluidPayEnrollmentForm
              enrollmentData={enrollmentData}
              onSuccess={(msg) => {
                setEnrollmentData(null);
                setMessages(prev => [...prev, {
                  id: `success-${Date.now()}`,
                  role: 'assistant',
                  content: msg,
                  timestamp: new Date(),
                }]);
              }}
              onError={(msg) => {
                setMessages(prev => [...prev, {
                  id: `error-${Date.now()}`,
                  role: 'assistant',
                  content: `Payment issue: ${msg}`,
                  timestamp: new Date(),
                }]);
              }}
            />
          </div>
        </div>
      )}
      <ChatHeader
        onClose={onClose}
        extraControls={isDev ? (
          <button
            onClick={() => setDebugExpanded(!debugExpanded)}
            className="text-[10px] text-yellow-400 font-mono flex items-center gap-0.5"
          >
            {debugExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            DBG
          </button>
        ) : undefined}
      />

      {isDev && debugExpanded && tfState && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 p-3 text-xs font-mono overflow-auto max-h-48">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">step:</span> <span className="text-yellow-900 dark:text-yellow-100">{tfState.step}</span></div>
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">prevStep:</span> <span className="text-yellow-900 dark:text-yellow-100">{tfState.prevStep || "—"}</span></div>
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">classFor:</span> <span className="text-yellow-900 dark:text-yellow-100">{tfState.classFor || "—"}</span></div>
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">childName:</span> <span className="text-yellow-900 dark:text-yellow-100">{tfState.childName || "—"}</span></div>
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">name:</span> <span className="text-yellow-900 dark:text-yellow-100">{tfState.name || "—"}</span></div>
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">phone:</span> <span className="text-yellow-900 dark:text-yellow-100">{tfState.phone || "—"}</span></div>
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">isDone:</span> <span className="text-yellow-900 dark:text-yellow-100">{String(tfState.isDone || false)}</span></div>
            <div><span className="text-yellow-700 dark:text-yellow-300 font-bold">sessionId:</span> <span className="text-yellow-900 dark:text-yellow-100 truncate">{sessionId.slice(-12)}</span></div>
          </div>
        </div>
      )}

      {/* CST timezone notice for users outside Central time */}
      {isOutsideCST && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2 flex-shrink-0">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-tight">
            You're in <strong>{userTzAbbr}</strong>. Class times are shown in <strong>CST</strong> — Tomball, TX local time.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <MessageList messages={messages} isProcessing={isProcessing} />

        {!isProcessing && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-start pt-1">
            {quickReplies.map((reply, index) => (
              <Button key={index} variant="outline" size="sm" onClick={() => handleSendMessage(reply)} className="text-sm">
                {reply}
              </Button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-card flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isProcessing} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── V1 Legacy Chatbot ─────────────────────────────────────────────────────

function IntakeChatbotV1({ onClose }: IntakeChatbotProps) {
  const [sessionId] = useState(() => `intake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [bookingRequestId] = useState(() => `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentState, setCurrentState] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<IntakeSlot[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<any | null>(null);
  const [openTooltipId, setOpenTooltipId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greetingQuery = trpc.chat.getIntakeGreeting.useQuery();

  const intakeStepMutation = trpc.chat.intakeStep.useMutation({
    onSuccess: (data) => {
      setMessages(prev => {
        const updated = prev.map((m, i) =>
          m.role === "user" && i === prev.length - 1 ? { ...m, status: "read" as const } : m
        );
        return [
          ...updated,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.assistantMessage,
            timestamp: new Date(),
          },
        ];
      });
      setCurrentState(data.state);
      setAvailableSlots(data.availableSlots || []);
      setMembershipPlans(data.membershipPlans || []);
      setQuickReplies(data.quickReplies || []);
      setEnrollmentData((data as any).enrollmentData || null);
      setIsProcessing(false);
    },
    onError: (error) => {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          timestamp: new Date(),
        },
      ]);
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    if (greetingQuery.data?.message) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: greetingQuery.data.message,
        timestamp: new Date(),
      }]);
    }
  }, [greetingQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isProcessing && messages.length > 0) inputRef.current?.focus();
  }, [isProcessing, messages.length]);

  const handleSendMessage = (message: string) => {
    if (!message.trim() || isProcessing) return;

    const newMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
      status: "sending",
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue("");
    setIsProcessing(true);

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: "sent" } : m));
    }, 300);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: "delivered" } : m));
    }, 800);

    intakeStepMutation.mutate({ message, sessionId, bookingRequestId, origin: window.location.origin });
  };

  const handleQuickReply = (reply: string) => handleSendMessage(reply);
  const handleSlotSelect = (slot: IntakeSlot) => handleSendMessage(slot.displayText);
  const handlePlanSelect = (plan: any) => handleSendMessage(plan.name);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ height: "100dvh" }}>
      {/* ── Full-screen enrollment overlay ── */}
      {enrollmentData && (
        <div className="absolute inset-0 z-20 bg-background flex flex-col" style={{ height: "100dvh" }}>
          <div className="bg-black flex items-center px-4 h-14 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEnrollmentData(null)}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium"
              style={{ minHeight: 44, minWidth: 44 }}
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Chat
            </button>
            <span className="flex-1 text-center text-white font-bold text-base">Enrollment</span>
            <div className="w-24" />
          </div>
          <div className="h-0.5 bg-red-600 flex-shrink-0" />
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <FluidPayEnrollmentForm
              enrollmentData={enrollmentData}
              onSuccess={(msg) => {
                setEnrollmentData(null);
                setMessages(prev => [...prev, {
                  id: `success-${Date.now()}`,
                  role: 'assistant',
                  content: msg,
                  timestamp: new Date(),
                }]);
              }}
              onError={(msg) => {
                setMessages(prev => [...prev, {
                  id: `error-${Date.now()}`,
                  role: 'assistant',
                  content: `Payment issue: ${msg}`,
                  timestamp: new Date(),
                }]);
              }}
            />
          </div>
        </div>
      )}
      <ChatHeader onClose={onClose} />

      {isDev && currentState && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-4 py-2 text-xs font-mono border-b overflow-x-auto whitespace-nowrap">
          <span className="font-bold">DEBUG V1:</span>
          {" "}nextStep={currentState.currentStep}
          {" | "}classFor={currentState.classFor || "null"}
          {" | "}childAge={currentState.childAge || "null"}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <MessageList messages={messages} isProcessing={isProcessing} />

        {!isProcessing && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-start pt-1">
            {quickReplies.map((reply, index) => (
              <Button key={index} variant="outline" size="sm" onClick={() => handleQuickReply(reply)} className="text-sm">
                {reply}
              </Button>
            ))}
          </div>
        )}

        {!isProcessing && availableSlots.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Select a time slot:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableSlots.slice(0, 6).map((slot, index) => (
                <Card key={index} className="p-3 cursor-pointer hover:bg-accent transition-colors" onClick={() => handleSlotSelect(slot)}>
                  <div className="text-sm font-medium">{slot.day}</div>
                  <div className="text-xs text-muted-foreground">{slot.displayText}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isProcessing && membershipPlans.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Choose your membership plan:</p>
            <div className="grid grid-cols-1 gap-3">
              {membershipPlans.map((plan) => (
                <Card key={plan.id} className="p-4 cursor-pointer hover:bg-accent transition-colors" onClick={() => handlePlanSelect(plan)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-lg font-bold">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">Month-to-month</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <div className="text-xl font-bold">${plan.monthlyPrice}/mo</div>
                        <Tooltip open={openTooltipId === plan.id} onOpenChange={(open) => setOpenTooltipId(open ? plan.id : null)}>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                              onClick={(e) => { e.stopPropagation(); setOpenTooltipId(openTooltipId === plan.id ? null : plan.id); }}
                              onTouchStart={(e) => { e.stopPropagation(); }}
                              aria-label="View payment breakdown">
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[250px] z-50" onPointerDownOutside={() => setOpenTooltipId(null)}>
                            <div className="space-y-1">
                              <div className="font-semibold">Payment Breakdown</div>
                              <div className="text-xs space-y-0.5">
                                <div>First payment: ${(Number(plan.monthlyPrice) + 99).toFixed(2)}</div>
                                <div className="text-muted-foreground">• Monthly: ${Number(plan.monthlyPrice).toFixed(2)}</div>
                                <div className="text-muted-foreground">• Down payment: $99.00</div>
                                <div className="mt-1 pt-1 border-t border-muted-foreground/20">Then ${Number(plan.monthlyPrice).toFixed(2)}/mo thereafter</div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-xs text-muted-foreground">+ $99 down payment</div>
                    </div>
                  </div>
                  {plan.description && <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>}
                  {plan.benefits && plan.benefits.length > 0 && (
                    <ul className="text-xs space-y-1">
                      {plan.benefits.slice(0, 3).map((benefit: string, idx: number) => (
                        <li key={idx} className="flex items-start"><span className="mr-1">✓</span><span>{benefit}</span></li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-card flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isProcessing} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Feature-Flag Router ───────────────────────────────────────────────────

export function IntakeChatbot({ onClose }: IntakeChatbotProps) {
  if (USE_TRIAL_FIRST_V2) {
    return <IntakeChatbotV2 onClose={onClose} />;
  }
  return <IntakeChatbotV1 onClose={onClose} />;
}
