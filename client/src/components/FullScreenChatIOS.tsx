import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sent" | "delivered" | "read";
}

interface FullScreenChatIOSProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

type ConversationStep =
  | "greeting"
  | "segment"
  | "goal"
  | "introExplanation"
  | "showIntroTimes"
  | "bookIntro1"
  | "bookIntro2"
  | "preferredDays"
  | "showTimes"
  | "collectName"
  | "collectPhone"
  | "confirm";

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

// Kai Avatar component
function KaiAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  return (
    <div
      className={`${dim} rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden`}
    >
      <img
        src="/images/logo-icon-white.99cb4daa.webp"
        alt="Kai"
        className="w-full h-full object-contain p-1"
        onError={(e) => {
          // Fallback to text if image fails
          const target = e.currentTarget;
          target.style.display = "none";
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML =
              '<span class="text-white text-xs font-bold">K</span>';
          }
        }}
      />
    </div>
  );
}

// Typing dots with Kai avatar
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <KaiAvatar size="sm" />
      <div className="bg-gray-100 rounded-[18px] px-5 py-3 flex items-center gap-1">
        <div
          className="w-2 h-2 bg-gray-400 rounded-full"
          style={{ animation: "bounce 1.4s infinite ease-in-out", animationDelay: "0s" }}
        />
        <div
          className="w-2 h-2 bg-gray-400 rounded-full"
          style={{ animation: "bounce 1.4s infinite ease-in-out", animationDelay: "0.2s" }}
        />
        <div
          className="w-2 h-2 bg-gray-400 rounded-full"
          style={{ animation: "bounce 1.4s infinite ease-in-out", animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
}

// Individual message row with swipe-to-reveal timestamp
function MessageRow({
  message,
  showStatus,
  prevMessage,
}: {
  message: Message;
  showStatus: boolean;
  prevMessage?: Message;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const isUser = message.role === "user";

  // Show timestamp header if gap > 5 minutes from previous message
  const showTimeHeader =
    !prevMessage ||
    message.timestamp.getTime() - prevMessage.timestamp.getTime() > 5 * 60 * 1000;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientX - startXRef.current;
      // Allow dragging left (negative) up to -80px to reveal timestamp
      setDragX(Math.max(-80, Math.min(0, delta)));
    },
    [isDragging]
  );

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    // Snap back after 1.5s if dragged far enough
    if (dragX < -30) {
      setTimeout(() => setDragX(0), 1500);
    } else {
      setDragX(0);
    }
  }, [dragX]);

  // Mouse drag support for desktop testing
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - startXRef.current;
      setDragX(Math.max(-80, Math.min(0, delta)));
    },
    [isDragging]
  );

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
      {/* Time header between message groups */}
      {showTimeHeader && (
        <div className="flex justify-center my-2">
          <span className="text-[11px] text-gray-400 font-medium">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      )}

      {/* Message row with swipe gesture */}
      <div
        className={`flex items-end gap-2 relative overflow-hidden select-none ${
          isUser ? "justify-end" : "justify-start"
        }`}
        style={{
          animation: "fadeIn 0.3s ease-out",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Timestamp revealed on swipe (positioned absolutely on the right) */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-medium whitespace-nowrap pointer-events-none transition-opacity duration-200"
          style={{
            opacity: dragX < -20 ? 1 : 0,
            transform: `translateX(${80 + dragX}px) translateY(-50%)`,
          }}
        >
          {formatTimestamp(message.timestamp)}
        </div>

        {/* Kai avatar (left side, only for assistant) */}
        {!isUser && <KaiAvatar size="sm" />}

        {/* Bubble */}
        <div
          className="flex flex-col"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            maxWidth: "75%",
          }}
        >
          <div
            className={`rounded-[18px] px-4 py-2.5 ${
              isUser
                ? "bg-red-600 text-white self-end"
                : "bg-gray-100 text-gray-900 self-start"
            }`}
          >
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>

          {/* Delivered / Read receipt — only on last user message */}
          {isUser && showStatus && message.status && (
            <div className="text-[11px] text-gray-400 mt-0.5 text-right flex items-center justify-end gap-1">
              {message.status === "sent" && (
                <>
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Sent</span>
                </>
              )}
              {message.status === "delivered" && (
                <>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4L18 6M8 12l4 4L22 6" />
                  </svg>
                  <span>Delivered</span>
                </>
              )}
              {message.status === "read" && (
                <>
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4L18 6M8 12l4 4L22 6" />
                  </svg>
                  <span className="text-red-500">Read</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Spacer on right for assistant messages */}
        {!isUser && <div className="w-7 flex-shrink-0" />}
      </div>
    </div>
  );
}

export function FullScreenChatIOS({
  isOpen,
  onClose,
  conversationId,
}: FullScreenChatIOSProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<ConversationStep>("greeting");
  const [userData, setUserData] = useState<{
    segment?: string;
    goal?: string;
    preferredDays?: string;
    selectedTime?: string;
    intro1Time?: string;
    intro2Time?: string;
    requiresIntro?: boolean;
    name?: string;
    phone?: string;
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createLeadMutation = trpc.trialSignups.create.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addAssistantMessage(
          "Hey there! 👋 Ready to start your martial arts journey? I can help you book a FREE trial class at MyDojo!"
        );
        setStep("segment");
      }, 300);
    }
  }, [isOpen]);

  const addAssistantMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content,
          timestamp: new Date(),
        },
      ]);
    }, 800);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      status: "sent",
    };
    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        )
      );
    }, 1200);
  };

  const requiresIntro = (segment: string): boolean =>
    segment === "kids-3-5" || segment === "kids-6-12";

  const handleQuickReply = (value: string, label: string) => {
    addUserMessage(label);

    switch (step) {
      case "segment": {
        const needsIntro = requiresIntro(value);
        setUserData((prev) => ({ ...prev, segment: value, requiresIntro: needsIntro }));
        setTimeout(() => {
          addAssistantMessage("Awesome! What's the main goal?");
          setStep("goal");
        }, 1200);
        break;
      }
      case "goal": {
        setUserData((prev) => ({ ...prev, goal: value }));
        if (userData.requiresIntro) {
          setTimeout(() => {
            addAssistantMessage(
              "Perfect! 🥋\n\nFor kids programs, we require 2 intro orientation classes before regular classes. These help your child get comfortable with our dojo and instructors.\n\nIntro classes are Monday-Thursday at 5:00 PM. Let's book your first intro!"
            );
            setStep("showIntroTimes");
          }, 1200);
        } else {
          setTimeout(() => {
            addAssistantMessage("Perfect! What days work best?");
            setStep("preferredDays");
          }, 1200);
        }
        break;
      }
      case "preferredDays": {
        setUserData((prev) => ({ ...prev, preferredDays: value }));
        setTimeout(() => {
          addAssistantMessage("Great! Here are some available times for your free trial:");
          setStep("showTimes");
        }, 1200);
        break;
      }
      case "showIntroTimes": {
        setUserData((prev) => ({ ...prev, intro1Time: value }));
        setTimeout(() => {
          addAssistantMessage(
            `Great! Intro #1 booked for ${label}. 🎉\n\nNow let's book Intro #2. Pick another day:`
          );
          setStep("bookIntro2");
        }, 1200);
        break;
      }
      case "bookIntro2": {
        setUserData((prev) => ({ ...prev, intro2Time: value }));
        setTimeout(() => {
          addAssistantMessage("Perfect! What's your child's name?");
          setStep("collectName");
        }, 1200);
        break;
      }
      case "showTimes": {
        setUserData((prev) => ({ ...prev, selectedTime: value }));
        setTimeout(() => {
          addAssistantMessage("Perfect! What's your name?");
          setStep("collectName");
        }, 1200);
        break;
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const message = inputValue.trim();
    addUserMessage(message);
    setInputValue("");

    if (step === "collectName") {
      setUserData((prev) => ({ ...prev, name: message }));
      setTimeout(() => {
        addAssistantMessage(
          "Great! What's the best phone number to reach you? We'll use this to confirm your trial class."
        );
        setStep("collectPhone");
      }, 1200);
    } else if (step === "collectPhone") {
      setUserData((prev) => ({ ...prev, phone: message }));
      try {
        await createLeadMutation.mutateAsync({
          name: userData.name || "Guest",
          phone: message,
          email: undefined,
          program: "Not Sure" as any,
          location: "HQ",
          preferredContactMethod: "phone",
          goal: userData.goal as any,
          preferredDays: userData.preferredDays as any,
          introCountRequired: userData.requiresIntro ? 2 : 0,
          introCountBooked: userData.requiresIntro ? 2 : 0,
          source: "chatbot" as const,
        });

        setTimeout(() => {
          if (userData.requiresIntro) {
            addAssistantMessage(
              `Awesome, ${userData.name}! 🎉 Your 2 intro orientation classes are booked:\n\n• Intro #1: ${userData.intro1Time}\n• Intro #2: ${userData.intro2Time}\n\nWhat to bring:\n• Comfortable athletic clothes\n• Water bottle\n• Arrive 10 minutes early\n\nAfter completing both intros, you'll be eligible for regular classes. We'll send you a confirmation text shortly. See you on the mat!`
            );
          } else {
            addAssistantMessage(
              `Awesome, ${userData.name}! 🎉 Your FREE trial class is booked for ${userData.selectedTime}!\n\nWhat to bring:\n• Comfortable athletic clothes\n• Water bottle\n• Arrive 10 minutes early\n\nWe'll send you a confirmation text shortly. See you on the mat!`
            );
          }
          setStep("confirm");
        }, 1200);
      } catch {
        setTimeout(() => {
          addAssistantMessage(
            "Oops! Something went wrong. Let me connect you with our team to finish booking."
          );
        }, 1200);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const segmentOptions = [
    { value: "kids-3-5", label: "Kids (3-5)" },
    { value: "kids-6-12", label: "Kids (6-12)" },
    { value: "teens", label: "Teens" },
    { value: "adults", label: "Adult Karate" },
    { value: "not-sure", label: "Not sure" },
  ];

  const goalOptions = [
    { value: "confidence", label: "Build Confidence" },
    { value: "discipline", label: "Learn Discipline" },
    { value: "fitness", label: "Get Fit" },
    { value: "self-defense", label: "Self-Defense" },
    { value: "bullying", label: "Bullying Help" },
    { value: "weight-loss", label: "Weight Loss" },
  ];

  const dayOptions = [
    { value: "weekdays", label: "Weekdays" },
    { value: "weekends", label: "Weekends" },
    { value: "either", label: "Either works" },
  ];

  const introTimes = [
    { value: "mon-5:00pm", label: "Monday 5:00 PM" },
    { value: "tue-5:00pm", label: "Tuesday 5:00 PM" },
    { value: "wed-5:00pm", label: "Wednesday 5:00 PM" },
    { value: "thu-5:00pm", label: "Thursday 5:00 PM" },
  ];

  const mockTimes = [
    { value: "mon-5pm", label: "Monday 5:00 PM" },
    { value: "wed-6pm", label: "Wednesday 6:00 PM" },
    { value: "fri-5:00pm", label: "Friday 5:00 PM" },
    { value: "sat-10am", label: "Saturday 10:00 AM" },
  ];

  // Index of last user message (for showing status only on the latest)
  const lastUserMsgIndex = messages.reduce(
    (acc, msg, i) => (msg.role === "user" ? i : acc),
    -1
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-white md:bg-black/20 md:backdrop-blur-sm flex items-center justify-center"
      style={{
        animation: isOpen ? "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Chat Container */}
      <div className="w-full h-full md:w-[480px] md:h-[700px] md:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* ── BLACK BRANDED HEADER ── */}
        <div className="sticky top-0 z-10 bg-black flex flex-col">
          {/* Top row: back + title + status pill */}
          <div className="h-14 px-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Center: logo + name */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
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

            <div className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold tracking-wide">
              HQ
            </div>
          </div>

          {/* Thin red accent line */}
          <div className="h-0.5 bg-red-600" />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-white">
          {messages.map((message, index) => (
            <MessageRow
              key={message.id}
              message={message}
              showStatus={index === lastUserMsgIndex}
              prevMessage={index > 0 ? messages[index - 1] : undefined}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}

          {/* Quick Reply Buttons */}
          {!isTyping && (
            <div className="pt-2">
              {step === "segment" && (
                <div className="flex flex-wrap gap-2">
                  {segmentOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleQuickReply(option.value, option.label)}
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {step === "goal" && (
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleQuickReply(option.value, option.label)}
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {step === "preferredDays" && (
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleQuickReply(option.value, option.label)}
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {step === "showIntroTimes" && (
                <div className="flex flex-wrap gap-2">
                  {introTimes.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleQuickReply(option.value, option.label)}
                      className="px-4 py-2 rounded-full border border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 hover:border-red-400 transition-all"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {step === "bookIntro2" && (
                <div className="flex flex-wrap gap-2">
                  {introTimes
                    .filter((t) => t.value !== userData.intro1Time)
                    .map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleQuickReply(option.value, option.label)}
                        className="px-4 py-2 rounded-full border border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 hover:border-red-400 transition-all"
                      >
                        {option.label}
                      </button>
                    ))}
                </div>
              )}
              {step === "showTimes" && (
                <div className="flex flex-wrap gap-2">
                  {mockTimes.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleQuickReply(option.value, option.label)}
                      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer Bar */}
        {(step === "collectName" || step === "collectPhone") && (
          <div className="sticky bottom-0 z-10 p-4 bg-white border-t border-gray-200/50">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-[22px] px-4 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    step === "collectName" ? "Enter name..." : "Enter phone number..."
                  }
                  className="flex-1 bg-transparent outline-none text-[15px] text-gray-900 placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
