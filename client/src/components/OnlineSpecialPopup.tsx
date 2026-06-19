import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Clock, ChevronRight, CheckCircle2, Shield, Zap, Users, Star, Flame, Award } from "lucide-react";
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

interface OnlineSpecialPopupProps {
  forceOpen?: boolean;
  defaultProgram?: "kids" | "adults" | null;
}

export default function OnlineSpecialPopup({ forceOpen, defaultProgram }: OnlineSpecialPopupProps = {}) {
  const { t } = useTranslation();
  // Read pre-fill data from URL params (e.g. from Facebook Lead Ad redirect)
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlName = urlParams?.get("name") ?? "";
  const urlPhone = urlParams?.get("phone") ?? "";
  const urlEmail = urlParams?.get("email") ?? "";
  const hasPrefilledData = !!(urlName || urlPhone || urlEmail);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"program" | "form" | "schedule" | "done">("program");
  const [selectedProgram, setSelectedProgram] = useState<typeof PROGRAMS[0] | null>(null);
  const [name, setName] = useState(urlName);
  const [phone, setPhone] = useState(urlPhone);
  const [email, setEmail] = useState(urlEmail);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string; program: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const hasShown = useRef(false);

  const { data: scheduleData } = trpc.schedule.getClassSchedules.useQuery(
    {
      programs: ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School"],
      location: "MyDojo Headquarters - Tomball",
    },
    { enabled: open && step === "schedule", staleTime: 5 * 60 * 1000 }
  );

  const submitLead = trpc.popup.submitLead.useMutation();
  const checkoutMutation = trpc.popup.createIntroOfferCheckout.useMutation();

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
        await submitLead.mutateAsync({
          campaign: "online_special",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          program: selectedProgram.label,
          source: "popup_online_special",
        });
        setStep("schedule");
      } else {
        const result = await checkoutMutation.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          program: selectedProgram.label,
        });
        if (result.checkoutUrl) {
          window.open(result.checkoutUrl, "_blank");
          setStep("done");
          setTimeout(() => fireConfetti(), 200);
        }
      }
    } catch {
      setStep("schedule");
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
    setSelectedSlot({ day: slot.dayOfWeek, time: slot.startTime, program: slot.program });
    setSelectedDate(getNextDate(slot.dayOfWeek));
    setStep("done");
    setTimeout(() => fireConfetti(), 200);
  };

  const heroImage = selectedProgram?.kids ? HERO_IMAGE_KIDS : HERO_IMAGE_ADULT;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleDismiss} />

      <div
        className="relative z-[10001] w-full max-w-4xl rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden flex animate-in fade-in zoom-in-95 duration-300"
        style={{ maxHeight: "92vh" }}
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
        <div className="flex-1 flex flex-col bg-white overflow-y-auto" style={{ maxHeight: "92vh" }}>
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

          {/* ── STEP: Program Selection ── */}
          {step === "program" && (
            <div className="p-6 sm:p-7 flex flex-col flex-1">
              <div className="mb-5">
                <h3 className="text-2xl font-black text-black tracking-tight mb-1">Choose Your Program</h3>
                <p className="text-gray-400 text-sm">Select the program that's right for you or your child.</p>
              </div>

              <div className="space-y-2 flex-1">
                {PROGRAMS.map((prog) => {
                  const Icon = prog.icon;
                  return (
                    <button
                      key={prog.label}
                      onClick={() => { setSelectedProgram(prog); setStep("form"); }}
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
                    </button>
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
            <div className="p-6 sm:p-7 flex flex-col flex-1">
              {/* Program indicator */}
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep("program")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
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

              <div className="space-y-3 flex-1">
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
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

          {/* ── STEP: Schedule ── */}
          {step === "schedule" && (
            <div className="p-6 sm:p-7 flex flex-col flex-1">
              <div className="mb-5">
                <h3 className="text-2xl font-black text-black tracking-tight mb-1">Pick Your First Class</h3>
                <p className="text-gray-400 text-sm">
                  Choose a time for <span className="font-semibold text-black">{selectedProgram?.label ?? "your first visit"}</span>
                </p>
              </div>

              {sortedDays.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading schedule...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {sortedDays.map((day) => (
                    <div key={day}>
                      <p className="text-xs font-black text-gray-300 uppercase tracking-[0.15em] mb-2">{day}</p>
                      {byDay[day].map((slot: any) => (
                        <button
                          key={slot.id}
                          onClick={() => handleBookSlot(slot)}
                          className="group w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left mb-2"
                        >
                          <div>
                            <p className="font-bold text-sm text-black">{slot.program}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {slot.startTime} – {slot.endTime}
                              {slot.instructor && <span className="text-gray-300">· {slot.instructor}</span>}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                        </button>
                      ))}
                    </div>
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
            <div className="p-6 sm:p-7 flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
