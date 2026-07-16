import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock, ChevronRight, CheckCircle2, Shield, Zap, Users, Star, Flame, Award, Loader2, Phone, MessageCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { openIntakeChatbot } from "@/lib/chatbot";

const PROGRAMS = [
  {
    label: "Little Ninjas",
    sub: "Ages 3–5",
    color: "#6D28D9",
    gradient: "from-violet-700 to-purple-900",
    offer: "2 Classes + Uniform",
    price: "FREE",
    free: false,
    kids: true,
    icon: Star,
  },
  {
    label: "Kids Martial Arts",
    sub: "Ages 6–12",
    color: "#1E40AF",
    gradient: "from-blue-700 to-blue-900",
    offer: "2 Classes + Uniform",
    price: "FREE",
    free: false,
    kids: true,
    icon: Shield,
  },
  {
    label: "Teens & Adults",
    sub: "Ages 13+",
    color: "#991B1B",
    gradient: "from-red-700 to-red-900",
    offer: "2 Classes + Uniform",
    price: "FREE",
    free: false,
    kids: false,
    icon: Award,
  },
  {
    label: "Adult Karate",
    sub: "All Ages",
    color: "#065F46",
    gradient: "from-emerald-700 to-emerald-900",
    offer: "2 Classes + Uniform",
    price: "FREE",
    free: false,
    kids: false,
    icon: Award,
  },
  {
    label: "Kickboxing Fitness",
    sub: "Teens & Adults",
    color: "#92400E",
    gradient: "from-amber-700 to-orange-900",
    offer: "First Class",
    price: "FREE",
    free: true,
    kids: false,
    icon: Flame,
  },
  {
    label: "Not Sure Yet",
    sub: "We'll help you find the right fit",
    color: "#374151",
    gradient: "from-gray-600 to-gray-800",
    offer: "Free Consultation",
    price: "",
    free: true,
    kids: false,
    icon: Users,
  },
];

const HERO_IMAGE_ADULT = "/manus-storage/popup-hero-martial-arts_f910ca46.jpg";
const HERO_IMAGE_KIDS = "/manus-storage/popup-hero-kids_0029eb40.jpg";
const HERO_IMAGE_FAMILY = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/popup-hero-family-reviews-crxaxDmdvSeoPEn2cY5hSu.png";

const FIVE_STAR_REVIEWS = [
  { name: "Sarah M.", text: "Best decision for our kids!", stars: 5 },
  { name: "James T.", text: "Incredible instructors & community.", stars: 5 },
  { name: "Maria L.", text: "My son's confidence transformed!", stars: 5 },
];
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Step order: form → who → program → schedule → done
const STEP_ORDER = ["form", "who", "program", "schedule", "done"] as const;
type Step = typeof STEP_ORDER[number];

interface OnlineSpecialPopupProps {
  forceOpen?: boolean;
  defaultProgram?: "kids" | "adults" | null;
  onClose?: () => void;
}

// Slide variants: forward = slide left, backward = slide right
const makeVariants = (direction: 1 | -1) => ({
  initial: { x: direction * 40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: direction * -40, opacity: 0 },
});

