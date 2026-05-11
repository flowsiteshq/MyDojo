import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { X, ArrowLeft, Send, Check, CheckCheck, Mic, MessageSquare, Keyboard, Square } from "lucide-react";
import { toast } from "sonner";
import { VoiceChatNew } from "./VoiceChatNew";

type Step = 
  | "mode_selection"
  | "greeting" 
  | "name" 
  | "email" 
  | "phone" 
  | "lessons_for"
  | "age_myself"
  | "age_child"
  | "family_count"
  | "family_ages"
  | "program_recommendation"
  | "schedule_selection"
  | "contact_method" 
  | "message" 
  | "complete";

type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  status?: MessageStatus;
}

interface FamilyMember {
  age: number;
  recommendedProgram: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  lessonsFor: "myself" | "son" | "daughter" | "family";
  age?: number;
  familyCount?: number;
  familyMembers: FamilyMember[];
  recommendedPrograms: string[];
  location: string;
  selectedClassTime?: string;
  preferredContactMethod: "email" | "phone" | "text";
  message?: string;
}

// MyDojo locations with coordinates
const MYDOJO_LOCATIONS = [
  { name: "Tomball HQ", lat: 30.0933, lng: -95.6161 },
  // Add more locations here as needed
];

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to find nearest location
function findNearestLocation(userLat: number, userLng: number): string {
  let nearestLocation = MYDOJO_LOCATIONS[0];
  let minDistance = calculateDistance(userLat, userLng, nearestLocation.lat, nearestLocation.lng);
  
  for (const location of MYDOJO_LOCATIONS) {
    const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = location;
    }
  }
  
  return nearestLocation.name;
}

// Helper function to recommend program based on age
// New mapping: 3-5 → Little Ninjas, 6-12 → Dragon Kids, 13-15 → Teens, 16+ → Adults/Kickboxing
function recommendProgram(age: number): string {
  if (age >= 3 && age <= 5) return "Little Ninjas";
  if (age >= 6 && age <= 12) return "Dragon Kids";
  if (age >= 13 && age <= 15) return "Teens";
  if (age >= 16) return "Adult Karate"; // 16+ can also choose Kickboxing
  return "Not Sure";
}

// Helper function to parse "who lessons are for" from free-form text
function parseLessonsFor(text: string): "myself" | "son" | "daughter" | "family" | null {
  const lowerText = text.toLowerCase();
  
  // Check for family
  if (lowerText.match(/\b(family|everyone|all of us|whole family)\b/)) {
    return "family";
  }
  
  // Check for son
  if (lowerText.match(/\b(my son|son|boy|he|him|his)\b/)) {
    return "son";
  }
  
  // Check for daughter
  if (lowerText.match(/\b(my daughter|daughter|girl|she|her)\b/)) {
    return "daughter";
  }
  
  // Check for myself/adult
  if (lowerText.match(/\b(myself|me|i|adult|i am|i'm)\b/)) {
    return "myself";
  }
  
  return null;
}

// Helper function to extract age from free-form text
function parseAge(text: string): number | null {
  // Match patterns like "7 years old", "7-year-old", "age 7", "7 yo", or just "7"
  const agePatterns = [
    /(\d+)\s*(?:years?\s*old|yo|y\/o)/i,
    /(\d+)-year-old/i,
    /age\s*(\d+)/i,
    /\b(\d+)\b/  // Last resort: any number
  ];
  
  for (const pattern of agePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const age = parseInt(match[1]);
      // Validate age is reasonable (3-100)
      if (age >= 3 && age <= 100) {
        return age;
      }
    }
  }
  
  return null;
}

// Helper function to validate email (detect fake/generic emails)
function isValidEmail(email: string): { valid: boolean; message?: string } {
  const lowerEmail = email.toLowerCase().trim();
  
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lowerEmail)) {
    return { valid: false, message: "That doesn't look like a valid email address. Could you double-check and provide a real email?" };
  }
  
  // Detect common fake/test emails
  const fakePatterns = [
    /^test@/,
    /^fake@/,
    /^asdf@/,
    /^qwerty@/,
    /^abc@/,
    /^123@/,
    /^temp@/,
    /^throwaway@/,
    /^noemail@/,
    /^none@/,
    /^na@/,
    /^noreply@/,
    /@test\./,
    /@fake\./,
    /@example\./,
    /@temp\./,
  ];
  
  for (const pattern of fakePatterns) {
    if (pattern.test(lowerEmail)) {
      return { valid: false, message: "I need a real email address so I can send you class schedules and important updates. Could you provide your actual email?" };
    }
  }
  
  // Detect keyboard mashing patterns (like asdfgh@gmail.com)
  const localPart = lowerEmail.split('@')[0];
  const keyboardPatterns = [
    /^(asdf|qwer|zxcv|hjkl|uiop|jkl|fgh|dfg|cvb|bnm)+$/,
    /^(abc|xyz|test|fake|temp|none)+$/,
    /^([a-z])\1{4,}/, // Repeated characters like aaaaa (5+ times)
  ];
  
  for (const pattern of keyboardPatterns) {
    if (pattern.test(localPart)) {
      return { valid: false, message: "I need a real email address to keep you updated. Could you share your actual email?" };
    }
  }
  
  return { valid: true };
}

