import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock, ChevronRight, CheckCircle2, Shield, Zap, Users, Star, Flame, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

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
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Step order for determining slide direction
const STEP_ORDER = ["program", "form", "who", "schedule", "done"] as const;
type Step = typeof STEP_ORDER[number];

interface OnlineSpecialPopupProps {
  forceOpen?: boolean;
  defaultProgram?: "kids" | "adults" | null;
}

// Slide variants: forward = slide left-to-right, backward = slide right-to-left
const makeVariants = (direction: 1 | -1) => ({
  initial: { x: direction * 40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: direction * -40, opacity: 0 },
});

const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export default function OnlineSpecialPopup({ forceOpen, defaultProgram }: OnlineSpecialPopupProps = {}) {
  const { t } = useTranslation();
  // Read pre-fill data from URL params (e.g. from Facebook Lead Ad redirect)
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlName = urlParams?.get("name") ?? "";
  const urlPhone = urlParams?.get("phone") ?? "";
  const urlEmail = urlParams?.get("email") ?? "";
  const hasPrefilledData = !!(urlName || urlPhone || urlEmail);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("program");
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = forward, -1 = backward
  const [lessonsFor, setLessonsFor] = useState<"myself" | "child" | "someone" | null>(null);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [otherName, setOtherName] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<typeof PROGRAMS[0] | null>(null);
  const [name, setName] = useState(urlName);
  const [phone, setPhone] = useState(urlPhone);
  const [email, setEmail] = useState(urlEmail);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string; program: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const hasShown = useRef(false);

  // Navigate to a step, automatically computing forward/backward direction
  const goTo = useCallback((next: Step) => {
    const currentIdx = STEP_ORDER.indexOf(step);
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
  const [leadId, setLeadId] = useState<number | null>(null);

  // Force-open immediately (e.g. from ?offer=kids URL param)
  useEffect(() => {
    if (forceOpen && !hasShown.current) {
      hasShown.current = true;
      setOpen(true);

      // Pre-select program based on defaultProgram
      let preSelectedProgram: typeof PROGRAMS[0] | null = null;
      if (defaultProgram === "kids") {
        preSelectedProgram = PROGRAMS.find((p) => p.label === "Kids Martial Arts") ?? null;
      } else if (defaultProgram === "adults") {
        preSelectedProgram = PROGRAMS.find((p) => p.label === "Teens & Adults") ?? null;
      }
      if (preSelectedProgram) setSelectedProgram(preSelectedProgram);

      // If name/phone/email are pre-filled from URL, skip straight to the form step
      if (hasPrefilledData && preSelectedProgram) {
        setStep("form");
      }
      return;
    }
    // Auto-timer intentionally removed — this popup only opens via forceOpen (?offer= URL param)
    // to prevent double-popup conflict with ProgramFinderPopup (which fires at 6s)
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
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!phone.trim()) errs.phone = "Phone is required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = "Valid email is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedProgram) return;
    setIsLoading(true);
    try {
      if (selectedProgram.free) {
        const leadResult = await submitLead.mutateAsync({
          campaign: "online_special",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          program: selectedProgram.label,
          source: "popup_online_special",
        });
        if (leadResult.leadId) setLeadId(leadResult.leadId);
        goTo("who");
      } else {
        const result = await checkoutMutation.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          program: selectedProgram.label,
        });
        if (result.checkoutUrl) {
          window.open(result.checkoutUrl, "_blank");
          goTo("done");
          setTimeout(() => fireConfetti(), 200);
        }
      }
    } catch {
      goTo("schedule");
    } finally {
      setIsLoading(false);
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

  const handleBookSlot = (slot: any) => {
    const slotTime = `${slot.startTime} – ${slot.endTime}`;
    setSelectedSlot({ day: slot.dayOfWeek, time: slot.startTime, program: slot.program });
    setSelectedDate(getNextDate(slot.dayOfWeek));
    goTo("done");
    setTimeout(() => fireConfetti(), 200);
    // Save funnel answers and appointment to DB (fire-and-forget)
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

  const heroImage = selectedProgram?.kids ? HERO_IMAGE_KIDS : HERO_IMAGE_ADULT;

  if (!open) return null;

  const variants = makeVariants(direction);

  // Progress indicator: which step index are we on (0-based, max 4)
  const stepIdx = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
            backgroundImage: `url(${step === "program" ? HERO_IMAGE_ADULT : heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            minHeight: "520px",
          }}
        >
          {/* Multi-layer gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

          {/* Badge */}
          <div className="absolute top-5 left-5">
            <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm">
              Online Special
            </div>
          </div>

          {/* Bottom content */}
          <div className="relative z-10 p-7 pb-8">
            <div className="w-8 h-0.5 bg-red-500 mb-4" />
            <h2 className="text-[42px] font-black text-white leading-[0.95] tracking-tight mb-1">
              2 CLASSES
            </h2>
            <h2 className="text-[42px] font-black leading-[0.95] tracking-tight mb-4" style={{ color: "#FF3B3B" }}>
              FOR FREE
            </h2>
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
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden" style={{ maxHeight: "92vh" }}>
          {/* Mobile hero image banner */}
          <div
            className="md:hidden relative flex flex-col justify-end flex-shrink-0"
            style={{
              backgroundImage: `url(${step === "program" ? HERO_IMAGE_ADULT : heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              height: "200px",
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
              <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                FREE CLASS
              </h2>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.15em] mt-1">
                Uniform Included · Limited Spots
              </p>
            </div>
          </div>

          {/* Close — desktop only (mobile uses the one in the hero banner) */}
          <button
            onClick={handleDismiss}
            className="hidden md:flex absolute top-4 right-4 z-20 w-8 h-8 bg-black/10 hover:bg-black/20 text-gray-600 hover:text-black rounded-full items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── Progress bar ── */}
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

          {/* ── Animated step content ── */}
          <div className="flex-1 overflow-y-auto relative">
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

                {/* ── STEP: Program Selection ── */}
                {step === "program" && (
                  <div className="p-6 sm:p-7 flex flex-col">
                    <div className="mb-5">
                      <h3 className="text-2xl font-black text-black tracking-tight mb-1">Choose Your Program</h3>
                      <p className="text-gray-400 text-sm">Select the program that's right for you or your child.</p>
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
                            onClick={() => { setSelectedProgram(prog); goTo("form"); }}
                            className="group w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                          >
                            {/* Icon block */}
                            <div
                              className={`w-11 h-11 rounded-lg bg-gradient-to-br ${prog.gradient} flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-black">{prog.label}</p>
                              <p className="text-xs text-gray-400 truncate">{prog.sub}</p>
                            </div>

                            {/* Price badge */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-400 font-medium">{prog.offer}</p>
                                {prog.price && (
                                  <p className="text-sm font-black" style={{ color: prog.color }}>
                                    {prog.price}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
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

                {/* ── STEP: Contact Form ── */}
                {step === "form" && selectedProgram && (
                  <div className="p-6 sm:p-7 flex flex-col">
                    {/* Program indicator */}
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => goTo("program")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                        ← Back
                      </button>
                      <div
                        className={`flex-1 flex items-center gap-2.5 bg-gradient-to-r ${selectedProgram.gradient} rounded-lg px-3 py-2`}
                      >
                        <selectedProgram.icon className="w-4 h-4 text-white flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-white text-xs font-black uppercase tracking-wider truncate">{selectedProgram.label}</p>
                          <p className="text-white/60 text-[10px] truncate">
                            {selectedProgram.offer}{selectedProgram.price ? ` — ${selectedProgram.price}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5">
                      <h3 className="text-2xl font-black text-black tracking-tight mb-1">Claim Your Spot</h3>
                      {hasPrefilledData ? (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <p className="text-green-700 text-xs font-medium">Your info is pre-filled from your form — just confirm and claim your offer!</p>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          {selectedProgram.free
                            ? "Fill out your info and we'll get you scheduled."
                            : "Fill out your info and we'll contact you to confirm your free class."}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Input
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={cn(
                            "h-12 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-0 placeholder:text-gray-300",
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
                            "h-12 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-0 placeholder:text-gray-300",
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
                            "h-12 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-0 placeholder:text-gray-300",
                            errors.email && "border-red-400 focus:ring-red-200"
                          )}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 pl-1">{errors.email}</p>}
                      </div>

                      {/* Benefits */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        {(selectedProgram.free
                          ? ["First class completely free", "No credit card needed today", "Expert certified instructors"]
                          : ["2 classes included", "Uniform included ($60 value)", "No long-term commitment"]
                        ).map((benefit) => (
                          <div key={benefit} className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 font-medium">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={cn(
                          "w-full h-13 py-3.5 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all",
                          `bg-gradient-to-r ${selectedProgram.gradient}`,
                          "hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed",
                          "shadow-lg"
                        )}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </span>
                        ) : selectedProgram.free ? (
                          "Claim My Free Class"
                        ) : (
                          "Book My Free Class"
                        )}
                      </button>

                      <p className="text-xs text-gray-300 text-center flex items-center justify-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        Secure checkout · No commitment · Cancel anytime
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP: Who are lessons for ── */}
                {step === "who" && (
                  <div className="p-6 sm:p-7 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => goTo("form")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">← Back</button>
                    </div>
                    <div className="mb-5">
                      <h3 className="text-2xl font-black text-black tracking-tight mb-1">Who are the lessons for?</h3>
                      <p className="text-gray-400 text-sm">This helps us personalize your experience.</p>
                    </div>

                    <div className="space-y-3">
                      {/* Myself */}
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        onClick={() => { setLessonsFor("myself"); goTo("schedule"); }}
                        className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-red-400 hover:bg-red-50 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🥋</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-base text-black">Myself</p>
                          <p className="text-xs text-gray-400">I want to train</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors" />
                      </motion.button>

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
                                  className="w-full h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-300"
                                />
                                <input
                                  placeholder="Child's Age"
                                  type="number"
                                  min="2"
                                  max="18"
                                  value={childAge}
                                  onChange={(e) => setChildAge(e.target.value)}
                                  className="w-full h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-300"
                                />
                                <button
                                  onClick={() => { if (childName.trim()) goTo("schedule"); }}
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
                                  className="w-full h-11 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-300"
                                />
                                <button
                                  onClick={() => { if (otherName.trim()) goTo("schedule"); }}
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

                    <button onClick={() => goTo("schedule")} className="text-xs text-gray-300 hover:text-gray-500 transition-colors w-full text-center mt-4">
                      Skip this step
                    </button>
                  </div>
                )}

                {/* ── STEP: Schedule ── */}
                {step === "schedule" && (
                  <div className="p-6 sm:p-7 flex flex-col">
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

                {/* ── STEP: Done ── */}
                {step === "done" && (
                  <div className="p-6 sm:p-7 flex flex-col items-center justify-center text-center">
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
                    >
                      <h3 className="text-2xl font-black text-black tracking-tight mb-2">You're All Set</h3>

                      {selectedSlot ? (
                        <>
                          <p className="text-gray-400 text-sm mb-5">Your class is confirmed. See you on the mat.</p>
                          <div className="w-full bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-5">
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
                          Check your email for your receipt and next steps. We'll be in touch soon.
                        </p>
                      )}

                      <Button
                        onClick={handleDismiss}
                        className="w-full h-12 bg-black hover:bg-zinc-800 text-white font-black rounded-xl tracking-wide"
                      >
                        See You There
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