const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export default function OnlineSpecialPopup({ forceOpen, defaultProgram, onClose }: OnlineSpecialPopupProps = {}) {
  const { t } = useTranslation();
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlName = urlParams?.get("name") ?? "";
  const urlPhone = urlParams?.get("phone") ?? "";
  const urlEmail = urlParams?.get("email") ?? "";
  const hasPrefilledData = !!(urlName || urlPhone || urlEmail);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [direction, setDirection] = useState<1 | -1>(1);

  // Step 1: contact info
  const [name, setName] = useState(urlName);
  const [phone, setPhone] = useState(urlPhone);
  const [email, setEmail] = useState(urlEmail);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2: who are lessons for
  const [lessonsFor, setLessonsFor] = useState<"myself" | "child" | "someone" | null>(null);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherAge, setOtherAge] = useState("");
  const [myselfAge, setMyselfAge] = useState("");

  // Step 3: program
  const [selectedProgram, setSelectedProgram] = useState<typeof PROGRAMS[0] | null>(null);

  // Step 4: schedule
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string; program: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [leadId, setLeadId] = useState<number | null>(null);
  const hasShown = useRef(false);

  const goTo = useCallback((next: Step, currentStep?: Step) => {
    const cur = currentStep ?? step;
    const currentIdx = STEP_ORDER.indexOf(cur);
    const nextIdx = STEP_ORDER.indexOf(next);
    setDirection(nextIdx >= currentIdx ? 1 : -1);
    setStep(next);
  }, [step]);

  const { data: scheduleData } = trpc.schedule.getClassSchedules.useQuery(
    {
      programs: ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School"],
      location: "MyDojo Headquarters - Tomball",
    },
    { enabled: open && step === "schedule", staleTime: 5 * 60 * 1000 }
  );

  const submitLead = trpc.popup.submitLead.useMutation();
  const checkoutMutation = trpc.popup.createIntroOfferCheckout.useMutation();
  const updateFunnelAnswers = trpc.popup.updateLeadFunnelAnswers.useMutation();

  useEffect(() => {
    if (forceOpen && !hasShown.current) {
      hasShown.current = true;
      setOpen(true);

      // Pre-select program based on defaultProgram
      if (defaultProgram === "kids") {
        const prog = PROGRAMS.find((p) => p.label === "Kids Martial Arts") ?? null;
        if (prog) setSelectedProgram(prog);
      } else if (defaultProgram === "adults") {
        const prog = PROGRAMS.find((p) => p.label === "Teens & Adults") ?? null;
        if (prog) setSelectedProgram(prog);
      }

      // If pre-filled from URL, start at form step
      setStep("form");
    }
  }, [forceOpen, defaultProgram, hasPrefilledData]);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 160,
      spread: 120,
      origin: { x: 0.5, y: 0.55 },
      colors: ["#CC0000", "#FFD700", "#FF6B6B", "#4CAF50", "#2196F3"],
      shapes: ["star", "circle"],
      scalar: 1.4,
    });
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    sessionStorage.setItem("onlineSpecialDismissed", "1");
    onClose?.();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!phone.trim()) errs.phone = "Phone is required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = "Valid email is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1 → 2: submit contact info and save lead
  const handleSubmitContact = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const leadResult = await submitLead.mutateAsync({
        campaign: "online_special",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        program: selectedProgram?.label ?? "Unknown",
        source: "popup_online_special",
      });
      if (leadResult.leadId) setLeadId(leadResult.leadId);
      goTo("who");
    } catch {
      goTo("who");
    } finally {
      setIsLoading(false);
    }
  };

  // Age → program auto-routing helper
  const getProgramForAge = (age: number): typeof PROGRAMS[0] | null => {
    if (age <= 5) return PROGRAMS.find((p) => p.label === "Little Ninjas") ?? null;
    if (age <= 12) return PROGRAMS.find((p) => p.label === "Kids Martial Arts") ?? null;
    if (age <= 17) return PROGRAMS.find((p) => p.label === "Teens & Adults") ?? null;
    return PROGRAMS.find((p) => p.label === "Adult Karate") ?? null;
  };

  // Who step continue → auto-route based on age, skip program screen
  const handleWhoChildContinue = () => {
    if (!childName.trim()) return;
    const age = parseInt(childAge, 10);
    if (!isNaN(age) && age > 0) {
      const prog = getProgramForAge(age);
      if (prog) {
        setSelectedProgram(prog);
        goTo("schedule", "who");
        return;
      }
    }
    goTo("program", "who");
  };

  const handleWhoMyselfContinue = () => {
    const age = parseInt(myselfAge, 10);
    if (!isNaN(age) && age > 0) {
      const prog = getProgramForAge(age);
      if (prog) {
        setSelectedProgram(prog);
        goTo("schedule", "who");
        return;
      }
    }
    goTo("program", "who");
  };

  const handleWhoSomeoneContinue = () => {
    if (!otherName.trim()) return;
    const age = parseInt(otherAge, 10);
    if (!isNaN(age) && age > 0) {
      const prog = getProgramForAge(age);
      if (prog) {
        setSelectedProgram(prog);
        goTo("schedule", "who");
        return;
      }
    }
    goTo("program", "who");
  };

  // Step 3: program selected → go to schedule (or checkout for paid programs)
  const handleProgramSelect = async (prog: typeof PROGRAMS[0]) => {
    setSelectedProgram(prog);
    if (!prog.free) {
      // Paid intro offer → Stripe checkout
      setIsLoading(true);
      try {
        const result = await checkoutMutation.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          program: prog.label,
        });
        if (result.checkoutUrl) {
          window.open(result.checkoutUrl, "_blank");
          goTo("done", "program");
          setTimeout(() => fireConfetti(), 200);
        }
      } catch {
        goTo("schedule", "program");
      } finally {
        setIsLoading(false);
      }
    } else {
      goTo("schedule", "program");
    }
  };

  // Step 4: slot booked → done
  const handleBookSlot = (slot: any) => {
    const slotTime = `${slot.startTime} – ${slot.endTime}`;
    setSelectedSlot({ day: slot.dayOfWeek, time: slot.startTime, program: slot.program });
    setSelectedDate(getNextDate(slot.dayOfWeek));
    goTo("done");
    setTimeout(() => fireConfetti(), 200);
    if (leadId) {
      updateFunnelAnswers.mutate({
        leadId,
        lessonsFor: lessonsFor ?? undefined,
        childName: childName.trim() || undefined,
        childAge: childAge ? parseInt(childAge, 10) : undefined,
        otherName: otherName.trim() || undefined,
        appointmentDay: slot.dayOfWeek,
        appointmentTime: slotTime,
      });
    }
  };

  const programKey = selectedProgram?.label ?? "";
  const filteredSchedule = (scheduleData || []).filter(
    (s: any) =>
      s.isActive === 1 &&
      (programKey === "Not Sure Yet" ||
        s.program.toLowerCase().includes(programKey.toLowerCase()) ||
        programKey.toLowerCase().includes(s.program.toLowerCase()))
  );
  const byDay: Record<string, any[]> = {};
  for (const slot of filteredSchedule) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
    byDay[slot.dayOfWeek].push(slot);
  }
  const sortedDays = DAY_ORDER.filter((d) => byDay[d]);

  const getNextDate = (dayName: string) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    const diff = ((days.indexOf(dayName) - today.getDay() + 7) % 7) || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const heroImage = step === "who" ? HERO_IMAGE_FAMILY : (selectedProgram?.kids ? HERO_IMAGE_KIDS : HERO_IMAGE_ADULT);
  const stepIdx = STEP_ORDER.indexOf(step);

  if (!open) return null;

  const variants = makeVariants(direction);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleDismiss}
      />

      <motion.div
        className="relative z-[10001] w-full max-w-4xl rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden flex"
        style={{ maxHeight: "92vh" }}
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT PANEL: Hero Image ── */}
        <div
          className="hidden md:flex md:w-[42%] relative flex-col justify-end flex-shrink-0"
          style={{
            backgroundImage: `url(${step === "form" ? HERO_IMAGE_ADULT : heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            minHeight: "520px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
          <div className="absolute top-5 left-5">
            <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm">
              Online Special
            </div>
          </div>
          <div className="relative z-10 p-7 pb-8">
            {step === "who" ? (
              // Family/reviews panel for the "who" step
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-white font-black text-sm ml-1">5.0</span>
                </div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.15em] mb-5">500+ Five-Star Reviews</p>
                <div className="space-y-3">
                  {FIVE_STAR_REVIEWS.map((review) => (
                    <div key={review.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/90 text-xs font-medium leading-snug">"{review.text}"</p>
                      <p className="text-white/40 text-[10px] mt-1 font-semibold">— {review.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Default panel for other steps
              <div>
                <div className="w-8 h-0.5 bg-red-500 mb-4" />
                <h2 className="text-[42px] font-black text-white leading-[0.95] tracking-tight mb-1">2 CLASSES</h2>
                <h2 className="text-[42px] font-black leading-[0.95] tracking-tight mb-4" style={{ color: "#FF3B3B" }}>FOR FREE</h2>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em] mb-6">
                  Uniform Included · Limited Spots
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Shield, text: "Certified Expert Instructors" },
                    { icon: Zap, text: "Real Results, First Class" },
                    { icon: Users, text: "Safe, Positive Community" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-white/80 text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden" style={{ maxHeight: "92vh" }}>
          {/* Mobile hero banner */}
          <div
            className="md:hidden relative flex flex-col justify-end flex-shrink-0"
            style={{
              backgroundImage: `url(${step === "form" ? HERO_IMAGE_ADULT : heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              height: "180px",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
            <div className="absolute top-4 left-4">
              <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm">
                Online Special
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative z-10 px-5 pb-4">
              <h2 className="text-3xl font-black text-white leading-tight tracking-tight">FREE CLASS</h2>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em] mt-1">Uniform Included · Limited Spots</p>
            </div>
          </div>

          {/* Close — desktop */}
          <button
            onClick={handleDismiss}
            className="hidden md:flex absolute top-4 right-4 z-20 w-8 h-8 bg-black/10 hover:bg-black/20 text-gray-600 hover:text-black rounded-full items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          {step !== "done" && (
            <div className="flex-shrink-0 px-6 pt-4 pb-0">
              <div className="flex gap-1.5">
                {STEP_ORDER.filter(s => s !== "done").map((s, i) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-500",
                      i <= stepIdx ? "bg-red-500" : "bg-gray-100"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Animated step content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={TRANSITION}
                className="w-full"
              >

                {/* ── STEP 1: Contact Form ── */}
                {step === "form" && (
                  <div className="p-6 sm:p-7 flex flex-col">
                    <div className="mb-5">
                      <h3 className="text-2xl font-black text-black tracking-tight mb-1">Claim Your Free Class</h3>
                      {hasPrefilledData ? (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <p className="text-green-700 text-xs font-medium">Your info is pre-filled — just confirm and claim your offer!</p>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Fill out your info and we'll get you scheduled.</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Input
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={cn(
                            "h-12 text-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-0 placeholder:text-gray-500 text-gray-900 bg-white",
                            errors.name && "border-red-400 focus:ring-red-200"
                          )}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 pl-1">{errors.name}</p>}
                      </div>
                      <div>
                        <Input
                          placeholder="Phone Number"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={cn(
                            "h-12 text-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-0 placeholder:text-gray-500 text-gray-900 bg-white",
                            errors.phone && "border-red-400 focus:ring-red-200"
                          )}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1 pl-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <Input
                          placeholder="Email Address"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn(
                            "h-12 text-sm border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-0 placeholder:text-gray-500 text-gray-900 bg-white",
                            errors.email && "border-red-400 focus:ring-red-200"
                          )}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 pl-1">{errors.email}</p>}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        {["First class completely free", "No credit card needed today", "Expert certified instructors"].map((benefit) => (
                          <div key={benefit} className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 font-medium">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSubmitContact}
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl text-white font-black text-sm uppercase tracking-wider bg-gradient-to-r from-red-600 to-red-800 hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg transition-all"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          "Get My Free Class →"
                        )}
                      </button>

                      <p className="text-xs text-gray-300 text-center flex items-center justify-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        No commitment · Cancel anytime
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Who are lessons for ── */}
                {step === "who" && (
                  <div className="p-6 sm:p-7 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => goTo("form")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">← Back</button>
                    </div>
                    <div className="mb-5">
                      <h3 className="text-2xl font-black text-black tracking-tight mb-1">Who are the lessons for?</h3>
                      <p className="text-gray-400 text-sm">This helps us match you with the right program.</p>
                    </div>

                    <div className="space-y-3">
                      {/* Myself */}
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        onClick={() => setLessonsFor(lessonsFor === "myself" ? null : "myself")}
                        className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-red-400 hover:bg-red-50 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🥋</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-base text-black">Myself</p>
                          <p className="text-xs text-gray-400">I want to train</p>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-all duration-200 ${lessonsFor === "myself" ? "rotate-90 text-red-500" : "text-gray-300 group-hover:text-red-500"}`} />
                      </motion.button>
                      <AnimatePresence initial={false}>
                        {lessonsFor === "myself" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                              <input
                                placeholder="Your Age (optional)"
                                type="number"
                                min="10"
                                max="99"
                                value={myselfAge}
                                onChange={(e) => setMyselfAge(e.target.value)}
                                className="w-full h-11 px-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 placeholder:text-gray-500 text-gray-900 bg-white"
                              />
                              <button
                                onClick={handleWhoMyselfContinue}
                                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-sm rounded-xl uppercase tracking-wider hover:opacity-90 transition-all"
                              >
                                Continue →
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* My Child */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-xl border-2 border-gray-100 hover:border-blue-400 transition-all overflow-hidden"
                      >
                        <button
                          onClick={() => setLessonsFor(lessonsFor === "child" ? null : "child")}
                          className="group w-full flex items-center gap-4 p-4 text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">⭐</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-base text-black">My Child</p>
                            <p className="text-xs text-gray-400">Enrolling my son or daughter</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-all duration-200 ${lessonsFor === "child" ? "rotate-90 text-blue-500" : "text-gray-300 group-hover:text-blue-500"}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {lessonsFor === "child" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                                <input
                                  placeholder="Child's Name"
                                  value={childName}
                                  onChange={(e) => setChildName(e.target.value)}
                                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-500 text-gray-900 bg-white"
                                />
                                <input
                                  placeholder="Child's Age"
                                  type="number"
                                  min="2"
                                  max="18"
                                  value={childAge}
                                  onChange={(e) => setChildAge(e.target.value)}
                                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-500 text-gray-900 bg-white"
                                />
                                <button
                                  onClick={handleWhoChildContinue}
                                  disabled={!childName.trim()}
                                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black text-sm rounded-xl uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                                >
                                  Continue →
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Someone Else */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-xl border-2 border-gray-100 hover:border-purple-400 transition-all overflow-hidden"
                      >
                        <button
                          onClick={() => setLessonsFor(lessonsFor === "someone" ? null : "someone")}
                          className="group w-full flex items-center gap-4 p-4 text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">👥</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-base text-black">Someone Else</p>
                            <p className="text-xs text-gray-400">A family member or friend</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-all duration-200 ${lessonsFor === "someone" ? "rotate-90 text-purple-500" : "text-gray-300 group-hover:text-purple-500"}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {lessonsFor === "someone" && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
                                <input
                                  placeholder="Their Name"
                                  value={otherName}
                                  onChange={(e) => setOtherName(e.target.value)}
                                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-500 text-gray-900 bg-white"
                                />
                                <input
                                  placeholder="Their Age (optional)"
                                  type="number"
                                  min="2"
                                  max="99"
                                  value={otherAge}
                                  onChange={(e) => setOtherAge(e.target.value)}
                                  className="w-full h-11 px-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-500 text-gray-900 bg-white"
                                />
                                <button
                                  onClick={handleWhoSomeoneContinue}
                                  disabled={!otherName.trim()}
                                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-black text-sm rounded-xl uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                                >
                                  Continue →
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>

                    <button onClick={() => goTo("program")} className="text-xs text-gray-300 hover:text-gray-500 transition-colors w-full text-center mt-4">
                      Skip this step
                    </button>
                  </div>
                )}

                {/* ── STEP 3: Program Selection ── */}
                {step === "program" && (
                  <div className="p-6 sm:p-7 flex flex-col">
                    <div className="flex items-center gap-3 mb-5">
                      <button onClick={() => goTo("who")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">← Back</button>
                    </div>
                    <div className="mb-5">
                      <h3 className="text-2xl font-black text-black tracking-tight mb-1">Choose Your Program</h3>
                      <p className="text-gray-400 text-sm">Select the program that's right for you{lessonsFor === "child" ? ` or ${childName || "your child"}` : ""}.</p>
                    </div>

                    <div className="space-y-2">
                      {PROGRAMS.map((prog, i) => {
                        const Icon = prog.icon;
                        return (
                          <motion.button
                            key={prog.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.22 }}
                            onClick={() => handleProgramSelect(prog)}
                            disabled={isLoading}
                            className="group w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left disabled:opacity-60"
                          >
                            <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${prog.gradient} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-black">{prog.label}</p>
                              <p className="text-xs text-gray-400 truncate">{prog.sub}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-400 font-medium">{prog.offer}</p>
                                {prog.price && (
                                  <p className="text-sm font-black" style={{ color: prog.color }}>{prog.price}</p>
                                )}
                              </div>
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <p className="text-xs text-gray-300 text-center mt-5 flex items-center justify-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      Secure checkout powered by Stripe · No commitment required
                    </p>
                  </div>
                )}

                {/* ── STEP 4: Schedule ── */}
                {step === "schedule" && (
                  <div className="p-6 sm:p-7 flex flex-col">
                    <div className="flex items-center gap-3 mb-5">
                      <button onClick={() => goTo("program")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">← Back</button>
                    </div>
                    <div className="mb-5">
                      <h3 className="text-2xl font-black text-black tracking-tight mb-1">Pick Your First Class</h3>
                      <p className="text-gray-400 text-sm">
                        Choose a time for <span className="font-semibold text-black">{selectedProgram?.label ?? "your first visit"}</span>
                      </p>
                    </div>

                    {sortedDays.length === 0 ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-3" />
                          <p className="text-gray-400 text-sm font-medium">Loading schedule...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedDays.map((day, dayIdx) => (
                          <motion.div
                            key={day}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: dayIdx * 0.05, duration: 0.2 }}
                          >
                            <p className="text-xs font-black text-gray-300 uppercase tracking-[0.15em] mb-2">{day}</p>
                            {byDay[day].map((slot: any) => (
                              <button
                                key={slot.id}
                                onClick={() => handleBookSlot(slot)}
                                className="group w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-red-300 hover:bg-red-50 transition-all text-left mb-2"
                              >
                                <div>
                                  <p className="font-bold text-sm text-black">{slot.program}</p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {slot.startTime} – {slot.endTime}
                                    {slot.instructor && <span className="text-gray-300">· {slot.instructor}</span>}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                              </button>
                            ))}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <button onClick={handleDismiss} className="text-xs text-gray-300 hover:text-gray-500 transition-colors w-full text-center mt-4">
                      I'll schedule later
                    </button>
                  </div>
                )}

                {/* ── STEP 5: Done ── */}
                {step === "done" && (
                  <div className="p-6 sm:p-7 flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="w-full"
                    >
                      <h3 className="text-2xl font-black text-black tracking-tight mb-2">You're All Set!</h3>

                      {selectedSlot ? (
                        <>
                          <p className="text-gray-400 text-sm mb-5">Your class is confirmed. See you on the mat!</p>
                          <div className="w-full bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
                            {[
                              { label: "Program", value: selectedSlot.program },
                              { label: "Day", value: `${selectedSlot.day}, ${selectedDate}` },
                              { label: "Time", value: selectedSlot.time },
                              { label: "Location", value: "MyDojo HQ — Tomball, TX" },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">{label}</span>
                                <span className="font-bold text-black">{value}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm mb-6">
                          We'll be in touch soon. Check your email for next steps.
                        </p>
                      )}

                      {/* Contact options */}
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Have questions? Reach us now</p>
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        <a
                          href="tel:+18774693656"
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-red-50 hover:border-red-200 border border-gray-100 transition-all group"
                        >
                          <Phone className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                          <span className="text-xs font-bold text-gray-600 group-hover:text-red-600">Call Us</span>
                        </a>
                        <a
                          href="sms:+18774693656"
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 transition-all group"
                        >
                          <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600">Text Us</span>
                        </a>
                        <button
                          onClick={() => {
                            handleDismiss();
                            setTimeout(() => openIntakeChatbot({ name, phone, email }), 300);
                          }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 hover:bg-purple-50 hover:border-purple-200 border border-gray-100 transition-all group"
                        >
                          <Bot className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                          <span className="text-xs font-bold text-gray-600 group-hover:text-purple-600">Chat Kai</span>
                        </button>
                      </div>

                      <Button
                        onClick={handleDismiss}
                        className="w-full h-12 bg-black hover:bg-zinc-800 text-white font-black rounded-xl tracking-wide"
                      >
                        See You There 🥋
                      </Button>
                    </motion.div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
