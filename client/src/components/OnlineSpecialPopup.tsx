import { useState, useEffect, useRef, useCallback } from "react";
import { X, Clock, ChevronRight, CheckCircle2, Sparkles, Shield, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const PROGRAMS = [
  { label: "Little Ninjas", sub: "Ages 3–5", color: "#7C3AED", offer: "2 Classes + Uniform — $29", kids: true },
  { label: "Kids Martial Arts", sub: "Ages 6–12", color: "#1D4ED8", offer: "2 Classes + Uniform — $29", kids: true },
  { label: "Teens & Adults", sub: "Ages 13+", color: "#B91C1C", offer: "2 Classes + Uniform — $29", kids: false },
  { label: "Adult Karate", sub: "All Ages", color: "#065F46", offer: "2 Classes + Uniform — $29", kids: false },
  { label: "Kickboxing Fitness", sub: "Teens & Adults", color: "#92400E", offer: "First Class FREE!", kids: false },
  { label: "Not Sure Yet", sub: "We'll help!", color: "#374151", offer: "Let's find your fit", kids: false },
];

const HERO_IMAGE_ADULT = "/manus-storage/popup-hero-martial-arts_f910ca46.jpg";
const HERO_IMAGE_KIDS = "/manus-storage/popup-hero-kids_0029eb40.jpg";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function OnlineSpecialPopup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"program" | "form" | "schedule" | "done">("program");
  const [selectedProgram, setSelectedProgram] = useState<typeof PROGRAMS[0] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
    {
      enabled: open && step === "schedule",
      staleTime: 5 * 60 * 1000,
    }
  );

  const submitLead = trpc.popup.submitLead.useMutation();
  const checkoutMutation = trpc.popup.createIntroOfferCheckout.useMutation();

  useEffect(() => {
    if (hasShown.current) return;
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("onlineSpecialDismissed");
      if (!dismissed) {
        setOpen(true);
        hasShown.current = true;
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fireConfetti = useCallback(() => {
    const colors = ["#CC0000", "#FFD700", "#FF6B6B", "#4CAF50", "#2196F3", "#FF9800"];
    confetti({ particleCount: 150, spread: 120, origin: { x: 0.5, y: 0.6 }, colors, shapes: ["star", "circle"], scalar: 1.4 });
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
      if (selectedProgram.label === "Kickboxing Fitness" || selectedProgram.label === "Not Sure Yet") {
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

  const programKey = selectedProgram?.label.split(" (")[0] ?? "";
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
    const todayDay = today.getDay();
    const targetDay = days.indexOf(dayName);
    let diff = targetDay - todayDay;
    if (diff <= 0) diff += 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleBookSlot = (slot: any) => {
    const date = getNextDate(slot.dayOfWeek);
    setSelectedSlot({ day: slot.dayOfWeek, time: slot.startTime, program: slot.program });
    setSelectedDate(date);
    setStep("done");
    setTimeout(() => fireConfetti(), 200);
  };

  const isKidsProgram = selectedProgram?.kids ?? false;
  const heroImage = isKidsProgram ? HERO_IMAGE_KIDS : HERO_IMAGE_ADULT;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Modal */}
      <div
        className="relative z-[10001] w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT PANEL — Hero Image (desktop only) */}
        <div
          className="hidden md:flex md:w-5/12 relative flex-col justify-end flex-shrink-0"
          style={{
            backgroundImage: `url(${step === "program" ? HERO_IMAGE_ADULT : heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            minHeight: "500px",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="relative z-10 p-6 pb-8">
            <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Online Special
            </div>
            <h2 className="text-4xl font-black text-white leading-none mb-2">
              2 CLASSES<br />
              <span className="text-red-400">FOR $29</span>
            </h2>
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-5">
              Uniform Included — Limited Spots!
            </p>
            <div className="space-y-2.5">
              {[
                { icon: Shield, text: "Expert Certified Instructors" },
                { icon: Zap, text: "Results in Your First Class" },
                { icon: Users, text: "Positive, Safe Community" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile header */}
          <div className="md:hidden relative bg-gradient-to-br from-black via-zinc-900 to-red-950 px-5 pt-6 pb-5 text-center">
            <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3 h-3" />
              Online Special
            </div>
            <h2 className="text-2xl font-black text-white">
              2 CLASSES FOR <span className="text-red-400">$29</span>
            </h2>
            <p className="text-red-300 text-xs font-semibold uppercase tracking-wider mt-1">
              Uniform Included — Limited Spots!
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* STEP: Program Selection */}
          {step === "program" && (
            <div className="p-5 sm:p-6 flex flex-col flex-1">
              <div className="mb-4">
                <h3 className="text-xl font-black text-black mb-1">Choose Your Program</h3>
                <p className="text-gray-500 text-sm">Select the program that's right for you or your child.</p>
              </div>
              <div className="space-y-2 flex-1">
                {PROGRAMS.map((prog) => (
                  <button
                    key={prog.label}
                    onClick={() => { setSelectedProgram(prog); setStep("form"); }}
                    className="group w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-black text-white"
                        style={{ backgroundColor: prog.color }}
                      >
                        🥋
                      </div>
                      <div>
                        <p className="font-bold text-sm text-black">{prog.label}</p>
                        <p className="text-xs text-gray-500">{prog.sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full hidden sm:block text-white"
                        style={{ backgroundColor: prog.color }}
                      >
                        {prog.offer}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                🔒 Secure checkout powered by Stripe · No commitment required
              </p>
            </div>
          )}

          {/* STEP: Contact Form */}
          {step === "form" && selectedProgram && (
            <div className="p-5 sm:p-6 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep("program")} className="text-xs text-gray-400 hover:text-gray-600 underline flex-shrink-0">
                  ← Back
                </button>
                <div
                  className="flex-1 text-center py-2 px-3 rounded-lg text-white text-xs font-bold uppercase tracking-wider truncate"
                  style={{ backgroundColor: selectedProgram.color }}
                >
                  {selectedProgram.label} · {selectedProgram.offer}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-black text-black mb-1">Claim Your Spot</h3>
                <p className="text-gray-500 text-sm">
                  {selectedProgram.label === "Kickboxing Fitness"
                    ? "Fill out your info and we'll schedule your FREE first class."
                    : "Fill out your info and you'll be redirected to secure $29 checkout."}
                </p>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <Input
                    placeholder="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn("h-11 text-sm", errors.name && "border-red-500")}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input
                    placeholder="Phone Number *"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn("h-11 text-sm", errors.phone && "border-red-500")}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <Input
                    placeholder="Email Address *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn("h-11 text-sm", errors.email && "border-red-500")}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                  {(selectedProgram.label === "Kickboxing Fitness"
                    ? ["First class completely FREE", "No credit card needed today", "Expert certified instructors"]
                    : ["2 classes included", "Uniform included ($60 value)", "No long-term commitment"]
                  ).map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full h-12 text-white font-black text-sm uppercase tracking-wider rounded-xl"
                  style={{ backgroundColor: selectedProgram.color }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : selectedProgram.label === "Kickboxing Fitness" ? (
                    "Claim My FREE First Class →"
                  ) : (
                    "Claim My $29 Intro Offer →"
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  🔒 Secure checkout · No commitment · Cancel anytime
                </p>
              </div>
            </div>
          )}

          {/* STEP: Schedule */}
          {step === "schedule" && (
            <div className="p-5 sm:p-6 flex flex-col flex-1">
              <div className="mb-4">
                <h3 className="text-xl font-black text-black mb-1">Pick Your First Class</h3>
                <p className="text-gray-500 text-sm">
                  Choose a time for <strong>{selectedProgram?.label ?? "your first visit"}</strong>:
                </p>
              </div>
              {sortedDays.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-400 text-sm">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto mb-2" />
                    Loading schedule...
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {sortedDays.map((day) => (
                    <div key={day}>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">{day}</p>
                      {byDay[day].map((slot: any) => (
                        <button
                          key={slot.id}
                          onClick={() => handleBookSlot(slot)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 transition-all text-left mb-1.5 group"
                        >
                          <div>
                            <p className="font-bold text-sm text-black">{slot.program}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {slot.startTime} – {slot.endTime}
                              {slot.instructor && ` · ${slot.instructor}`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleDismiss} className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center mt-3">
                I'll schedule later
              </button>
            </div>
          )}

          {/* STEP: Done */}
          {step === "done" && (
            <div className="p-5 sm:p-6 flex flex-col items-center justify-center flex-1 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-black mb-2">You're All Set! 🥋</h3>
              {selectedSlot ? (
                <>
                  <p className="text-gray-500 text-sm mb-4">Your class is confirmed. See you on the mat!</p>
                  <div className="bg-gray-50 rounded-xl p-4 text-left w-full space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Program</span>
                      <span className="font-bold">{selectedSlot.program}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Day</span>
                      <span className="font-bold">{selectedSlot.day}, {selectedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Time</span>
                      <span className="font-bold">{selectedSlot.time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location</span>
                      <span className="font-bold">MyDojo HQ – Tomball, TX</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm mb-6">
                  Check your email for your receipt and next steps. We'll be in touch soon!
                </p>
              )}
              <Button
                onClick={handleDismiss}
                className="w-full h-11 bg-black hover:bg-zinc-800 text-white font-black rounded-xl"
              >
                Got It — See You There! 🥋
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
