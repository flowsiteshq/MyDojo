import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { X, Send, Calendar, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

// MyDojo Booking Flow v2 - Streamlined 6-7 step booking process
type Step = 
  | "greeting"           // Step 1: Who is this for?
  | "goal"               // Step 2: What's the main goal?
  | "preferred_days"     // Step 3: Preferred days?
  | "show_times"         // Step 4: Show available times
  | "collect_name"       // Step 5a: Get name if missing
  | "collect_phone"      // Step 5b: Get phone
  | "confirmation";      // Step 6-7: Booking confirmed + next steps

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  buttons?: ButtonOption[];
  timeSlots?: TimeSlot[];
}

interface ButtonOption {
  label: string;
  value: string;
  emoji?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  date: string;
  display: string;
}

interface FormData {
  name?: string;
  phone?: string;
  email?: string;
  segment?: string;      // Kids 3-5, Kids 6-12, Teens, Adults, Not sure
  goal?: string;         // Confidence, Discipline, Fitness, etc.
  preferredDays?: string; // Weekdays, Weekends, Either
  selectedTime?: TimeSlot;
  location: string;
}

export function TrialChatbotV2({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState<FormData>({
    location: "Tomball HQ",
  });
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const submitLead = trpc.trialSignups.create.useMutation({
    onSuccess: () => {
      addBotMessage(
        "🎉 You're all set! Check your phone for a confirmation text. See you soon!",
        [],
        "confirmation"
      );
    },
    onError: (error) => {
      toast.error("Booking failed. Let me connect you with our team.");
      addBotMessage(
        "Oops! Something went wrong. I'll have our team call you at " + formData.phone + " to finish booking. Sound good?",
        [
          { label: "Yes, call me", value: "yes" },
          { label: "Try again", value: "retry" }
        ]
      );
    },
  });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      addBotMessage(
        "Hey there! 👋 Ready to start your martial arts journey? I can help you sign up for a FREE trial class at MyDojo!",
        []
      );
      setTimeout(() => {
        addBotMessage(
          "Who is this for?",
          [
            { label: "Kids (3-5)", value: "Kids 3-5", emoji: "👶" },
            { label: "Kids (6-12)", value: "Kids 6-12", emoji: "🧒" },
            { label: "Teens", value: "Teens", emoji: "🧑" },
            { label: "Adult Karate", value: "Adult Karate", emoji: "💪" },
            { label: "Not sure", value: "Not sure", emoji: "🤔" }
          ],
          "greeting"
        );
      }, 800);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBotMessage = (content: string, buttons: ButtonOption[] = [], nextStep?: Step, timeSlots?: TimeSlot[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "bot",
      content,
      timestamp: new Date(),
      buttons,
      timeSlots,
    };
    setMessages(prev => [...prev, newMessage]);
    if (nextStep) {
      setStep(nextStep);
    }
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleButtonClick = (value: string, label: string) => {
    addUserMessage(label);

    switch (step) {
      case "greeting":
        // Step 1 complete: segment selected
        setFormData(prev => ({ ...prev, segment: value }));
        setTimeout(() => {
          addBotMessage(
            "Awesome! What's the main goal?",
            [
              { label: "Build Confidence", value: "Confidence", emoji: "💪" },
              { label: "Improve Discipline", value: "Discipline", emoji: "🎯" },
              { label: "Get Fit", value: "Fitness", emoji: "🏃" },
              { label: "Learn Self-Defense", value: "Self-defense", emoji: "🥋" },
              { label: "Stop Bullying", value: "Bullying help", emoji: "🛡️" },
              { label: "Lose Weight", value: "Weight loss", emoji: "⚖️" }
            ],
            "goal"
          );
        }, 600);
        break;

      case "goal":
        // Step 2 complete: goal selected
        setFormData(prev => ({ ...prev, goal: value }));
        setTimeout(() => {
          addBotMessage(
            "Perfect! When works best for you?",
            [
              { label: "Weekdays", value: "Weekdays", emoji: "📅" },
              { label: "Weekends", value: "Weekends", emoji: "🎉" },
              { label: "Either works", value: "Either", emoji: "✅" }
            ],
            "preferred_days"
          );
        }, 600);
        break;

      case "preferred_days":
        // Step 3 complete: preferred days selected
        setFormData(prev => ({ ...prev, preferredDays: value }));
        setTimeout(() => {
          // TODO: Fetch real availability from DojoFlow
          // For now, show mock available times
          const mockTimes: TimeSlot[] = [
            { id: "1", time: "5:00 PM", date: "Mon, Feb 17", display: "Mon, Feb 17 at 5:00 PM" },
            { id: "2", time: "6:00 PM", date: "Tue, Feb 18", display: "Tue, Feb 18 at 6:00 PM" },
            { id: "3", time: "5:30 PM", date: "Wed, Feb 19", display: "Wed, Feb 19 at 5:30 PM" },
            { id: "4", time: "4:00 PM", date: "Sat, Feb 22", display: "Sat, Feb 22 at 4:00 PM" },
          ];
          
          addBotMessage(
            "Great! Here are the next available intro classes:",
            [
              ...mockTimes.map(slot => ({ label: slot.display, value: slot.id })),
              { label: "See more times", value: "more" }
            ],
            "show_times",
            mockTimes
          );
        }, 600);
        break;

      case "show_times":
        if (value === "more") {
          toast.info("More times coming soon! For now, pick from the available options or we can call you.");
          return;
        }
        // Find the selected time slot
        const selectedSlot = messages[messages.length - 1].timeSlots?.find(slot => slot.id === value);
        if (selectedSlot) {
          setFormData(prev => ({ ...prev, selectedTime: selectedSlot }));
          
          // Check if we have name
          if (!formData.name) {
            setTimeout(() => {
              addBotMessage(
                "Perfect! What's your first name?",
                [],
                "collect_name"
              );
            }, 600);
          } else {
            // Already have name, go to phone
            setTimeout(() => {
              addBotMessage(
                `Got it, ${formData.name}! What's the best phone number to confirm your trial class?`,
                [],
                "collect_phone"
              );
            }, 600);
          }
        }
        break;

      default:
        break;
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    const value = inputValue.trim();
    setInputValue("");

    switch (step) {
      case "collect_name":
        setFormData(prev => ({ ...prev, name: value }));
        setTimeout(() => {
          addBotMessage(
            `Nice to meet you, ${value}! What's the best phone number to confirm your trial class?`,
            [],
            "collect_phone"
          );
        }, 600);
        break;

      case "collect_phone":
        setFormData(prev => ({ ...prev, phone: value }));
        
        // Book the appointment
        setTimeout(() => {
          addBotMessage("Booking your spot... ⏳");
          
          // Submit to backend
          submitLead.mutate({
            name: formData.name!,
            phone: value,
            email: formData.email,
            program: formData.segment === "Kids 3-5" ? "Little Ninjas" : 
                     formData.segment === "Kids 6-12" ? "Dragon Kids" :
                     formData.segment === "Teens" ? "Teens" : "Adult Karate",
            segment: formData.segment as any,
            goal: formData.goal as any,
            preferredDays: formData.preferredDays as any,
            scheduledTime: formData.selectedTime ? new Date(formData.selectedTime.date + ' ' + formData.selectedTime.time) : undefined,
            location: formData.location,
            preferredContactMethod: "phone",
            message: `Booked for: ${formData.selectedTime?.display}. Goal: ${formData.goal}`,
          });
        }, 600);
        break;

      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/mydojo-icon.png" alt="MyDojo" className="w-10 h-10 rounded-full" />
            <div>
              <h3 className="font-bold">MYDOJO ASSISTANT</h3>
              <p className="text-xs text-gray-300">Start Your Free Trial</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-black"} rounded-2xl p-3`}>
                <p className="text-sm">{message.content}</p>
                
                {/* Buttons */}
                {message.buttons && message.buttons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.buttons.map((button, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleButtonClick(button.value, button.label)}
                        className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                      >
                        {button.emoji && <span className="mr-2">{button.emoji}</span>}
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(step === "collect_name" || step === "collect_phone") && (
          <form onSubmit={handleTextSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={step === "collect_name" ? "Your name..." : "Your phone number..."}
                className="flex-1"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Confirmation Actions */}
        {step === "confirmation" && (
          <div className="p-4 border-t border-gray-200 space-y-2">
            <Button className="w-full bg-black hover:bg-black/90 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="outline" className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            <Button variant="outline" className="w-full">
              <Phone className="w-4 h-4 mr-2" />
              Talk to Staff
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
