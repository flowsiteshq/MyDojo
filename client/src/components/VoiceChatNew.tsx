import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { X, Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  VoiceFlowState,
  generateVoiceResponse,
  getInitialGreeting,
  formatScheduleOptions,
  getConversionBooster,
} from "@/lib/voiceFlowHandler";

interface VoiceChatNewProps {
  onClose: () => void;
}

export function VoiceChatNew({ onClose }: VoiceChatNewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [flowState, setFlowState] = useState<VoiceFlowState>({
    step: "greeting",
    studentType: null,
    age: null,
    program: null,
    selectedClassTime: null,
    name: null,
    email: null,
    phone: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const interruptionMonitorRef = useRef<number | null>(null);
  const hasGreetedRef = useRef(false);
  const isInitializingRef = useRef(false);

  const textToSpeechMutation = trpc.ai.textToSpeech.useMutation();
  const transcribeMutation = trpc.ai.transcribeAudio.useMutation();
  
  // Interruption monitoring functions
  const startInterruptionMonitoring = () => {
    if (!analyserRef.current || !streamRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkForInterruption = () => {
      if (!analyserRef.current || !isSpeaking) return;
      
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = Math.abs(dataArray[i] - 128);
        sum += value;
      }
      const average = sum / bufferLength;
      
      // Interruption threshold (user speaking)
      const interruptionThreshold = 5;
      
      if (average > interruptionThreshold) {
        // User is speaking - interrupt Kai
        handleInterruption();
        return;
      }
      
      // Continue monitoring
      if (isSpeaking) {
        interruptionMonitorRef.current = requestAnimationFrame(checkForInterruption);
      }
    };
    
    checkForInterruption();
  };
  
  const stopInterruptionMonitoring = () => {
    if (interruptionMonitorRef.current) {
      cancelAnimationFrame(interruptionMonitorRef.current);
      interruptionMonitorRef.current = null;
    }
  };
  
  const handleInterruption = () => {
    // Stop Kai's audio immediately
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    setIsSpeaking(false);
    stopInterruptionMonitoring();
    
    // Start recording the user's interruption
    if (!isRecording) {
      startRecording();
    }
  };
  const scheduleQuery = trpc.schedule.getNextClasses.useQuery(
    {
      program: flowState.program || "",
      location: "Tomball HQ",
      limit: 2,
    },
    {
      enabled: flowState.step === "show_schedule" && !!flowState.program,
    }
  );
  const submitTrialMutation = trpc.trialSignups.create.useMutation();

  // Define speakText function before useEffect
  const speakText = async (text: string) => {
    try {
      // Stop any currently playing audio first
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      setIsSpeaking(true);
      const result = await textToSpeechMutation.mutateAsync({
        text,
        voiceId: "kdmDKE6EkgrWrrykO9Qt", // Kai's voice
      });

      // Convert base64 to blob and play (browser-native approach)
      const binaryString = atob(result.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        stopInterruptionMonitoring();
      };

      await audio.play();
      
      // Start monitoring for interruptions while Kai speaks
      startInterruptionMonitoring();
    } catch (error) {
      console.error("[VoiceChat] TTS error:", error);
      setIsSpeaking(false);
    }
  };

  // Initialize microphone on mount for continuous monitoring
  useEffect(() => {
    const initializeMicrophone = async () => {
      // Prevent multiple initializations
      if (isInitializingRef.current || hasGreetedRef.current) {
        return;
      }
      isInitializingRef.current = true;
      
      try {
        console.log('[VoiceChat] Requesting microphone access...');
        
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported in this browser');
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        console.log('[VoiceChat] Microphone access granted, stream:', stream);
        streamRef.current = stream;
        
        // Setup audio context for monitoring
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        source.connect(analyserRef.current);
        
        // Start conversation after microphone is ready
        if (!hasGreetedRef.current) {
          hasGreetedRef.current = true;
          const greeting = getInitialGreeting();
          setCurrentText(greeting);
          await speakText(greeting);
        }
        
        // After greeting finishes, automatically start listening
        setTimeout(() => {
          console.log('[VoiceChat] Starting recording after greeting...');
          startRecording();
        }, 500);
      } catch (error: any) {
        console.error("[VoiceChat] Microphone initialization error:", error);
        console.error("[VoiceChat] Error name:", error.name);
        console.error("[VoiceChat] Error message:", error.message);
        
        let errorMessage = "Could not access microphone. ";
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += "Please allow microphone access in your browser settings.";
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage += "No microphone device found. Please connect a microphone.";
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage += "Microphone is already in use by another application.";
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          errorMessage += "Microphone doesn't support required audio settings.";
        } else {
          errorMessage += error.message || "Unknown error occurred.";
        }
        
        toast.error(errorMessage);
      } finally {
        isInitializingRef.current = false;
      }
    };
    
    initializeMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Orb is now purely visual - no interaction needed

  // Handle schedule query result
  useEffect(() => {
    if (flowState.step === "show_schedule" && scheduleQuery.data) {
      const classes = scheduleQuery.data;
      let scheduleMessage = formatScheduleOptions(classes);

      // Add conversion booster
      scheduleMessage = `${scheduleMessage} ${getConversionBooster()}`;

      setCurrentText(scheduleMessage);
      speakText(scheduleMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowState.step, scheduleQuery.data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      // Use existing stream (already initialized on mount)
      if (!streamRef.current || !audioContextRef.current || !analyserRef.current) {
        console.error("[VoiceChat] Microphone not initialized");
        return;
      }
      
      const stream = streamRef.current;

      // Create MediaRecorder with browser's default format (no MIME type specification)
      // This allows the browser to choose the best supported format automatically
      try {
        mediaRecorderRef.current = new MediaRecorder(stream);
        console.log('[VoiceChat] MediaRecorder created with browser default format');
        console.log('[VoiceChat] Selected MIME type:', mediaRecorderRef.current.mimeType);
      } catch (err: any) {
        console.error("[VoiceChat] MediaRecorder creation error:", err);
        toast.error("Your browser doesn't support audio recording. Please try Chrome or Firefox.");
        return;
      }
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        await processRecording();
      };

      try {
        mediaRecorderRef.current.start();
        console.log('[VoiceChat] MediaRecorder started successfully');
        setIsRecording(true);

        // Start silence detection
        detectSilence();
      } catch (startErr: any) {
        console.error("[VoiceChat] MediaRecorder start error:", startErr);
        toast.error("Failed to start recording. Please refresh and try again.");
        return;
      }
    } catch (error) {
      console.error("[VoiceChat] Microphone access error:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const detectSilence = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = Math.abs(dataArray[i] - 128);
        sum += value;
      }
      const average = sum / bufferLength;

      // Silence threshold (increased for mobile compatibility)
      const silenceThreshold = 5;

      if (average < silenceThreshold) {
        // Silence detected
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording();
          }, 2000); // Stop after 2 seconds of silence
        }
      } else {
        // Sound detected, reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }

      // Continue checking
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
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

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error("No audio recorded. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create blob from recorded chunks
      const mimeType = audioChunksRef.current[0].type;
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
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
        handleUserInput(result.text);
      } else {
        toast.error("Could not understand. Please try again.");
      }
    } catch (error) {
      console.error("[VoiceChat] Transcription error:", error);
      toast.error("Transcription failed. Please try again.");
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const handleUserInput = async (userInput: string) => {
    // Special handling for schedule selection
    if (flowState.step === "show_schedule" && scheduleQuery.data) {
      // User is selecting a class time
      const lowerInput = userInput.toLowerCase();
      const selectedClass = scheduleQuery.data.find(
        (c) =>
          lowerInput.includes(c.dayOfWeek.toLowerCase()) ||
          lowerInput.includes(c.startTime.toLowerCase())
      );

      if (selectedClass) {
        const classTime = `${selectedClass.dayOfWeek} at ${selectedClass.startTime}`;
        setFlowState((prev) => ({
          ...prev,
          selectedClassTime: classTime,
          step: "get_name",
        }));

        const response = "Great choice. What's the best name for the booking?";
        setCurrentText(response);
        await speakText(response);
        
        // Automatically start listening for name
        setTimeout(() => {
          startRecording();
        }, 500);
        return;
      }
    }

    // Use voice flow handler for other steps
    const { response, nextStep, updatedState } = generateVoiceResponse(
      flowState,
      userInput
    );

    // Update state
    setFlowState((prev) => ({
      ...prev,
      ...updatedState,
      step: nextStep,
    }));

    // Speak response and then automatically start listening again
    if (response) {
      setCurrentText(response);
      await speakText(response);
      
      // Automatically start listening for next response (unless conversation is complete)
      if (nextStep !== "complete") {
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    }

    // If we reached completion, submit the trial signup
    if (nextStep === "complete") {
      try {
        await submitTrialMutation.mutateAsync({
          name: flowState.name || "",
          email: flowState.email || "no-email@placeholder.com",
          phone: flowState.phone || "",
          program: (flowState.program || "Not Sure") as "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "After School" | "Not Sure",
          location: "Tomball HQ",
          preferredContactMethod: "text",
          message: `Voice chat booking. Age: ${flowState.age}, Student type: ${flowState.studentType}, Class time: ${flowState.selectedClassTime}`,
        });
        toast.success("Booking confirmed!");
      } catch (error) {
        console.error("[VoiceChat] Booking error:", error);
        toast.error("Booking failed. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 z-50 flex flex-col items-center justify-center p-4">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Animated orb */}
      <div className="relative mb-12">
        <div
          className={`w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 ${
            isSpeaking || isRecording
              ? "animate-pulse shadow-2xl shadow-purple-500/50"
              : ""
          } transition-all duration-300`}
        />
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white/20 animate-ping" />
          </div>
        )}
      </div>

      {/* Current text display */}
      <div className="max-w-2xl text-center mb-12">
        <p className="text-white text-2xl font-medium leading-relaxed">
          {currentText}
        </p>
      </div>

      {/* Status indicator */}
      <div className="mb-8 text-white/70 text-lg text-center font-medium">
        {isRecording && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>Listening...</span>
          </div>
        )}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span>Kai is speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
