import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { X, ArrowLeft, Send, MessageSquare, Mic } from "lucide-react";
import { toast } from "sonner";

type Step = 
  | "mode_selection"
  | "name" 
  | "phone" 
  | "email" 
  | "program"
  | "preferred_days"
  | "schedule"
  | "intro_1"  // For kids: first intro booking
  | "intro_2"  // For kids: second intro booking
  | "confirmation"
  | "complete";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  program: string;
  preferredDays: "weekdays" | "weekends" | "either" | "";
  selectedClassTime?: string;
  intro1Time?: string;
  intro2Time?: string;
  leadId?: number; // Store lead ID after initial save
}

// Program button options
const PROGRAM_OPTIONS = [
  { label: "Kids 3–5", value: "Little Ninjas" },
  { label: "Kids 6–12", value: "Dragon Kids" },
  { label: "Teens", value: "Teens" },
  { label: "Adult Karate", value: "Adult Karate" },
  { label: "Kickboxing", value: "Kickboxing" },
  { label: "Summer Camp", value: "Summer Camp" },
  { label: "After-School", value: "After School" },
  { label: "Not sure", value: "Not Sure" },
];

// Helper: Check if program requires intro orientations
function requiresIntro(program: string): boolean {
  return program === "Little Ninjas" || program === "Dragon Kids";
}

// Helper: Validate phone number
function isValidPhone(phone: string): { valid: boolean; message?: string } {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { valid: false, message: "Please provide a valid 10-digit phone number." };
  }
  
  // Detect fake patterns
  const fakePatterns = [
    /^1?234567890$/,
    /^1?555555555$/,
    /^1?000000000$/,
    /^1?111111111$/,
    /^1?999999999$/,
    /^1?(\d)\1{9}$/,
  ];
  
  for (const pattern of fakePatterns) {
    if (pattern.test(digitsOnly)) {
      return { valid: false, message: "Please provide your real phone number so we can confirm your appointment." };
    }
  }
  
  return { valid: true };
}

// Helper: Validate email
function isValidEmail(email: string): { valid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: "Please provide a valid email address." };
  }
  return { valid: true };
}

