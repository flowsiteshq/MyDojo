import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { X, Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceChatProps {
  onClose: () => void;
}

export function VoiceChat({ onClose }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentText, setCurrentText] = useState("Hello I'm Kai with MyDojo, are you interested in one of our kids programs or are you interested in a program for yourself?");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const textToSpeechMutation = trpc.ai.textToSpeech.useMutation();
  const transcribeMutation = trpc.ai.transcribeAudio.useMutation();

  // Speak the initial greeting
  useEffect(() => {
    speakText(currentText);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('[VoiceChat] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      console.log('[VoiceChat] Microphone access granted');
      
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
        console.log('[VoiceChat] Recording stopped, processing audio...');
        await processRecording();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording... Speak now!');
      console.log('[VoiceChat] Recording started');

      // Start silence detection
      detectSilence();
      
    } catch (error) {
      console.error('[VoiceChat] Microphone access error:', error);
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
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = Math.abs(dataArray[i] - 128);
        sum += value;
      }
      const average = sum / bufferLength;
      
      // Silence threshold (adjust as needed)
      const silenceThreshold = 2;
      
      if (average < silenceThreshold) {
        // Silence detected
        if (!silenceTimerRef.current) {
          console.log('[VoiceChat] Silence detected, starting timer...');
          silenceTimerRef.current = setTimeout(() => {
            console.log('[VoiceChat] Auto-stopping after 2 seconds of silence');
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
      if (isRecording) {
        requestAnimationFrame(checkAudioLevel);
      }
    };
    
    checkAudioLevel();
  };

  const stopRecording = () => {
    console.log('[VoiceChat] Stopping recording...');
    
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
      console.log('[VoiceChat] No audio recorded');
      toast.error('No audio recorded. Please try again.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create blob from recorded chunks
      const mimeType = audioChunksRef.current[0].type;
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log('[VoiceChat] Audio blob created:', audioBlob.size, 'bytes, type:', mimeType);

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

      console.log('[VoiceChat] Sending audio to server for transcription...');
      
      // Send to server for transcription
      const result = await transcribeMutation.mutateAsync({
        audioBlob: base64Audio,
        mimeType: mimeType,
      });

      console.log('[VoiceChat] Transcription result:', result);
      
      if (result.text && result.text.trim()) {
        setCurrentText(result.text);
        handleUserInput(result.text);
      } else {
        toast.error('Could not understand. Please try again.');
      }
      
    } catch (error) {
      console.error('[VoiceChat] Transcription error:', error);
      toast.error('Transcription failed. Please try again.');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleUserInput = async (text: string) => {
    // Here you would call your AI to get a response
    // For now, we'll use a simple echo response
    const response = `I heard you say: "${text}". How can I help you with that?`;
    
    setTimeout(() => {
      setCurrentText(response);
      speakText(response);
    }, 500);
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await textToSpeechMutation.mutateAsync({ text });
      
      if (response.audio) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(response.audio), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Header */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">MD</span>
        </div>
        <div>
          <div className="text-white font-semibold">MyDojo Assistant</div>
          <div className="text-white/60 text-sm">Voice Chat</div>
        </div>
      </div>

      {/* Animated Orb */}
      <div className="relative flex items-center justify-center mb-12">
        {/* Outer glow rings */}
        <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
          isSpeaking 
            ? 'animate-pulse-slow bg-gradient-to-r from-pink-500/20 to-purple-600/20 blur-3xl scale-150' 
            : 'bg-gradient-to-r from-pink-500/10 to-purple-600/10 blur-2xl'
        }`} style={{ width: '400px', height: '400px' }}></div>
        
        {/* Main orb */}
        <div className={`relative w-64 h-64 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 transition-all duration-500 ${
          isRecording ? 'scale-110 shadow-2xl shadow-pink-500/50' : 
          isSpeaking ? 'scale-105 shadow-xl shadow-purple-500/50' : 
          'scale-100'
        }`}>
          {/* Inner glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-80 blur-md"></div>
          
          {/* Processing spinner */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-16 w-16 text-white animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Text Display */}
      <div className="max-w-2xl px-8 text-center mb-12">
        <p className="text-white text-xl leading-relaxed">
          {currentText}
        </p>
      </div>

      {/* Microphone Button */}
      <button
        onClick={toggleRecording}
        disabled={isProcessing || isSpeaking}
        className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 scale-110' 
            : 'bg-white/10 hover:bg-white/20'
        } ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isRecording ? (
          <MicOff className="h-10 w-10 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        ) : (
          <Mic className="h-10 w-10 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm whitespace-nowrap">
            Recording...
          </span>
        )}
        {!isRecording && !isProcessing && !isSpeaking && (
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm whitespace-nowrap">
            Tap to speak
          </span>
        )}
        {isProcessing && (
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 text-sm whitespace-nowrap">
            Processing...
          </span>
        )}
      </button>
    </div>
  );
}