// Helper function to validate phone number (detect fake/generic numbers)
function isValidPhone(phone: string): { valid: boolean; message?: string } {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it's a reasonable length (10-11 digits for US numbers)
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { valid: false, message: "That doesn't look like a valid phone number. Could you provide a 10-digit phone number?" };
  }
  
  // Detect common fake patterns
  const fakePatterns = [
    /^1?234567890$/,  // 123-456-7890
    /^1?555555555$/,   // 555-555-5555
    /^1?000000000$/,   // 000-000-0000
    /^1?111111111$/,   // 111-111-1111
    /^1?999999999$/,   // 999-999-9999
    /^1?123456789$/,   // Sequential
    /^1?987654321$/,   // Reverse sequential
    /^1?(\d)\1{9}$/,   // All same digit (e.g., 1111111111)
  ];
  
  for (const pattern of fakePatterns) {
    if (pattern.test(digitsOnly)) {
      return { valid: false, message: "I need a real phone number so we can confirm your trial class appointment. Could you provide your actual phone number?" };
    }
  }
  
  // Check for 555 prefix (often fake in US)
  if (digitsOnly.length === 10 && digitsOnly.substring(0, 3) === '555') {
    return { valid: false, message: "That looks like a placeholder number. Could you share your real phone number so we can reach you?" };
  }
  
  return { valid: true };
}

