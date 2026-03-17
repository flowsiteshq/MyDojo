import { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, Send, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface Message {
  id?: number;
  content: string;
  direction: "inbound" | "outbound";
  status?: "queued" | "sent" | "delivered" | "read";
  timestamp: Date;
  buttons?: Array<{ label: string; value: string }>;
}

interface FullScreenChatProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export function FullScreenChat({ isOpen, onClose, conversationId }: FullScreenChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hey there! 👋 Ready to start your martial arts journey? I can help you sign up for a FREE trial class at MyDojo!",
      direction: "outbound",
      status: "delivered",
      timestamp: new Date(),
    },
    {
      content: "Who is this for?",
      direction: "outbound",
      status: "delivered",
      timestamp: new Date(),
      buttons: [
        { label: "👶 Kids (3-5)", value: "Kids 3-5" },
        { label: "🧒 Kids (6-12)", value: "Kids 6-12" },
        { label: "🧑 Teens", value: "Teens" },
        { label: "💪 Adult Karate", value: "Adult Karate" },
        { label: "🤔 Not sure", value: "Not sure" },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveMessageMutation = trpc.chat.saveMessage.useMutation();
  const markDeliveredMutation = trpc.chat.markDelivered.useMutation();
  const markReadMutation = trpc.chat.markRead.useMutation();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is in focus
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id && lastMessage.direction === "outbound") {
        markReadMutation.mutate({
          conversationId,
          upToMessageId: lastMessage.id,
        });
      }
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      content: inputValue,
      direction: "inbound",
      status: "delivered",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Save user message
    await saveMessageMutation.mutateAsync({
      conversationId,
      direction: "inbound",
      content: inputValue,
      channel: "web",
    });

    // Simulate assistant response (replace with actual chatbot logic)
    setTimeout(async () => {
      const assistantMessage: Message = {
        content: "Thanks! I'll help you with that.",
        direction: "outbound",
        status: "sent",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

      // Save assistant message
      const result = await saveMessageMutation.mutateAsync({
        conversationId,
        direction: "outbound",
        content: assistantMessage.content,
        channel: "web",
      });

      // Mark as delivered after rendering
      if (result.messageId) {
        setTimeout(() => {
          markDeliveredMutation.mutate({ messageId: result.messageId! });
        }, 100);
      }
    }, 1500);
  };

  const handleButtonClick = async (value: string, label: string) => {
    const userMessage: Message = {
      content: label,
      direction: "inbound",
      status: "delivered",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Save user message
    await saveMessageMutation.mutateAsync({
      conversationId,
      direction: "inbound",
      content: label,
      channel: "web",
    });

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        content: "Great choice! What's your main goal?",
        direction: "outbound",
        status: "sent",
        timestamp: new Date(),
        buttons: [
          { label: "💪 Build Confidence", value: "Confidence" },
          { label: "🎯 Improve Discipline", value: "Discipline" },
          { label: "🏃 Get Fit", value: "Fitness" },
          { label: "🥋 Learn Self-Defense", value: "Self-defense" },
          { label: "🛡️ Stop Bullying", value: "Bullying help" },
          { label: "⚖️ Lose Weight", value: "Weight loss" },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const containerClass = isMobile
    ? "fixed inset-0 z-50 bg-white flex flex-col"
    : "fixed bottom-4 right-4 w-[400px] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50";

  return (
    <div className={containerClass}>
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-white">
        <button onClick={onClose} className="p-1 hover:bg-primary/80 rounded">
          {isMobile ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
        <h2 className="font-bold text-lg">MyDojo Assistant</h2>
        <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
          <MapPin className="h-3 w-3" />
          <span>Tomball</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.direction === "inbound" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] ${message.direction === "inbound" ? "order-2" : "order-1"}`}>
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.direction === "inbound"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>

              {/* Button Options */}
              {message.buttons && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.buttons.map((button, btnIndex) => (
                    <Button
                      key={btnIndex}
                      variant="outline"
                      size="sm"
                      onClick={() => handleButtonClick(button.value, button.label)}
                      className="text-xs"
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Message Status (only for last outbound message) */}
              {message.direction === "outbound" &&
                index === messages.length - 1 &&
                message.status && (
                  <p className="text-xs text-gray-400 mt-1">
                    {message.status === "sent" && "Sent"}
                    {message.status === "delivered" && "Delivered"}
                    {message.status === "read" && "Read"}
                  </p>
                )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer */}
      <div className="border-t p-4 bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="rounded-full h-10 w-10 p-0"
          >
            {saveMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
