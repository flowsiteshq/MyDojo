import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";
import { Cake, Trophy, Flame, Star, Phone, User, Ticket, Search } from "lucide-react";
import { soundManager } from "@/lib/soundManager";
import { KioskAdminLock } from "@/components/KioskAdminLock";
import { KioskDayPass } from "@/components/KioskDayPass";
import { KioskEnrollQR } from "@/components/KioskEnrollQR";

type KioskScreen = "idle" | "identification" | "confirmation" | "success" | "dayPass" | "enroll";
type IdentificationMethod = "qr" | "phone" | "name";

// Instructor mapping based on program
const getInstructorForProgram = (program: string): string => {
  switch (program) {
    case "Little Ninjas":
      return "Coach Kleila Mari";
    case "Dragon Kids":
      return "Sensei Kamil Ahmed";
    case "Teens":
    case "Adult Karate":
      return "Master Vincent Holmes";
    case "Kickboxing":
      return "Coach Kleila Mari";
    default:
      return "Coach";
  }
};

// Program badge image mapping
const getProgramBadgeUrl = (program: string): string => {
  switch (program) {
    case "Little Ninjas":
      return "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ESkmczpClhJKxFDQ.png";
    case "Dragon Kids":
      return "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/funKzTcFdGOQArzF.png";
    case "Teens":
      return "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/TPPIUolivyVknkLH.png";
    case "Adult Karate":
      return "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/cuJFixEWGavvvLdK.png";
    case "Kickboxing":
      return "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/oVEoMfobDkFAgOJb.png";
    default:
      return "";
  }
};

// Program background image mapping for class cards
const getProgramBackgroundUrl = (program: string): string => {
  switch (program) {
    case "Little Ninjas":
      return "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/AegQdZAAJyWcEYeAgGKEQH-img-1_1772115646000_na1fn_bGl0dGxlLW5pbmphcy1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L0FlZ1FkWkFBSnlXY0VZZUFnR0tFUUgtaW1nLTFfMTc3MjExNTY0NjAwMF9uYTFmbl9iR2wwZEd4bExXNXBibXBoY3kxaVp3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=wGj~pOIRUc0-VPbwezuWfXnJka2DLkQ8qybSMM2pXFP3goS1Pu5SVwUt2WAEXrsoFKEPmRi1mzEHYw7kNBsO9SQkSCwIxMNwEdkSy-3GMruv1B26BEwYDkqKWXXsd-tv6Hevl634pxVtNw7st2S91rk30tqXvtUaqF~pfG6ZhRqODVj784paVUU0ujr0CynRXp1AzGS9u3Ce95CGvkUj1IqpwWkpByBhjBusdBNl4dwNAonwKX61egGYK2C1UnsNAGGU7UmneGJBbYhNWYQioE8xZh-izmLzOEQnNeiwqV3LHDS2bqLypsecyvdEZ3Y8nkDvj1uEP-GocrDrHE5ZWA__";
    case "Dragon Kids":
      return "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/AegQdZAAJyWcEYeAgGKEQH-img-2_1772115646000_na1fn_ZHJhZ29uLWtpZHMtYmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L0FlZ1FkWkFBSnlXY0VZZUFnR0tFUUgtaW1nLTJfMTc3MjExNTY0NjAwMF9uYTFmbl9aSEpoWjI5dUxXdHBaSE10WW1jLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=pGgk71sRg7gw3lAO4XlQPLQF9Lj8X2XXKXjIKxjZc3pXIsnVNOVK4KlKOL2fc~BEiK3Q1X1ct91Y~rDn-w-tnG8~wlmt9l6v1TCnQwZzL-ymXpfP2l3TW9dtD~SuIMs2ET4hJy3W1Q54bj5hPLWO2E2JMaV8ICIibygHWJ3VQgKYtaIpWMRk2Ss74NjCd7f2Ir1i1l9xr6GZynDssyc786k0VpD7PITGnhVc6xvpFoCrJYY28dClPosO88NXAyEFg1K8LsyIeK87MLuapKGC9m89oFLx6SbniwL1gd3xXMa1k7q9gkkDq5FbSQT0Y317RnlGL776jGeH282ERuV-SQ__";
    case "Teens":
      return "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/AegQdZAAJyWcEYeAgGKEQH-img-3_1772115637000_na1fn_dGVlbnMtYmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L0FlZ1FkWkFBSnlXY0VZZUFnR0tFUUgtaW1nLTNfMTc3MjExNTYzNzAwMF9uYTFmbl9kR1ZsYm5NdFltYy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=nC3FH6V2UWuhI6Di3B4LLzBAAR1J0q0O~zL~KhTU61az9fCsCjsX7s8BUeRG7jHEL2rNxcCqp-EMybwd-8cxhvHS1-UR4UxCeZGCq7i0nYHKgeDIK~u3XGUKK4tPVMDcCSRlsp2o8~N85SXsWetlpAhUuU31B35dwfsAy~KLQgD2oWiU4WojmQP1b0gkYWrwNWN1p6TpghCB2k3Cz3UooRSkvT1RqHaO3qn6gw0E2J01oRXBCMZv1DUYhvkTetQZvGA8nwkq8p0rKyN5q6nCwuR34Y4yq1cY2QaTqaCjxxEEjJWSxTKPrC9PNjQN5ipdsD-M5OqAxaQVive2nhhitA__";
    case "Adult Karate":
      return "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/AegQdZAAJyWcEYeAgGKEQH-img-4_1772115650000_na1fn_YWR1bHQta2FyYXRlLWJn.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L0FlZ1FkWkFBSnlXY0VZZUFnR0tFUUgtaW1nLTRfMTc3MjExNTY1MDAwMF9uYTFmbl9ZV1IxYkhRdGEyRnlZWFJsTFdKbi5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Ui8MXb~-N6W1qrcV4p1S4VGLqwtqzzLo3sZ2IWAf4UnHK8T0VlN3JJLmgJiqnAKYqpuEs0C44-n7m-RTD~ZHQpaoj8HdLZJZY6iXp2Ye3rvKWKkMifiy0JtA8gZjAKrsscK48AFaP7l5iS-Tvk~SELM0kVkPMT0gnkh74nQq4J6tyxStigevTC7q0qSs-5-CtaUBVt7xxDr9x3gNcsEyVaDufn7TPn1YzOYq9vt924oXAMoEjOiCHDKJ4Nsl5~pZjQnHZAfSw8lqT6fCqufXOuuBAd1YPhKWxTWifRkwqm6XNgl1CfPudMvKywly5QXiShZcVtG~3qDRjynTXD21qA__";
    case "Kickboxing":
      return "https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/AegQdZAAJyWcEYeAgGKEQH-img-5_1772115649000_na1fn_a2lja2JveGluZy1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L0FlZ1FkWkFBSnlXY0VZZUFnR0tFUUgtaW1nLTVfMTc3MjExNTY0OTAwMF9uYTFmbl9hMmxqYTJKdmVHbHVaeTFpWncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=djMcjl6U~ZpQkjGyRdRlaa-RpzZiABIsWhBz25NkRKOMCZ0DhD8Et5YCf5V4E7mTlLW6b6gbQ~GMQ859iTk4iCzZ5pGCBJsbaNM7npAvwoT4R5z0cEbViqvXRo70EYGQfNBYIOCu7Z7qdyo59EAg2B77s0KgAM25anRnQ-n0rIYyIEL1gqdOinEMu0WZSX4e3OSa-k6p2WMEmw2HpOk~E237po5X19ThHsbS2ZAzcxZZUeTeHLn~WuTQ5vyMiSYLhuR4t6nuDkIWU3JwVXTBv3jV-YgGkL85TKVruDshgUCzeTqVo7mcky92AP~~En1pwyU8mYVRmID8iydaHUbRyw__";
    default:
      return "";
  }
};