export function TrialChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("mode_selection");
  const [interactionMode, setInteractionMode] = useState<"text" | "voice" | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    program: "",
    preferredDays: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tempNameRef = useRef<string>("");
  const tempPhoneRef = useRef<string>("");

  const createLeadMutation = trpc.trialSignups.create.useMutation();
  const updateLeadMutation = trpc.trialSignups.update.useMutation();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && interactionMode === "text") {
      inputRef.current?.focus();
    }
  }, [isOpen, interactionMode]);

  // Show greeting when mode is selected
  useEffect(() => {
    if (isOpen && step === "name" && messages.length === 0) {
      addBotMessage("Hi! I'm here to help you book a trial class. What's your first name?");
    }
  }, [isOpen, step]);

  // Add bot message with typing indicator
  const addBotMessage = async (content: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "bot",
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  };

  // Add user message
  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Handle text input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input.trim();
    setInput("");
    addUserMessage(userInput);
    
    await handleInput(userInput);
  };

  // Main conversation logic
  const handleInput = async (userInput: string) => {
    switch (step) {
      case "name":
        // Validate name (minimum 2 characters)
        if (userInput.length < 2) {
          await addBotMessage("Could you tell me your first name?");
          return;
        }
        
        // Store name immediately in ref for lead creation
        tempNameRef.current = userInput;
        setFormData(prev => ({ ...prev, name: userInput }));
        await addBotMessage(`Great to meet you, ${userInput}!`);
        await addBotMessage("What's the best phone number to reach you?");
        setStep("phone");
        break;

      case "phone":
        // Validate phone
        const phoneValidation = isValidPhone(userInput);
        if (!phoneValidation.valid) {
          await addBotMessage(phoneValidation.message!);
          return;
        }
        
        // **SAVE LEAD IMMEDIATELY** using ref values
        tempPhoneRef.current = userInput;
        
        setFormData(prev => ({ ...prev, phone: userInput }));
        
        try {
          const lead = await createLeadMutation.mutateAsync({
            name: tempNameRef.current,
            phone: tempPhoneRef.current,
            email: "", // Empty for now
            program: "Not Sure" as any,
            location: "Tomball HQ",
            source: "chatbot",
            preferredContactMethod: "text",
            message: "Lead captured via chatbot - in progress",
          });
          
          setFormData(prev => ({ ...prev, leadId: lead.id }));
          
          await addBotMessage("Perfect! Got it.");
          await addBotMessage("Can I get your email? (or type 'skip' if you prefer not to share)");
          setStep("email");
        } catch (error) {
          console.error("Failed to save lead:", error);
          toast.error("Something went wrong. Please try again.");
        }
        break;

      case "email":
        // Check if user wants to skip
        if (userInput.toLowerCase() === "skip") {
          await addBotMessage("No problem!");
          setStep("program");
          await showProgramButtons();
          return;
        }
        
        // Validate email
        const emailValidation = isValidEmail(userInput);
        if (!emailValidation.valid) {
          await addBotMessage(emailValidation.message!);
          return;
        }
        
        setFormData(prev => ({ ...prev, email: userInput }));
        
        // Update lead with email
        if (formData.leadId) {
          try {
            await updateLeadMutation.mutateAsync({
              id: formData.leadId,
              email: userInput,
            });
          } catch (error) {
            console.error("Failed to update lead with email:", error);
          }
        }
        
        await addBotMessage("Great!");
        setStep("program");
        await showProgramButtons();
        break;

      case "program":
        // This will be handled by button clicks, not text input
        await addBotMessage("Please select a program from the buttons above.");
        break;

      case "preferred_days":
        // This will be handled by button clicks
        await addBotMessage("Please select your preferred days from the buttons above.");
        break;

      default:
        await addBotMessage("I'm not sure how to help with that. Let me connect you with our team.");
        break;
    }
  };

  // Show program selection buttons
  const showProgramButtons = async () => {
    await addBotMessage("Who are we booking for?");
    // Buttons will be rendered in the UI
  };

  // Handle program button click
  const handleProgramSelect = async (program: string) => {
    addUserMessage(program);
    setFormData(prev => ({ ...prev, program }));
    
    // Update lead with program
    if (formData.leadId) {
      try {
        await updateLeadMutation.mutateAsync({
          id: formData.leadId,
          program: program as any,
        });
      } catch (error) {
        console.error("Failed to update lead with program:", error);
      }
    }
    
    if (requiresIntro(program)) {
      await addBotMessage(`Great choice! For ${program}, we require two intro orientation classes (Mon–Thu at 5:30 PM).`);
      await addBotMessage("Which day works for the first intro?");
      setStep("intro_1");
      // Show intro time slots
    } else {
      await addBotMessage("Perfect!");
      await addBotMessage("What days work best for you?");
      setStep("preferred_days");
      // Show preferred days buttons
    }
  };

  // Handle preferred days button click
  const handlePreferredDaysSelect = async (days: "weekdays" | "weekends" | "either") => {
    const daysLabel = days === "weekdays" ? "Weekdays" : days === "weekends" ? "Weekends" : "Either";
    addUserMessage(daysLabel);
    setFormData(prev => ({ ...prev, preferredDays: days }));
    
    await addBotMessage("Great! Let me show you available times...");
    setStep("schedule");
    // Fetch and show schedule
  };

  // Toggle chat open/close
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openTrialChatbot', handleOpenChat);
    return () => window.removeEventListener('openTrialChatbot', handleOpenChat);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-50"
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-0 bg-white shadow-2xl flex flex-col h-screen w-screen overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden hover:bg-white/10 rounded-full p-1 transition-colors"
            aria-label="Close chat"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-bold">Book Your Trial Class</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="hidden md:block hover:bg-white/10 rounded-full p-2 transition-colors"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selection */}
        {step === "mode_selection" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">How would you like to chat?</h3>
                <p className="text-gray-600">Choose your preferred way to communicate</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setInteractionMode("text");
                    setStep("name");
                  }}
                  className="group relative overflow-hidden bg-white hover:bg-primary transition-all duration-300 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-primary w-full"
                >
                  <div className="flex items-center gap-4">
                    <MessageSquare className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                    <div className="text-left">
                      <h4 className="font-bold text-lg group-hover:text-white transition-colors">Text Chat</h4>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">Type your responses</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setInteractionMode("voice");
                    setStep("name");
                  }}
                  className="group relative overflow-hidden bg-white hover:bg-primary transition-all duration-300 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-primary w-full"
                >
                  <div className="flex items-center gap-4">
                    <Mic className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                    <div className="text-left">
                      <h4 className="font-bold text-lg group-hover:text-white transition-colors">Voice Chat</h4>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">Speak your responses</p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-gray-500">You can switch modes anytime during the conversation</p>
            </div>
          </div>
        )}

        {/* Text Mode UI */}
        {step !== "mode_selection" && interactionMode === "text" && (
          <>
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-white text-gray-900 shadow-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 shadow-sm rounded-2xl px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Program buttons */}
              {step === "program" && !isTyping && (
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {PROGRAM_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => handleProgramSelect(option.value)}
                      variant="outline"
                      className="h-auto py-3 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Preferred days buttons */}
              {step === "preferred_days" && !isTyping && (
                <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
                  <Button
                    onClick={() => handlePreferredDaysSelect("weekdays")}
                    variant="outline"
                    className="h-auto py-4 text-base font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    Weekdays
                  </Button>
                  <Button
                    onClick={() => handlePreferredDaysSelect("weekends")}
                    variant="outline"
                    className="h-auto py-4 text-base font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    Weekends
                  </Button>
                  <Button
                    onClick={() => handlePreferredDaysSelect("either")}
                    variant="outline"
                    className="h-auto py-4 text-base font-medium hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  >
                    Either
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isTyping || step === "program" || step === "preferred_days"}
                />
                <Button type="submit" disabled={!input.trim() || isTyping}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Voice Mode UI - Placeholder */}
        {step !== "mode_selection" && interactionMode === "voice" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
            <div className="text-center">
              <p className="text-gray-600">Voice mode coming soon...</p>
              <Button
                onClick={() => {
                  setInteractionMode("text");
                  setMessages([]);
                }}
                className="mt-4"
              >
                Switch to Text Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