// Helper function to get program description
function getProgramDescription(program: string): string {
  const descriptions: Record<string, string> = {
    "Little Ninjas": "A 'stealthy' way to teach children life skills through fun martial arts activities!",
    "Dragon Kids": "Perfect for building confidence, discipline, and self-defense skills in a safe environment!",
    "Teens": "High-energy training focused on fitness, self-defense, and building character!",
    "Adult Karate": "Get in the best shape of your life while learning real self-defense!",
    "Kickboxing": "Burn up to 800 calories in a single session with high-energy kickboxing!",
  };
  return descriptions[program] || "An excellent program for martial arts training!";
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
    email: "",
    phone: "",
    lessonsFor: "myself",
    familyMembers: [],
    recommendedPrograms: [],
    location: "Tomball HQ",
    preferredContactMethod: "email",
  });
  const [currentFamilyMemberIndex, setCurrentFamilyMemberIndex] = useState(0);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [autoVoiceMode, setAutoVoiceMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Store name immediately for early lead capture (before state updates)
  const capturedNameRef = useRef<string>("");

  const submitMutation = trpc.trialSignups.create.useMutation();
  const updateLeadMutation = trpc.trialSignups.update.useMutation();
  const textToSpeechMutation = trpc.ai.textToSpeech.useMutation();
  const saveConversationMutation = trpc.conversations.save.useMutation();
  const transcribeMutation = trpc.ai.transcribeAudio.useMutation();
  const trpcUtils = trpc.useUtils();
  
  // Generate a unique identifier for this user (use email when available, otherwise session ID)
  const [conversationId, setConversationId] = useState<string>(() => {
    // Always generate a NEW session ID on component mount to avoid restoring corrupted state
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatbot_conversation_id', newId);
    return newId;
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Hide navigation bar when chatbot is open
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      if (isOpen) {
        header.style.display = 'none';
      } else {
        header.style.display = '';
      }
    }
  }, [isOpen]);

  // Conversation restoration REMOVED to prevent empty screen bug
  // Each chatbot session now starts fresh to ensure clean initialization
  
  // Auto-detect location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nearestLocation = findNearestLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          setFormData(prev => ({ ...prev, location: nearestLocation }));
          console.log("Auto-detected nearest location:", nearestLocation);
        },
        (error) => {
          console.log("Geolocation error, using default location:", error);
        }
      );
    }
  }, []);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Show greeting messages when chat opens (after mode selection)
  useEffect(() => {
    if (isOpen && messages.length === 0 && step === "name" && interactionMode !== null) {
      const greetingMessages: Message[] = [
        {
          id: "greeting-1",
          role: "bot",
          content: "Hey there! 👋 Ready to start your martial arts journey? I can help you sign up for a FREE trial class at MyDojo!",
          timestamp: new Date(),
          status: "read",
        },
        {
          id: "greeting-2",
          role: "bot",
          content: "What's your name?",
          timestamp: new Date(),
          status: "read",
        },
      ];
      
      // Add messages with delay for natural feel
      const addGreetingMessages = async () => {
        for (const msg of greetingMessages) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 800));
          setIsTyping(false);
          setMessages(prev => [...prev, msg]);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      };
      
      addGreetingMessages();
    }
  }, [isOpen, step, interactionMode]);

  // Add user message
  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      status: "sending",
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate message status progression
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: "sent" as MessageStatus } : msg
      ));
    }, 300);
    
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: "delivered" as MessageStatus } : msg
      ));
    }, 600);
    
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: "read" as MessageStatus } : msg
      ));
    }, 1000);
  };

  // Add bot message with typing delay and optional voice playback
  const addBotMessage = async (content: string) => {
    // Calculate delay based on message length (50ms per character, min 800ms, max 2500ms)
    const delay = Math.min(Math.max(content.length * 50, 800), 2500);
    
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
    
    const newMessage: Message = {
      id: `bot-${Date.now()}`,
      role: "bot",
      content,
      timestamp: new Date(),
      status: "read",
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Play voice response if in voice chat mode
    if (interactionMode === 'voice') {
      try {
        console.log('[Voice Chat] Generating speech for:', content.substring(0, 50) + '...');
        const response = await textToSpeechMutation.mutateAsync({ text: content });
        console.log('[Voice Chat] TTS response received:', response);
        
        if (response.audio) {
          // Convert base64 to audio and play
          const audioBlob = new Blob(
            [Uint8Array.from(atob(response.audio), c => c.charCodeAt(0))],
            { type: 'audio/mpeg' }
          );
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          console.log('[Voice Chat] Playing audio...');
          
          // Handle audio playback
          audio.onplay = () => console.log('[Voice Chat] Audio started playing');
          audio.onended = () => {
            console.log('[Voice Chat] Audio finished playing');
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = (e) => {
            console.error('[Voice Chat] Audio playback error:', e);
            toast.error('Failed to play voice response');
          };
          
          try {
            await audio.play();
          } catch (playError) {
            console.error('[Voice Chat] Play error:', playError);
            // Browser might block autoplay - show user feedback
            toast.error('Click anywhere to enable voice responses');
          }
        } else {
          console.warn('[Voice Chat] No audio data in response');
        }
      } catch (error) {
        console.error('[Voice Chat] Text-to-speech error:', error);
        toast.error('Voice response failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  // Fetch and show available class schedules
  const fetchAndShowSchedules = async (programs: string[]) => {
    try {
      // Fetch real class schedules from database
      const schedules = await trpcUtils.schedule.getClassSchedules.fetch({
        programs,
        location: formData.location,
      });

      if (schedules && schedules.length > 0) {
        setAvailableClasses(schedules);
        await addBotMessage("Great! Here are some available class times for you:");
        
        // Show up to 3 upcoming class times
        const upcomingClasses = getUpcomingClasses(schedules).slice(0, 3);
        
        if (upcomingClasses.length > 0) {
          await addBotMessage("Click on a time that works best for you, or type your preference:");
          // The UI will render buttons for these classes
        } else {
          await addBotMessage("I couldn't find upcoming classes in the next few days. Let me have a staff member help you find the perfect time. What's the best way to reach you?");
          setStep("contact_method");
        }
      } else {
        await addBotMessage("Let me have a staff member help you find the perfect class time. What's the best way to reach you?");
        setStep("contact_method");
      }
    } catch (error) {
      console.error("Error fetching class schedules:", error);
      setAvailableClasses([]);
      await addBotMessage("Let me have a staff member help you find the perfect class time. What's the best way to reach you?");
      setStep("contact_method");
    }
  };

  // Helper function to get upcoming classes (next 7 days)
  const getUpcomingClasses = (schedules: any[]) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const upcoming: any[] = [];
    
    // Check next 7 days
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const checkDayName = dayNames[checkDate.getDay()];
      
      // Find classes for this day
      const dayClasses = schedules.filter(s => s.dayOfWeek === checkDayName);
      
      for (const classSchedule of dayClasses) {
        upcoming.push({
          ...classSchedule,
          date: checkDate,
          dateString: checkDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        });
      }
    }
    
    return upcoming;
  };

  // Save conversation state to database
  const saveConversation = async () => {
    try {
      await saveConversationMutation.mutateAsync({
        identifier: formData.email || conversationId,
        name: formData.name || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        program: formData.recommendedPrograms[0] || undefined,
        currentStep: step,
        conversationHistory: JSON.stringify(messages),
        completed: step === "complete" ? 1 : 0,
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  // Handle input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input.trim();
    setInput("");
    addUserMessage(userInput);
    
    await handleInput(userInput);
    
    // Save conversation after each interaction
    await saveConversation();
  };

  // Handle voice recording toggle (MediaRecorder-based)
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Setup audio context for silence detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      
      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        await processRecording();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording... Speak now!');

      // Start silence detection
      detectSilence();
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const detectSilence = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudioLevel = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      // Calculate audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = Math.abs(dataArray[i] - 128);
        sum += value;
      }
      const average = sum / bufferLength;
      
      // If audio level is above threshold, reset silence timer
      if (average > 5) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          stopRecording();
        }, 2000); // Stop after 2 seconds of silence
      }
      
      if (isRecording) {
        requestAnimationFrame(checkAudioLevel);
      }
    };
    
    checkAudioLevel();
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error('No audio recorded. Please try again.');
      return;
    }

    try {
      // Create blob from recorded chunks
      const mimeType = audioChunksRef.current[0].type;
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      // Send to server for transcription
      const result = await transcribeMutation.mutateAsync({
        audioBlob: base64Audio,
        mimeType: mimeType,
      });
      
      if (result.text && result.text.trim()) {
        setInput(result.text);
        // Auto-submit after transcription
        setTimeout(() => {
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }, 500);
      } else {
        toast.error('Could not understand. Please try again.');
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Transcription failed. Please try again.');
    } finally {
      audioChunksRef.current = [];
    }
  };

  // Handle conversation logic
  const handleInput = async (userInput: string) => {
    switch (step) {
      case "name":
        // Try to parse lessons-for and age from the message
        const lessonsForParsed = parseLessonsFor(userInput);
        const ageParsed = parseAge(userInput);
        
        // Extract name (first word or before "for")
        let extractedName = userInput.split(/\s+(for|looking)\s+/i)[0].trim();
        if (!extractedName || extractedName.length < 2) {
          extractedName = userInput.split(/\s+/)[0].trim();
        }
        
        // Store name immediately in ref for early lead capture
        capturedNameRef.current = extractedName;
        
        setFormData(prev => ({ 
          ...prev, 
          name: extractedName,
          ...(lessonsForParsed && { lessonsFor: lessonsForParsed }),
          ...(ageParsed && { age: ageParsed })
        }));
        
        await addBotMessage(`Nice to meet you, ${extractedName}! 😊`);
        
        // If we parsed lessons-for info, acknowledge it
        if (lessonsForParsed) {
          if (lessonsForParsed === "son") {
            await addBotMessage("That's wonderful! Your son is going to love it here! 🥋");
            await addBotMessage("He's going to build confidence, discipline, and make amazing friends!");
          } else if (lessonsForParsed === "daughter") {
            await addBotMessage("That's wonderful! Your daughter is going to love it here! 🥋");
            await addBotMessage("She's going to build confidence, discipline, and make amazing friends!");
          } else if (lessonsForParsed === "myself") {
            await addBotMessage("That's awesome! You're going to love this! 🔥");
          } else if (lessonsForParsed === "family") {
            await addBotMessage("That's fantastic! Family training is such a great bonding experience! 👪");
          }
          
          // If we also got age, process the recommendation
          if (ageParsed) {
            const program = recommendProgram(ageParsed);
            setFormData(prev => ({ ...prev, recommendedPrograms: [program] }));
            
            if (lessonsForParsed === "myself" || lessonsForParsed === "son" || lessonsForParsed === "daughter") {
              const pronoun = lessonsForParsed === "myself" ? "you" : (lessonsForParsed === "son" ? "him" : "her");
              const possessive = lessonsForParsed === "myself" ? "You're" : (lessonsForParsed === "son" ? "He's" : "She's");
              await addBotMessage(`Perfect! ${possessive} going to absolutely love it here! 🌟`);
              await addBotMessage(`At ${ageParsed} years old, I'd recommend our **${program}** program for ${pronoun}.`);
              await addBotMessage(`${getProgramDescription(program)}`);
              
              // Skip to email since we have all the info we need
              await addBotMessage(`Can you provide me with your email address so I can send you class schedules and updates?`);
              setStep("email");
              break;
            }
          } else {
            // We have lessons-for but not age, ask for age
            if (lessonsForParsed === "myself") {
              await addBotMessage("How old are you?");
              setStep("age_myself");
              break;
            } else if (lessonsForParsed === "son" || lessonsForParsed === "daughter") {
              const pronoun = lessonsForParsed === "son" ? "son" : "daughter";
              await addBotMessage(`How old is your ${pronoun}?`);
              setStep("age_child");
              break;
            } else if (lessonsForParsed === "family") {
              await addBotMessage("How many family members will be training?");
              setStep("family_count");
              break;
            }
          }
        }
        
        // Default flow if we didn't parse anything special - ask for phone FIRST
        await addBotMessage(`What's the best phone number to reach you? We'll use this to confirm your trial class appointment.`);
        setStep("phone");
        break;

      case "email":
        // Allow skip
        if (userInput.toLowerCase() === 'skip') {
          await addBotMessage("No problem! We'll just use your phone number to stay in touch. 👍");
          await addBotMessage("Now, who are these lessons for?");
          setStep("lessons_for");
          break;
        }
        
        // Validate email before saving
        const emailValidation = isValidEmail(userInput);
        if (!emailValidation.valid) {
          await addBotMessage(emailValidation.message!);
          return; // Stay on email step
        }
        
        setFormData(prev => ({ ...prev, email: userInput }));
        
        // Update lead with email if we have a lead ID
        if ((formData as any).leadId) {
          try {
            await updateLeadMutation.mutateAsync({
              id: (formData as any).leadId,
              email: userInput
            });
            console.log("[Early Lead Capture] Lead updated with email");
          } catch (error) {
            console.error("[Early Lead Capture] Failed to update lead with email:", error);
          }
        }
        
        await addBotMessage("Perfect! Got your email saved. 📧");
        await addBotMessage("Now, who are these lessons for?");
        setStep("lessons_for");
        break;

      case "phone":
        // Validate phone before saving
        const phoneValidation = isValidPhone(userInput);
        if (!phoneValidation.valid) {
          await addBotMessage(phoneValidation.message!);
          return; // Stay on phone step
        }
        
        setFormData(prev => ({ ...prev, phone: userInput }));
        
        // ✅ SAVE LEAD IMMEDIATELY after collecting name + phone
        try {
          const leadData = {
            name: capturedNameRef.current, // Use ref to get immediate value
            phone: userInput,
            email: "", // Will update later
            program: "Not Sure" as const,
            location: formData.location || "Tomball HQ",
            source: "chatbot" as const
          };
          
          const result = await submitMutation.mutateAsync(leadData);
          console.log("[Early Lead Capture] Lead saved:", result);
          
          // Store lead ID for later updates
          setFormData(prev => ({ ...prev, leadId: result.id } as any));
        } catch (error) {
          console.error("[Early Lead Capture] Failed to save lead:", error);
          // Continue anyway - we have the data locally
        }
        
        await addBotMessage("Perfect! Got your number saved. 📱");
        await addBotMessage("Can you provide me with your email address so I can send you class schedules and updates? (Or type 'skip' if you prefer not to share)");
        setStep("email");
        break;

      case "lessons_for":
        // Parse the user's response to extract who lessons are for and potentially age
        const lessonsForValue = parseLessonsFor(userInput);
        const ageValue = parseAge(userInput);
        
        if (!lessonsForValue) {
          await addBotMessage("I'm not quite sure who you're looking for lessons for. Could you tell me if it's for yourself, your son, your daughter, or your family?");
          return;
        }
        
        setFormData(prev => ({ 
          ...prev, 
          lessonsFor: lessonsForValue,
          ...(ageValue && { age: ageValue })
        }));
        
        // Acknowledge their response warmly
        if (lessonsForValue === "son") {
          await addBotMessage("That's wonderful! Your son is going to love it here! 🥋");
          await addBotMessage("He's going to build confidence, discipline, and make amazing friends!");
        } else if (lessonsForValue === "daughter") {
          await addBotMessage("That's wonderful! Your daughter is going to love it here! 🥋");
          await addBotMessage("She's going to build confidence, discipline, and make amazing friends!");
        } else if (lessonsForValue === "myself") {
          await addBotMessage("That's awesome! You're going to love this! 🔥");
        } else if (lessonsForValue === "family") {
          await addBotMessage("That's fantastic! Family training is such a great bonding experience! 👪");
        }
        
        // If we got age from their message, process the recommendation
        if (ageValue) {
          const program = recommendProgram(ageValue);
          setFormData(prev => ({ ...prev, recommendedPrograms: [program] }));
          
          if (lessonsForValue === "myself" || lessonsForValue === "son" || lessonsForValue === "daughter") {
            const pronoun = lessonsForValue === "myself" ? "you" : (lessonsForValue === "son" ? "him" : "her");
            const possessive = lessonsForValue === "myself" ? "You're" : (lessonsForValue === "son" ? "He's" : "She's");
            await addBotMessage(`Perfect! ${possessive} going to absolutely love it here! 🌟`);
            await addBotMessage(`At ${ageValue} years old, I'd recommend our **${program}** program for ${pronoun}.`);
            await addBotMessage(`${getProgramDescription(program)}`);
            setStep("schedule_selection");
            await fetchAndShowSchedules([program]);
            break;
          }
        } else {
          // We have lessons-for but not age, ask for age
          if (lessonsForValue === "myself") {
            await addBotMessage("How old are you?");
            setStep("age_myself");
          } else if (lessonsForValue === "son" || lessonsForValue === "daughter") {
            const pronoun = lessonsForValue === "son" ? "son" : "daughter";
            await addBotMessage(`How old is your ${pronoun}?`);
            setStep("age_child");
          } else if (lessonsForValue === "family") {
            await addBotMessage("How many family members will be training?");
            setStep("family_count");
          }
        }
        break;

      case "age_myself":
        const myAge = parseInt(userInput);
        if (isNaN(myAge) || myAge < 3 || myAge > 100) {
          await addBotMessage("Hmm, that doesn't look quite right. Could you enter your age as a number? (For example: 25)");
          return;
        }
        setFormData(prev => ({ ...prev, age: myAge }));
        const myProgram = recommendProgram(myAge);
        setFormData(prev => ({ ...prev, recommendedPrograms: [myProgram] }));
        await addBotMessage(`Excellent! You're going to love this! 🔥`);
        await addBotMessage(`Based on your age, I'd recommend our **${myProgram}** program.`);
        await addBotMessage(`${getProgramDescription(myProgram)}`);
        setStep("schedule_selection");
        await fetchAndShowSchedules([myProgram]);
        break;

      case "age_child":
        const childAge = parseInt(userInput);
        if (isNaN(childAge) || childAge < 3 || childAge > 17) {
          await addBotMessage("Hmm, that doesn't look quite right. Could you enter their age as a number? (For example: 8)");
          return;
        }
        setFormData(prev => ({ ...prev, age: childAge }));
        const childProgram = recommendProgram(childAge);
        setFormData(prev => ({ ...prev, recommendedPrograms: [childProgram] }));
        const pronoun = formData.lessonsFor === "son" ? "him" : "her";
        const possessive = formData.lessonsFor === "son" ? "He's" : "She's";
        await addBotMessage(`Perfect! ${possessive} going to absolutely love it here! 🌟`);
        await addBotMessage(`At ${childAge} years old, I'd recommend our **${childProgram}** program for ${pronoun}.`);
        await addBotMessage(`${getProgramDescription(childProgram)}`);
        setStep("schedule_selection");
        await fetchAndShowSchedules([childProgram]);
        break;

      case "family_count":
        const count = parseInt(userInput);
        if (isNaN(count) || count < 2 || count > 10) {
          await addBotMessage("Hmm, that doesn't look quite right. Could you enter the number of family members? (For example: 3)");
          return;
        }
        setFormData(prev => ({ ...prev, familyCount: count }));
        await addBotMessage(`Awesome! ${count} family members training together - that's going to be amazing! 🎉`);
        await addBotMessage(`Let me get everyone's ages so I can recommend the best programs. What's the first person's age?`);
        setStep("family_ages");
        setCurrentFamilyMemberIndex(0);
        break;

      case "family_ages":
        const age = parseInt(userInput);
        if (isNaN(age) || age < 3 || age > 100) {
          await addBotMessage("Hmm, that doesn't look quite right. Could you enter their age as a number? (For example: 10)");
          return;
        }
        
        const program = recommendProgram(age);
        const newMember: FamilyMember = { age, recommendedProgram: program };
        const updatedMembers = [...formData.familyMembers, newMember];
        setFormData(prev => ({ 
          ...prev, 
          familyMembers: updatedMembers,
          recommendedPrograms: [...prev.recommendedPrograms, program]
        }));
        
        const nextIndex = currentFamilyMemberIndex + 1;
        if (nextIndex < (formData.familyCount || 0)) {
          await addBotMessage(`Got it! What's the next person's age?`);
          setCurrentFamilyMemberIndex(nextIndex);
        } else {
          // Show all recommendations
          await addBotMessage("Perfect! I've got the perfect programs for everyone in your family! Here's what I recommend:");
          for (let i = 0; i < updatedMembers.length; i++) {
            const member = updatedMembers[i];
            await addBotMessage(`**Person ${i + 1}** (age ${member.age}): **${member.recommendedProgram}** - ${getProgramDescription(member.recommendedProgram)}`);
          }
          setStep("schedule_selection");
          await fetchAndShowSchedules(formData.recommendedPrograms);
        }
        break;

      case "schedule_selection":
        // Allow users to type their preference or skip
        if (userInput.toLowerCase().includes("skip") || userInput.toLowerCase().includes("any")) {
          setFormData(prev => ({ ...prev, selectedClassTime: "No preference" }));
          await addBotMessage("No problem! We'll help you find the perfect time when you come in.");
        } else {
          // Accept their typed response as the class time preference
          setFormData(prev => ({ ...prev, selectedClassTime: userInput }));
          await addBotMessage("Great! I've noted your class time preference.");
        }
        await addBotMessage("How would you prefer we contact you?");
        setStep("contact_method");
        break;

      case "contact_method":
        // Parse contact method from text input
        const lowerInput = userInput.toLowerCase();
        let contactMethod: "email" | "phone" | "text" = "email";
        
        if (lowerInput.includes("text") || lowerInput.includes("sms")) {
          contactMethod = "text";
        } else if (lowerInput.includes("phone") || lowerInput.includes("call")) {
          contactMethod = "phone";
        } else if (lowerInput.includes("email")) {
          contactMethod = "email";
        }
        
        setFormData(prev => ({ ...prev, preferredContactMethod: contactMethod }));
        await addBotMessage(`Perfect! We'll reach out via ${contactMethod}. 📞`);
        await addBotMessage("Is there anything else you'd like us to know? (Or just type 'no' if you're all set!)");
        setStep("message");
        break;

      case "message":
        if (userInput.toLowerCase() === "no") {
          setFormData(prev => ({ ...prev, message: "" }));
        } else {
          setFormData(prev => ({ ...prev, message: userInput }));
        }
        await submitSignup();
        break;

      default:
        break;
    }
  };

  // Handle button selections
  const handleLessonsForSelect = async (value: "myself" | "son" | "daughter" | "family") => {
    setFormData(prev => ({ ...prev, lessonsFor: value }));
    addUserMessage(value === "myself" ? "Myself" : value === "son" ? "My son" : value === "daughter" ? "My daughter" : "My family (multiple people)");
    
    if (value === "myself") {
      await addBotMessage("Awesome! Getting in shape and learning self-defense is such a great decision. 💪");
      await addBotMessage("You're going to feel amazing!");
      await addBotMessage("How old are you?");
      setStep("age_myself");
    } else if (value === "son" || value === "daughter") {
      const pronoun = value === "son" ? "him" : "her";
      const possessive = value === "son" ? "He's" : "She's";
      await addBotMessage(`That's wonderful! Your ${value} is going to love it here! 🥋`);
      await addBotMessage(`${possessive} going to build confidence, discipline, and make amazing friends!`);
      await addBotMessage(`How old is your ${value}?`);
      setStep("age_child");
    } else {
      await addBotMessage("That's fantastic! Training together as a family is such a special experience. You'll all grow stronger together! 👨‍👩‍👧‍👦");
      await addBotMessage("How many family members want to train?");
      setStep("family_count");
    }
  };

  const handleClassTimeSelect = async (classInfo: any) => {
    // Calculate the actual date/time for the appointment
    const appointmentDate = new Date(classInfo.date);
    const [hours, minutes] = parseTime(classInfo.startTime);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    const displayTime = `${classInfo.dateString} at ${classInfo.startTime}`;
    
    setFormData(prev => ({ 
      ...prev, 
      selectedClassTime: displayTime,
      scheduledTime: appointmentDate,
    } as any));
    
    addUserMessage(displayTime);
    await addBotMessage(`Perfect! I've booked your trial class for **${displayTime}**! 🎉`);
    await addBotMessage("You'll receive a confirmation shortly. How would you like us to contact you?");
    setStep("contact_method");
  };

  // Helper function to parse time string (e.g., "5:00 PM" -> [17, 0])
  const parseTime = (timeStr: string): [number, number] => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return [hours, minutes || 0];
  };

  const handleContactMethodSelect = async (method: "email" | "phone" | "text") => {
    setFormData(prev => ({ ...prev, preferredContactMethod: method }));
    const methodText = method === "email" ? "📧 Email" : method === "phone" ? "📞 Phone call" : "💬 Text message";
    addUserMessage(methodText);
    await addBotMessage("Perfect! We'll reach out to you that way. 👍");
    await addBotMessage("Is there anything else you'd like us to know? (Or just type 'no' to finish)");
    setStep("message");
  };

  // Submit the trial signup
  const submitSignup = async () => {
    try {
      await submitMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        program: formData.recommendedPrograms.join(", ") as any,
        location: formData.location,
        preferredContactMethod: formData.preferredContactMethod,
        message: formData.message,
        scheduledTime: (formData as any).scheduledTime,
      });
      
      await addBotMessage("🎉 Congratulations! Your trial class is booked!");
      
      if ((formData as any).scheduledTime) {
        await addBotMessage(`Your appointment is confirmed for **${formData.selectedClassTime}**. We'll send you a reminder before class!`);
      } else {
        await addBotMessage("We'll reach out to you shortly to schedule your first class.");
      }
      
      await addBotMessage("Get ready to start your martial arts journey! 🥋");
      await addBotMessage("See you on the mats soon!");
      setStep("complete");
      toast.success("Trial signup successful! We'll contact you soon.");
    } catch (error) {
      console.error("Error submitting trial signup:", error);
      await addBotMessage("Oops! There was an error submitting your signup. Please try again or call us at (877) 4-MYDOJO.");
      toast.error("Failed to submit signup. Please try again.");
    }
  };

  // Render message status indicator
  const renderMessageStatus = (status?: MessageStatus) => {
    if (!status) return null;
    
    const statusConfig = {
      sending: { icon: null, text: "Sending...", color: "text-gray-400" },
      sent: { icon: <Check className="h-3 w-3" />, text: "Sent", color: "text-gray-400" },
      delivered: { icon: <CheckCheck className="h-3 w-3" />, text: "Delivered", color: "text-gray-400" },
      read: { icon: <CheckCheck className="h-3 w-3" />, text: "Read", color: "text-blue-500" },
    };
    
    const config = statusConfig[status];
    
    return (
      <div className={`flex items-center gap-1 text-xs ${config.color} mt-1`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
    );
  };

  // Toggle chat open/close
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("openTrialChatbot", handleOpenChat);
    return () => window.removeEventListener("openTrialChatbot", handleOpenChat);
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

  // Voice mode uses the same conversation flow as text mode
  // The difference is in how input is captured (voice vs keyboard)

  // Render VoiceChatNew when voice mode is selected
  if (interactionMode === "voice") {
    return <VoiceChatNew onClose={() => {
      setIsOpen(false);
      setInteractionMode(null);
      setStep("mode_selection");
    }} />;
  }

  console.log('[TrialChatbot] Rendering with step:', step, 'interactionMode:', interactionMode);

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] bg-black/50 backdrop-blur-sm">
      {/* Full-screen chat container */}
      <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-white shadow-2xl flex flex-col h-screen w-screen overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden hover:bg-white/10 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img src="/images/logo-icon-white.99cb4daa.webp" alt="MyDojo" className="h-10 w-10 rounded-full" />
            <div>
              <h2 className="font-bold text-lg">MYDOJO ASSISTANT</h2>
              <p className="text-sm text-white/80">Start Your Free Trial</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hidden md:block hover:bg-white/10 rounded-full p-2 transition-colors"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selection Screen */}
        {step === "mode_selection" && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome! 👋</h3>
                <p className="text-gray-600 text-base md:text-lg">How would you like to interact with me today?</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Text Chat Option */}
                <button
                  onClick={() => {
                    setInteractionMode("text");
                    setStep("name");
                  }}
                  className="group relative overflow-hidden bg-white hover:bg-primary transition-all duration-300 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-primary"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary group-hover:bg-white transition-colors duration-300 rounded-full p-4">
                      <Keyboard className="h-8 w-8 text-white group-hover:text-primary transition-colors duration-300" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-xl font-bold text-gray-900 group-hover:text-white transition-colors duration-300">Text Chat</h4>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300">Type your responses</p>
                    </div>
                  </div>
                </button>

                {/* Voice Chat Option */}
                <button
                  onClick={() => {
                    setInteractionMode("voice");
                  }}
                  className="group relative overflow-hidden bg-white hover:bg-primary transition-all duration-300 rounded-2xl p-6 shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-primary"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary group-hover:bg-white transition-colors duration-300 rounded-full p-4">
                      <Mic className="h-8 w-8 text-white group-hover:text-primary transition-colors duration-300" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="text-xl font-bold text-gray-900 group-hover:text-white transition-colors duration-300">Voice Chat</h4>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300">Speak your responses (hands-free)</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">Perfect for driving</span>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-gray-500">You can switch modes anytime during the conversation</p>
            </div>
          </div>
        )}

        {/* Voice Mode UI - Now handled by VoiceChatNew component */}
        {false && step !== "mode_selection" && interactionMode === "voice" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-black to-purple-900">
            {/* Voice Chat Interface */}
            <div className="text-center space-y-8 max-w-2xl">
              {/* Current bot message */}
              {messages.length > 0 && messages[messages.length - 1].role === "bot" && (
                <div className="text-white text-2xl md:text-3xl font-medium px-6 animate-fade-in">
                  {messages[messages.length - 1].content}
                </div>
              )}

              {/* Animated orb */}
              <div className="flex justify-center">
                <div className={`relative w-48 h-48 rounded-full ${
                  isRecording 
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 animate-pulse' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                } shadow-2xl flex items-center justify-center`}>
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-75"></div>
                  )}
                  <div className="relative z-10">
                    {isRecording ? (
                      <div className="flex gap-2">
                        <div className="w-3 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-3 h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-3 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    ) : (
                      <Mic className="h-20 w-20 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Status text */}
              <div className="text-white/80 text-lg">
                {isRecording ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    Listening... Speak now!
                  </span>
                ) : isTyping ? (
                  <span>Kai is thinking...</span>
                ) : (
                  <span>Tap to speak</span>
                )}
              </div>

              {/* Microphone button */}
              <button
                onClick={toggleVoiceRecording}
                disabled={isTyping}
                className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-white hover:bg-gray-100'
                } shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? (
                  <Square className="h-8 w-8 text-white" />
                ) : (
                  <Mic className="h-8 w-8 text-purple-600" />
                )}
              </button>

              {/* Switch to text mode button */}
              <button
                onClick={() => setInteractionMode("text")}
                className="text-white/60 hover:text-white text-sm underline transition-colors"
              >
                Switch to text chat
              </button>
            </div>
          </div>
        )}

        {/* Text Mode UI - Messages area */}
        {step !== "mode_selection" && interactionMode === "text" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-2`}
            >
              {/* Bot avatar */}
              {message.role === "bot" && (
                <img src="/images/WhitelogoBlackCircle.webp" alt="MyDojo Bot" className="h-8 w-8 flex-shrink-0 mt-1" />
              )}
              <div className={`max-w-[80%] md:max-w-[70%]`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                  }`}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className={`flex items-center gap-2 px-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {message.role === "user" && renderMessageStatus(message.status)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start gap-2">
              <img src="/images/WhitelogoBlackCircle.webp" alt="MyDojo Bot" className="h-8 w-8 flex-shrink-0 mt-1" />
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Button options removed - lessons_for now uses text input with intelligent parsing */}

          {step === "schedule_selection" && availableClasses.length > 0 && (
            <div className="flex flex-col gap-2 max-w-[80%] md:max-w-[70%]">
              {getUpcomingClasses(availableClasses).slice(0, 3).map((classItem, index) => (
                <Button
                  key={index}
                  onClick={() => handleClassTimeSelect(classItem)}
                  variant="outline"
                  className="w-full justify-start bg-white hover:bg-primary hover:text-white text-left transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="font-semibold">{classItem.program}</div>
                    <div className="text-sm opacity-80">{classItem.dateString}</div>
                    <div className="text-sm opacity-80">{classItem.startTime} - {classItem.endTime}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === "contact_method" && (
            <div className="flex flex-col gap-2 max-w-[80%] md:max-w-[70%]">
              <Button
                onClick={() => handleContactMethodSelect("email")}
                variant="outline"
                className="w-full justify-start bg-white hover:bg-gray-100"
              >
                📧 Email
              </Button>
              <Button
                onClick={() => handleContactMethodSelect("phone")}
                variant="outline"
                className="w-full justify-start bg-white hover:bg-gray-100"
              >
                📞 Phone call
              </Button>
              <Button
                onClick={() => handleContactMethodSelect("text")}
                variant="outline"
                className="w-full justify-start bg-white hover:bg-gray-100"
              >
                💬 Text message
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
        )}

        {/* Input area - always show except for mode selection and completion */}
        {step !== "mode_selection" && step !== "complete" && (
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening..." : "Type your message..."}
                className="flex-1 rounded-full"
                disabled={isTyping || isRecording}
              />
              <Button
                type="button"
                size="icon"
                onClick={toggleVoiceRecording}
                className={`rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gray-200 hover:bg-gray-300'}`}
                disabled={isTyping}
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'text-white' : 'text-gray-700'}`} />
              </Button>
              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90"
                disabled={!input.trim() || isTyping || isRecording}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Close button for completed state */}
        {step === "complete" && (
          <div className="p-4 bg-white border-t">
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