export default function KioskCheckIn() {
  const [screen, setScreen] = useState<KioskScreen>("idle");
  const [identMethod, setIdentMethod] = useState<IdentificationMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);
  const [checkedInStudent, setCheckedInStudent] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Store utils reference at component level (required by Rules of Hooks)
  const utils = trpc.useUtils();

  // Fetch data
  const { data: perfectAttendance } = trpc.kiosk.getPerfectAttendance.useQuery();
  const { data: runnerUpForBelt } = trpc.kiosk.getRunnerUpForNextBelt.useQuery();
  const { data: birthdayStudents } = trpc.kiosk.getBirthdayStudents.useQuery();
  const { data: todayClasses } = trpc.kiosk.getTodayClassSchedule.useQuery();
  const { data: introAppointments } = trpc.kiosk.getTodayIntroAppointments.useQuery();
  const { data: todaysScheduledClasses, isLoading: classesLoading } = trpc.kiosk.getTodaysClasses.useQuery({});

  // Mutations
  const checkInMutation = trpc.kiosk.checkIn.useMutation({
    onSuccess: (result) => {
      // Invalidate queries to refresh leaderboards
      utils.kiosk.getPerfectAttendance.invalidate();
      utils.kiosk.getRunnerUpForNextBelt.invalidate();
      
      // Populate checked-in student data for success screen
      setCheckedInStudent({
        name: selectedStudent?.name || "Student",
        program: selectedClass?.program || "Class",
        currentStreak: result.newStreak || 0,
        xpEarned: result.xpAwarded || 10,
        isBirthday: result.isBirthday || false,
        alreadyCheckedIn: result.alreadyCheckedIn || false,
      });
      
      // Show success state
      setScreen("success");
      
      // Set countdown for auto-return
      setCountdownSeconds(5);
    },
    onError: (error) => {
      console.error("Check-in failed:", error);
      alert("Check-in failed. Please try again or see staff for assistance.");
    }
  });
  const introCheckInMutation = trpc.kiosk.introCheckIn.useMutation();

  const handlePhoneSearch = async () => {
    if (!phoneNumber.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const result = await utils.kiosk.searchByPhone.fetch({ phone: phoneNumber.trim() });
      if (result) {
        // Phone search returns a single enrollment
        const student = {
          id: result.id,
          name: result.studentName || result.customerName,
          beltRank: result.beltRank,
          photoUrl: result.photoUrl,
        };
        setSelectedStudent(student);
        setScreen('confirmation');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'No account found for this phone number. Please see staff.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNameSearch = async () => {
    if (!searchName.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const results = await utils.kiosk.searchByName.fetch({ name: searchName.trim() });
      if (results && results.length > 0) {
        setSearchResults(results.map((e: any) => ({
          id: e.id,
          name: e.studentName || e.customerName,
          beltRank: e.beltRank,
          photoUrl: e.photoUrl,
        })));
      } else {
        setSearchError('No students found with that name. Please try again or see staff.');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-reset to idle after 30 seconds
  useEffect(() => {
    if (screen === "success") {
      const timer = setTimeout(() => {
        handleReset();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Countdown timer
  useEffect(() => {
    if (countdownSeconds > 0) {
      const timer = setTimeout(() => setCountdownSeconds(countdownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdownSeconds]);

  const handleReset = () => {
    setScreen("idle");
    setIdentMethod(null);
    setPhoneNumber("");
    setSearchName("");
    setSelectedStudent(null);
    setSelectedClass(null);
    setCountdownSeconds(0);
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
  };

  const handleVolumeChange = (volume: number) => {
    soundManager.setVolume(volume);
  };

  const handleCheckIn = async () => {
    if (!selectedStudent) return;
    // If no class selected, use a generic fallback
    const classToUse = selectedClass || { id: null, program: 'Open Training', startTime: '', instructor: '' };

    try {
      if ((selectedStudent as any)._type === 'lead') {
        // Lead check-in: use introCheckIn which logs attendance and updates pipeline stage
        await introCheckInMutation.mutateAsync({
          trialSignupId: selectedStudent.id,
          classScheduleId: classToUse.id || 0,
        });
      } else {
        await checkInMutation.mutateAsync({
          enrollmentId: selectedStudent.id,
          classId: classToUse.id,
          programType: classToUse.program,
          notes: `Check-in via kiosk for ${classToUse.program} class at ${classToUse.startTime}`,
        });
      }
      // Success handling is done in onSuccess callback
    } catch (error) {
      console.error("Check-in failed:", error);
      // Error handling is done in onError callback
    }
  };

  // ENROLL SCREEN
  if (screen === "enroll") {
    return <KioskEnrollQR onClose={() => setScreen("idle")} />;
  }

  // DAY PASS SCREEN
  if (screen === "dayPass") {
    return (
      <KioskDayPass
        onClose={() => setScreen("idle")}
        preSelectedClass={selectedClass}
      />
    );
  }

  // IDLE SCREEN - BREATHTAKING PREMIUM DESIGN
  if (screen === "idle") {
    return (
      <>
        <KioskAdminLock onVolumeChange={handleVolumeChange} onReset={handleReset} />
        
        {/* DRAMATIC RED NEBULA BACKGROUND */}
        <div className="min-h-screen w-screen relative overflow-hidden">
          {/* Background Image - Dramatic Red Nebula */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/QpMQgPXlSP73mBxske9Snp/sandbox/FGsxKciXpNpJlSRrScvMt0-img-1_1772110990000_na1fn_a2lvc2stcmVkLW5lYnVsYS1iZw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUXBNUWdQWGxTUDczbUJ4c2tlOVNucC9zYW5kYm94L0ZHc3hLY2lYcE5wSmxTUnJTY3ZNdDAtaW1nLTFfMTc3MjExMDk5MDAwMF9uYTFmbl9hMmx2YzJzdGNtVmtMVzVsWW5Wc1lTMWlady5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=hipaIDZqVK2sQxqaq0JENrgwbXOvHiuyiyHz8BTF7B1w6p7VkPmbXvRHLTxus5liM2l60-qpw3U8dT96D5V5sCraiJz9uOWvAOM7n2Q01Ws2qb8rVMIJuSo5xl5YwB7hYV169GFU7pwslyy~cPwu2zFLGPDRjY5JzEmA2Eemc4DaOuTaCgKRSZ5uuowY8IlvFsFcNWcO3HZHU8zen6tqIFpyEd0ZUHO2gIG4-qq1pV-vVW627e6YlMAuUf5rO43t-IBJRsx-QFTLUPaZIpHx3CDxLP4f-DbmJpBdY0pewZLkCdUcFYSttbvGlHD4YnFJugx9eROvdTbEuHg1wAkhhg__')` 
            }}
          />
          
          {/* Floating Particles Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-orange-500 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                  opacity: Math.random() * 0.7 + 0.3,
                }}
              />
            ))}
          </div>
          
          {/* Content Container */}
          <div className="relative z-10 min-h-screen flex flex-col p-8">
            
            {/* HERO SECTION - Top Center */}
            <div className="flex flex-col items-center justify-center pt-8 pb-6">
              {/* MyDojo Circular Logo - Prominent */}
              <img 
                src="/images/logo-circular.png" 
                alt="MYDOJO" 
                className="h-32 w-32 mb-8 drop-shadow-[0_0_40px_rgba(225,6,0,0.9)] animate-pulse"
              />
              
              {/* Headline with Intense Glow */}
              <div className="relative mb-3">
                <h1 className="relative z-10 text-7xl font-black text-white text-center tracking-tight drop-shadow-[0_0_40px_rgba(225,6,0,0.9)]">
                  READY TO TRAIN 👊
                </h1>
              </div>
              
              {/* Subtext */}
              <p className="text-xl text-white/70 font-medium drop-shadow-lg">Tap or Scan to Begin</p>
            </div>

            {/* WELCOME NEW STUDENTS BANNER */}
            {introAppointments && introAppointments.length > 0 && (
              <div className="max-w-4xl mx-auto w-full mb-6">
                <div 
                  className="bg-gradient-to-br from-[#E10600]/30 via-purple-600/30 to-purple-900/30 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#E10600]/60 relative overflow-hidden"
                  style={{
                    boxShadow: '0 0 60px rgba(225, 6, 0, 0.6), inset 0 0 60px rgba(225, 6, 0, 0.1)'
                  }}
                >
                  {/* Intense Glow Border Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#E10600]/20 via-orange-500/20 to-yellow-500/20 blur-xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl drop-shadow-lg">⭐</span>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase drop-shadow-lg">WELCOME NEW STUDENTS!</h3>
                        <p className="text-sm text-white/80">We're excited to have you here for your first lesson</p>
                      </div>
                    </div>
                    {introAppointments.slice(0, 3).map((appt, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/15 backdrop-blur-md rounded-xl p-4 mb-2 border border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {appt.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white">{appt.name}</p>
                            <p className="text-sm text-white/70">{appt.program} • {appt.scheduledTime ? new Date(appt.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD'}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-black rounded-full uppercase shadow-lg">NEW STUDENT</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MAIN CHECK-IN BUTTON - MASSIVE AND GLOWING */}
            <div className="max-w-3xl mx-auto w-full mb-8">
              <button
                onClick={() => setScreen("identification")}
                className="w-full group relative overflow-hidden rounded-3xl p-1 transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #E10600 0%, #FF4500 50%, #E10600 100%)',
                  boxShadow: '0 0 80px rgba(225, 6, 0, 0.9), 0 0 120px rgba(225, 6, 0, 0.6), inset 0 0 40px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Animated Glow Pulse */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                
                <div className="relative bg-gradient-to-br from-[#E10600] to-[#C10500] rounded-3xl py-8 px-12">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-5xl animate-pulse">🔥</span>
                    <span className="text-5xl font-black text-white uppercase tracking-wider drop-shadow-2xl">
                      TAP TO CHECK IN
                    </span>
                    <span className="text-5xl animate-pulse">🔥</span>
                  </div>
                </div>
              </button>
            </div>

            {/* DAY PASS BUTTON */}
            <div className="max-w-3xl mx-auto w-full mb-3">
              <button
                onClick={() => setScreen("dayPass")}
                className="w-full group relative overflow-hidden rounded-2xl p-px transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                  boxShadow: '0 0 30px rgba(255,255,255,0.15)'
                }}
              >
                <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl py-5 px-10 flex items-center justify-center gap-4 border border-white/20">
                  <Ticket className="w-8 h-8 text-white/80" />
                  <span className="text-2xl font-black text-white uppercase tracking-wider">
                    Buy a Day Pass
                  </span>
                  <span className="ml-auto bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                    Walk-ins Welcome
                  </span>
                </div>
              </button>
            </div>

            {/* ENROLL NOW BUTTON */}
            <div className="max-w-3xl mx-auto w-full mb-6">
              <button
                onClick={() => setScreen("enroll")}
                className="w-full group relative overflow-hidden rounded-2xl p-px transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.5) 0%, rgba(16,185,129,0.3) 100%)',
                  boxShadow: '0 0 30px rgba(34,197,94,0.2)'
                }}
              >
                <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl py-5 px-10 flex items-center justify-center gap-4 border border-green-500/30">
                  <span className="text-3xl">🥋</span>
                  <span className="text-2xl font-black text-white uppercase tracking-wider">
                    Enroll Now
                  </span>
                  <span className="ml-auto bg-green-500/30 text-green-300 text-sm font-bold px-3 py-1 rounded-full border border-green-500/40">
                    Start Today
                  </span>
                </div>
              </button>
            </div>
            {/* ARCADE BUTTON */}
            <div className="max-w-3xl mx-auto w-full mb-6">
              <a
                href="/arcade"
                className="w-full group relative overflow-hidden rounded-2xl p-px transition-all duration-300 hover:scale-105 block"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.5) 0%, rgba(59,130,246,0.3) 100%)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.3)'
                }}
              >
                <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl py-5 px-10 flex items-center justify-center gap-4 border border-purple-500/30">
                  <span className="text-3xl">🎮</span>
                  <span className="text-2xl font-black text-white uppercase tracking-wider">
                    Play Arcade Games
                  </span>
                  <span className="ml-auto bg-purple-500/30 text-purple-300 text-sm font-bold px-3 py-1 rounded-full border border-purple-500/40">
                    4 Games
                  </span>
                </div>
              </a>
            </div>

            {/* STAFF CLOCK-IN SHORTCUT */}
            <div className="max-w-3xl mx-auto w-full mb-4">
              <a
                href="/staff-clock-in"
                className="w-full group relative overflow-hidden rounded-xl p-px transition-all duration-300 hover:scale-105 block"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.4) 0%, rgba(234,88,12,0.3) 100%)',
                  boxShadow: '0 0 20px rgba(251,191,36,0.15)'
                }}
              >
                <div className="relative bg-black/50 backdrop-blur-xl rounded-xl py-3 px-8 flex items-center justify-center gap-3 border border-yellow-500/25">
                  <span className="text-xl">⏱️</span>
                  <span className="text-base font-bold text-yellow-200/80 uppercase tracking-widest">
                    Staff Clock In / Out
                  </span>
                </div>
              </a>
            </div>
            {/* Check-in Notice */}
            <p className="text-center text-white/60 text-sm mb-6">Check-in opens 15 minutes before class.</p>

            {/* BOTTOM GRID - TOP WARRIORS & GAMIFICATION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1600px] mx-auto w-full">
              
              {/* LEFT COLUMN - TOP WARRIORS (Class List) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Flame className="w-8 h-8 text-[#E10600] drop-shadow-[0_0_10px_rgba(225,6,0,0.8)]" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-wide drop-shadow-lg">TOP WARRIORS</h2>
                  <span className="text-white/50 text-sm">Current Begin</span>
                </div>
                
                {/* Class Cards - DARKER WITH INTENSE GLOW */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {todayClasses && todayClasses.map((cls, idx) => {
                    const now = new Date();
                    const startTime = cls.startTime;
                    const classTime = new Date();
                    const [hours, minutes] = startTime.match(/(\d+):(\d+)/)?.slice(1) || [];
                    const isPM = startTime.includes('PM');
                    classTime.setHours(isPM && hours !== '12' ? parseInt(hours) + 12 : parseInt(hours), parseInt(minutes), 0);
                    
                    const diffMs = classTime.getTime() - now.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const isOpen = diffMins <= 15 && diffMins >= 0;
                    const opensIn = diffMins > 0 ? diffMins : 0;

                    return (
                      <div 
                        key={idx}
                        className="group relative rounded-2xl p-5 border-2 border-[#E10600]/40 hover:border-[#E10600]/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                        style={{
                          boxShadow: '0 0 30px rgba(225, 6, 0, 0.3), inset 0 0 20px rgba(225, 6, 0, 0.05)'
                        }}
                      >
                        {/* Background Image */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                          style={{
                            backgroundImage: `url(${getProgramBackgroundUrl(cls.program)})`,
                          }}
                        />
                        {/* Dark Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/60" />
                        {/* Intense Glow on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#E10600]/0 via-[#E10600]/15 to-[#E10600]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10 flex items-center gap-4">
                          {/* Program Badge Image */}
                          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#E10600]/30 bg-black flex items-center justify-center">
                            {getProgramBadgeUrl(cls.program) ? (
                              <img 
                                src={getProgramBadgeUrl(cls.program) || undefined} 
                                alt={cls.program}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white/60 text-xs font-bold text-center leading-tight px-1">{cls.program?.charAt(0)}</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-black text-white uppercase mb-1">{cls.program}</h3>
                            <div className="flex items-center gap-2 text-sm text-white/70 mb-1">
                              <span>👤</span>
                              <span className="font-semibold">{getInstructorForProgram(cls.program)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <span>⏰</span>
                              <span>{startTime} - {cls.endTime}</span>
                              <span className="mx-1">•</span>
                              <span>📍</span>
                              <span>{cls.location || 'Tomball HQ'}</span>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            {isOpen ? (
                              <span 
                                className="inline-block px-4 py-2 rounded-full bg-[#E10600] text-white text-xs font-black uppercase shadow-lg"
                                style={{ boxShadow: '0 0 20px rgba(225, 6, 0, 0.8)' }}
                              >
                                OPEN NOW
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20">
                                <span className="text-white/70 text-xs font-bold">Opens in</span>
                                <span className="text-white text-sm font-black">{opensIn}m</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN - DOJO-WIDE ACHIEVEMENT CARDS */}
              <div className="space-y-4">
                
                {/* PERFECT ATTENDANCE STREAK CARD */}
                <div 
                  className="bg-black/60 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#E10600]/40 relative overflow-hidden"
                  style={{
                    boxShadow: '0 0 40px rgba(225, 6, 0, 0.4), inset 0 0 30px rgba(225, 6, 0, 0.05)'
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Flame className="w-8 h-8 text-[#E10600] drop-shadow-[0_0_10px_rgba(225,6,0,0.8)]" />
                      <h3 className="text-lg font-black text-white uppercase">Perfect Attendance</h3>
                    </div>
                    
                    {/* Top 3 Students with Perfect Attendance */}
                    <div className="space-y-3">
                      {perfectAttendance && perfectAttendance.length > 0 ? (
                        perfectAttendance.slice(0, 3).map((student, index) => {
                          const medalColors = [
                            { from: "yellow-400", to: "yellow-600" },
                            { from: "gray-300", to: "gray-500" },
                            { from: "orange-400", to: "orange-600" },
                          ];
                          const color = medalColors[index];
                          const isFirst = index === 0;
                          
                          return (
                            <div 
                              key={student.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                isFirst 
                                  ? 'bg-gradient-to-r from-[#E10600]/20 to-transparent border border-[#E10600]/30'
                                  : 'bg-black/20 border border-white/10'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${color.from} to-${color.to} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-bold text-sm">{student.customerName}</p>
                                <p className="text-white/60 text-xs">{student.currentStreak} Classes Straight</p>
                              </div>
                              {isFirst && <Flame className="w-5 h-5 text-[#E10600]" />}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-white/60 text-sm">No attendance data yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* RUNNER UP FOR NEXT BELT CARD */}
                <div 
                  className="bg-black/60 backdrop-blur-xl rounded-3xl p-6 border-2 border-yellow-500/40 relative overflow-hidden"
                  style={{
                    boxShadow: '0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(255, 215, 0, 0.05)'
                  }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
                      <h3 className="text-lg font-black text-white uppercase">Runner Up for Next Belt</h3>
                    </div>
                    
                    {/* Students Close to Belt Promotion (15+ classes) */}
                    <div className="space-y-3">
                      {runnerUpForBelt && runnerUpForBelt.length > 0 ? (
                        runnerUpForBelt.slice(0, 3).map((student, index) => {
                          const isFirst = index === 0;
                          // Get belt abbreviation (first 3 letters)
                          const beltAbbr = student.beltRank?.substring(0, 3).toUpperCase() || "NO";
                          // Calculate next belt (simplified)
                          const nextBelt = "Next Belt";
                          const classesNeeded = 20;
                          
                          return (
                            <div 
                              key={student.id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                isFirst 
                                  ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30'
                                  : 'bg-black/20 border border-white/10'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center border-2 border-orange-400 shadow-lg">
                                <span className="text-white text-[10px] font-black">{beltAbbr}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-bold text-sm">{student.customerName}</p>
                                <p className="text-white/60 text-xs">{student.classesAtCurrentBelt}/{classesNeeded} classes to {nextBelt}</p>
                              </div>
                              {isFirst && <Trophy className="w-5 h-5 text-yellow-500" />}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-white/60 text-sm">No students close to promotion yet</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>


      </>
    );
  }

  // IDENTIFICATION SCREEN
  if (screen === "identification") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-8">
        {/* Red Nebula Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://cdn.manus.space/manus-public-assets-us/8b8c6b96-7e7c-4c3c-8e7c-5e8e8e8e8e8e.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        />
        
        {/* Radial Light Burst Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(225,6,0,0.3) 0%, rgba(0,0,0,0.8) 70%)'
          }}
        />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-orange-500/60 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>
        
        <Card className="relative z-10 max-w-2xl w-full p-8 bg-black/60 backdrop-blur-xl border-2 border-[#E10600]/60" style={{
          boxShadow: '0 0 60px rgba(225, 6, 0, 0.6), inset 0 0 60px rgba(225, 6, 0, 0.1)'
        }}>
          <h2 className="text-4xl font-black text-white mb-8 text-center drop-shadow-[0_0_40px_rgba(225,6,0,0.9)]">HOW WOULD YOU LIKE TO CHECK IN?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            
            <button
              onClick={() => setIdentMethod("phone")}
              className={`p-8 rounded-2xl border-2 transition-all hover:scale-105 ${
                identMethod === "phone"
                  ? "border-[#E10600] bg-[#E10600]/30"
                  : "border-[#E10600]/40 bg-black/40 hover:bg-black/60"
              }`}
              style={identMethod === "phone" ? {
                boxShadow: '0 0 40px rgba(225, 6, 0, 0.8), inset 0 0 20px rgba(225, 6, 0, 0.2)'
              } : {
                boxShadow: '0 0 20px rgba(225, 6, 0, 0.3)'
              }}
            >
              <Phone className="w-16 h-16 mx-auto mb-4 text-white drop-shadow-lg" />
              <p className="text-white font-bold text-center drop-shadow-lg">Phone Number</p>
            </button>
            
            <button
              onClick={() => setIdentMethod("name")}
              className={`p-8 rounded-2xl border-2 transition-all hover:scale-105 ${
                identMethod === "name"
                  ? "border-[#E10600] bg-[#E10600]/30"
                  : "border-[#E10600]/40 bg-black/40 hover:bg-black/60"
              }`}
              style={identMethod === "name" ? {
                boxShadow: '0 0 40px rgba(225, 6, 0, 0.8), inset 0 0 20px rgba(225, 6, 0, 0.2)'
              } : {
                boxShadow: '0 0 20px rgba(225, 6, 0, 0.3)'
              }}
            >
              <User className="w-16 h-16 mx-auto mb-4 text-white drop-shadow-lg" />
              <p className="text-white font-bold text-center drop-shadow-lg">Name Search</p>
            </button>
          </div>

          {identMethod === "phone" && (
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePhoneSearch()}
                className="text-2xl p-6 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                autoFocus
              />
              {searchError && (
                <p className="text-red-400 text-center text-lg font-semibold">{searchError}</p>
              )}
              <Button
                onClick={handlePhoneSearch}
                disabled={isSearching || !phoneNumber.trim()}
                className="w-full bg-[#E10600] hover:bg-[#C10500] text-white text-xl py-6 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Find My Account'}
              </Button>
            </div>
          )}

          {identMethod === "name" && (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter your name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSearch()}
                className="text-2xl p-6 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                autoFocus
              />
              {searchError && (
                <p className="text-red-400 text-center text-lg font-semibold">{searchError}</p>
              )}
              <Button
                onClick={handleNameSearch}
                disabled={isSearching || !searchName.trim()}
                className="w-full bg-[#E10600] hover:bg-[#C10500] text-white text-xl py-6 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <p className="text-white/70 text-sm text-center mb-2">Select your name:</p>
                  {searchResults.map((student) => (
                    <button
                      key={(student._type === 'lead' ? 'lead-' : 'student-') + student.id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setScreen('confirmation');
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#E10600]/60 transition-all text-left"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${student._type === 'lead' ? 'bg-amber-500' : 'bg-[#E10600]'}`}>
                        {student.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{student.name}</p>
                        {student._type === 'lead' ? (
                          <p className="text-amber-400 text-sm font-medium">Guest / Intro — {student.programType || 'Martial Arts'}</p>
                        ) : (
                          student.beltRank && <p className="text-white/60 text-sm">{student.beltRank}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}



          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full mt-6 border-[#E10600]/60 text-white hover:bg-[#E10600]/20 transition-all"
            style={{
              boxShadow: '0 0 20px rgba(225, 6, 0, 0.3)'
            }}
          >
            Back
          </Button>

          {/* Day Pass link for walk-ins */}
          <button
            onClick={() => setScreen("dayPass")}
            className="w-full mt-3 py-3 rounded-xl text-white/60 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 transition-all bg-transparent"
          >
            <Ticket className="w-4 h-4" />
            Not a member? Buy a Day Pass
          </button>
        </Card>
      </div>
    );
  }

  // CONFIRMATION SCREEN - Student found, confirm and check in
  if (screen === "confirmation") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-8">
        {/* Red Nebula Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(ellipse at center bottom, rgba(180,10,10,0.7) 0%, rgba(30,0,0,0.95) 60%, #0a0000 100%)'
          }}
        />
        {/* Floating Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-orange-500/60 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
              }}
            />
          ))}
        </div>

        <Card className="relative z-10 max-w-lg w-full p-10 bg-black/70 backdrop-blur-xl border-2 border-[#E10600]/60 text-center" style={{
          boxShadow: '0 0 60px rgba(225,6,0,0.5), inset 0 0 40px rgba(225,6,0,0.08)'
        }}>
          {/* Logo */}
          <img src="/images/logo-circular.png" alt="MyDojo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />

          {/* Student Avatar */}
          <div
            className="w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl font-black text-white border-4 border-[#E10600]"
            style={{ background: 'linear-gradient(135deg, #E10600 0%, #8B0000 100%)', boxShadow: '0 0 30px rgba(225,6,0,0.6)' }}
          >
            {selectedStudent?.photoUrl ? (
              <img src={selectedStudent.photoUrl} alt={selectedStudent.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              selectedStudent?.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </div>

          {/* Student Name */}
          <h2 className="text-4xl font-black text-white mb-1 drop-shadow-lg">
            {selectedStudent?.name || 'Student'}
          </h2>
          {selectedStudent?.beltRank && (
            <p className="text-white/60 text-lg mb-6">{selectedStudent.beltRank} Belt</p>
          )}

          {/* Class Info / Class Selector */}
          {selectedClass ? (
            <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Checking into</p>
              <p className="text-white font-bold text-xl">{selectedClass.program}</p>
              <p className="text-white/60 text-sm">{selectedClass.startTime} · {selectedClass.instructor || 'Instructor'}</p>
              <button
                onClick={() => setSelectedClass(null)}
                className="mt-2 text-[#E10600]/80 hover:text-[#E10600] text-sm underline"
              >
                Change class
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-3">Select today's class</p>
              {classesLoading ? (
                <p className="text-white/40 text-sm">Loading classes...</p>
              ) : todaysScheduledClasses && todaysScheduledClasses.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {todaysScheduledClasses.map((cls: any) => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass({ id: cls.id, program: cls.program, startTime: cls.startTime, instructor: cls.instructor })}
                      className="w-full text-left bg-white/10 hover:bg-[#E10600]/30 border border-white/20 hover:border-[#E10600]/60 rounded-xl px-4 py-3 transition-all"
                    >
                      <p className="text-white font-bold">{cls.program}</p>
                      <p className="text-white/60 text-sm">{cls.startTime}{cls.instructor ? ` · ${cls.instructor}` : ''}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-white/60 text-sm">No classes scheduled for today</p>
                  <button
                    onClick={() => setSelectedClass({ id: null, program: 'Open Training', startTime: '', instructor: '' })}
                    className="mt-2 text-[#E10600] text-sm font-semibold underline"
                  >
                    Check in for Open Training
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Check In Button */}
          <button
            onClick={handleCheckIn}
            disabled={checkInMutation.isPending || !selectedClass}
            className="w-full py-6 rounded-2xl text-white text-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
            style={{
              background: checkInMutation.isPending
                ? 'rgba(225,6,0,0.5)'
                : 'linear-gradient(135deg, #E10600 0%, #C10500 100%)',
              boxShadow: checkInMutation.isPending ? 'none' : '0 0 40px rgba(225,6,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            {checkInMutation.isPending ? '⏳ Checking In...' : '✅ CHECK IN'}
          </button>

          {/* Back Button */}
          <button
            onClick={() => { setScreen('identification'); setSelectedStudent(null); }}
            className="w-full mt-4 py-4 rounded-xl text-white/60 hover:text-white text-lg font-semibold border border-white/20 hover:border-white/40 transition-all bg-transparent"
          >
            ← Not you? Go back
          </button>
        </Card>
      </div>
    );
  }

  // SUCCESS SCREEN WITH CONFETTI CELEBRATION
  if (screen === "success") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-8">
        {/* Red Nebula Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://cdn.manus.space/manus-public-assets-us/8b8c6b96-7e7c-4c3c-8e7c-5e8e8e8e8e8e.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        />
        
        {/* Radial Light Burst Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(225,6,0,0.3) 0%, rgba(0,0,0,0.8) 70%)'
          }}
        />
        
        {/* Confetti Particles - 50 pieces with random colors and trajectories */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => {
            const colors = ['#E10600', '#FF4500', '#FFD700', '#FFA500', '#FF6347', '#32CD32', '#00CED1'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomLeft = Math.random() * 100;
            const randomDelay = Math.random() * 2;
            const randomDuration = 3 + Math.random() * 2;
            const randomRotation = Math.random() * 360;
            
            return (
              <div
                key={i}
                className="absolute w-3 h-3 opacity-90"
                style={{
                  left: `${randomLeft}%`,
                  top: '-20px',
                  backgroundColor: randomColor,
                  animation: `confettiFall ${randomDuration}s ease-in ${randomDelay}s forwards`,
                  transform: `rotate(${randomRotation}deg)`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                }}
              />
            );
          })}
        </div>
        
        <Card className="relative z-10 max-w-2xl w-full p-12 bg-black/70 backdrop-blur-xl border-2 text-center"
          style={{
            borderColor: checkedInStudent?.alreadyCheckedIn ? 'rgba(251,191,36,0.6)' : 'rgba(225,6,0,0.6)',
            boxShadow: checkedInStudent?.alreadyCheckedIn
              ? '0 0 80px rgba(251,191,36,0.6), inset 0 0 60px rgba(251,191,36,0.08)'
              : '0 0 80px rgba(225,6,0,0.8), inset 0 0 60px rgba(225,6,0,0.1)'
          }}
        >
          {checkedInStudent?.alreadyCheckedIn ? (
            /* ── ALREADY CHECKED IN STATE ── */
            <>
              <div className="text-9xl mb-6">👋</div>
              <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">
                ALREADY CHECKED IN!
              </h2>
              <p className="text-2xl text-white/90 mb-8 drop-shadow-lg">
                You already checked in today, {checkedInStudent.name?.split(' ')[0]}!<br />
                <span className="text-white/60 text-lg">See you on the mat — enjoy your class!</span>
              </p>

              {/* Student Info */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-yellow-400/30"
                style={{ boxShadow: '0 0 30px rgba(251,191,36,0.3)' }}
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {checkedInStudent.name?.charAt(0) || '?'}
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white drop-shadow-lg">{checkedInStudent.name}</p>
                    <p className="text-sm text-white/70">{checkedInStudent.program}</p>
                  </div>
                </div>

                {/* Current Streak */}
                {checkedInStudent.currentStreak > 0 && (
                  <div className="bg-black/40 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">🔥 Current Streak</p>
                    <p className="text-4xl font-black text-[#FFD700] drop-shadow-lg">{checkedInStudent.currentStreak} Classes</p>
                    <p className="text-yellow-300 text-sm mt-2">Keep it up — you're on a roll!</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── NORMAL CHECK-IN SUCCESS STATE ── */
            <>
              {/* Success Icon with Pulse Animation */}
              <div className="text-9xl mb-6 animate-pulse">
                {checkedInStudent?.isBirthday ? '🎂' : '🎉'}
              </div>
              
              {/* Success Message */}
              <h2 className="text-6xl font-black text-white mb-4"
                style={{ textShadow: checkedInStudent?.isBirthday
                  ? '0 0 40px rgba(251,191,36,0.9)'
                  : '0 0 40px rgba(225,6,0,0.9)'
                }}
              >
                {checkedInStudent?.isBirthday ? 'HAPPY BIRTHDAY!' : 'CHECK-IN SUCCESSFUL!'}
              </h2>
              <p className="text-2xl text-white/90 mb-8 drop-shadow-lg">
                {checkedInStudent?.isBirthday
                  ? `🎉 Happy Birthday, ${checkedInStudent.name?.split(' ')[0]}! Enjoy your special class!`
                  : "You're all set. Have a great class!"}
              </p>

              {/* Birthday Banner */}
              {checkedInStudent?.isBirthday && (
                <div className="bg-gradient-to-r from-yellow-500/30 via-pink-500/30 to-purple-500/30 rounded-2xl p-4 mb-6 border border-yellow-400/50"
                  style={{ boxShadow: '0 0 30px rgba(251,191,36,0.4)' }}
                >
                  <p className="text-yellow-300 text-xl font-black">🎂 BIRTHDAY BONUS ACTIVATED! +20 XP 🎂</p>
                  <p className="text-white/70 text-sm mt-1">The whole dojo celebrates with you!</p>
                </div>
              )}
              
              {/* Student Info Card */}
              {checkedInStudent && (
                <div className="bg-gradient-to-br from-[#E10600]/30 to-orange-600/30 backdrop-blur-md rounded-2xl p-6 mb-6 border border-[#E10600]/40" style={{
                  boxShadow: '0 0 40px rgba(225, 6, 0, 0.4)'
                }}>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E10600] to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {checkedInStudent.name?.charAt(0) || '?'}
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-white drop-shadow-lg">{checkedInStudent.name}</p>
                      <p className="text-sm text-white/70">{checkedInStudent.program}</p>
                    </div>
                  </div>
                  
                  {/* Streak Display */}
                  {checkedInStudent.currentStreak && checkedInStudent.currentStreak > 0 && (
                    <div className="bg-black/40 rounded-xl p-4 mb-3">
                      <p className="text-white/70 text-sm mb-1">🔥 Current Streak</p>
                      <p className="text-4xl font-black text-[#FFD700] drop-shadow-lg">{checkedInStudent.currentStreak} Classes</p>
                      {checkedInStudent.currentStreak >= 10 && (
                        <p className="text-green-400 text-sm mt-2 font-bold">⭐ Amazing dedication!</p>
                      )}
                    </div>
                  )}
                  
                  {/* XP Earned */}
                  <div className="bg-black/40 rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">✨ XP Earned</p>
                    <p className="text-3xl font-black text-[#00CED1] drop-shadow-lg">+{checkedInStudent.xpEarned || 10} XP</p>
                    {checkedInStudent.isBirthday && (
                      <p className="text-yellow-400 text-sm mt-2 font-bold">🎂 Birthday Bonus: +20 XP!</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Countdown Timer */}
          <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/20">
            <p className="text-white/60 text-sm mb-2">Returning to home screen in</p>
            <p className="text-6xl font-black text-white drop-shadow-lg">{countdownSeconds || 5}s</p>
          </div>

          <Button
            onClick={handleReset}
            className="bg-gradient-to-r from-[#E10600] to-orange-600 hover:from-[#C10500] hover:to-orange-700 text-white text-xl px-12 py-6 font-black uppercase tracking-wider transition-all hover:scale-105"
            style={{
              boxShadow: '0 0 40px rgba(225, 6, 0, 0.8)'
            }}
          >
            Done
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
