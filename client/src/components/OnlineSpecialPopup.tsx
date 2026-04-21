import { useState, useEffect, useRef, useCallback } from "react";
import { X, Gift, Calendar, Clock, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const PROGRAMS = [
  "Little Ninjas (Ages 3–5)",
  "Dragon Kids (Ages 5–12)",
  "Teens & Adults (Ages 13+)",
  "Kickboxing",
  "Not Sure Yet",
];

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Balloon component
function Balloon({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <div className="absolute pointer-events-none" style={style}>
      <div
        className="relative"
        style={{
          width: 40,
          height: 50,
          background: color,
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          boxShadow: `inset -6px -6px 12px rgba(0,0,0,0.15)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 2,
            height: 14,
            background: "#999",
          }}
        />
      </div>
    </div>
  );
}

export default function OnlineSpecialPopup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "celebrate" | "schedule" | "done">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string; program: string; instructor: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [balloons, setBalloons] = useState<Array<{ id: number; color: string; x: number; delay: number }>>([]);
  const hasShown = useRef(false);
  const confettiRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  // Fetch class schedule from local DB
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

  // Show popup after 4 seconds
  useEffect(() => {
    if (hasShown.current) return;
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("onlineSpecialDismissed");
      if (!dismissed) {
        setOpen(true);
        hasShown.current = true;
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const fireConfetti = useCallback(() => {
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#CC0000", "#FFD700", "#FF6B6B", "#4CAF50", "#2196F3", "#FF9800", "#E91E63"];

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        shapes: ["star", "circle"],
        scalar: 1.2,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        shapes: ["star", "circle"],
        scalar: 1.2,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Burst from center
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.6 },
      colors,
      shapes: ["star", "circle"],
      scalar: 1.4,
    });

    // Generate balloons
    const newBalloons = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      x: 5 + i * 12,
      delay: i * 0.15,
    }));
    setBalloons(newBalloons);
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!phone.trim()) errs.phone = "Phone number is required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = "Valid email is required";
    if (!program) errs.program = "Please select a program";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await submitLead.mutateAsync({
        campaign: "online_special",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        program: program,
        source: "popup_online_special",
      });
    } catch (_) {
      // Non-fatal — proceed to celebrate anyway
    }
    setStep("celebrate");
    setTimeout(() => fireConfetti(), 100);
  };

  const handleDismiss = () => {
    setOpen(false);
    sessionStorage.setItem("onlineSpecialDismissed", "1");
  };

  // Filter schedule by selected program
  const programKey = program.split(" (")[0]; // e.g. "Little Ninjas"
  const filteredSchedule = (scheduleData || []).filter(
    (s: any) =>
      s.isActive === 1 &&
      (programKey === "Not Sure Yet" ||
        s.program.toLowerCase().includes(programKey.toLowerCase()) ||
        programKey.toLowerCase().includes(s.program.toLowerCase()))
  );

  // Group by day
  const byDay: Record<string, any[]> = {};
  for (const slot of filteredSchedule) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
    byDay[slot.dayOfWeek].push(slot);
  }
  const sortedDays = DAY_ORDER.filter((d) => byDay[d]);

  // Get next occurrence of a day of week
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
    setSelectedSlot({ day: slot.dayOfWeek, time: slot.startTime, program: slot.program, instructor: slot.instructor });
    setSelectedDate(date);
    setStep("done");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Balloons */}
      {step === "celebrate" &&
        balloons.map((b) => (
          <Balloon
            key={b.id}
            color={b.color}
            style={{
              left: `${b.x}%`,
              bottom: "0%",
              animation: `floatUp 3s ease-in ${b.delay}s forwards`,
              zIndex: 10000,
            }}
          />
        ))}

      {/* Modal */}
      <div
        className={cn(
          "relative z-[10001] w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden",
          "animate-in fade-in zoom-in-95 duration-300"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-black via-zinc-900 to-red-950 px-6 pt-8 pb-6 text-center overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.3)_0%,_transparent_70%)]" />
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3 h-3" />
              Online Special
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-1">
              2 WEEKS FREE
            </h2>
            <p className="text-red-300 font-semibold text-sm uppercase tracking-wider">
              Karate Classes — Limited Time Offer
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === "form" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center mb-4">
                Claim your <strong>2 free weeks</strong> — fill out the form below and we'll get you started!
              </p>

              {/* Name */}
              <div>
                <Input
                  placeholder="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn("h-11", errors.name && "border-red-500")}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <Input
                  placeholder="Phone Number *"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn("h-11", errors.phone && "border-red-500")}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <Input
                  placeholder="Email Address *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-11", errors.email && "border-red-500")}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Program */}
              <div>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500",
                    errors.program ? "border-red-500" : "border-input",
                    !program && "text-gray-400"
                  )}
                >
                  <option value="" disabled>
                    Program Interested In *
                  </option>
                  {PROGRAMS.map((p) => (
                    <option key={p} value={p} className="text-black">
                      {p}
                    </option>
                  ))}
                </select>
                {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program}</p>}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitLead.isPending}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-base uppercase tracking-wider rounded-xl mt-2"
              >
                {submitLead.isPending ? "Submitting..." : "Claim My 2 Free Weeks →"}
              </Button>

              <p className="text-center text-xs text-gray-400">
                No credit card required. No commitment.
              </p>
            </div>
          )}

          {step === "celebrate" && (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-black mb-1">
                  🎉 Congratulations, {name.split(" ")[0]}!
                </h3>
                <p className="text-gray-600 text-sm">
                  You've claimed your <strong>2 FREE weeks</strong> of karate classes! Now let's pick your first class time.
                </p>
              </div>
              <Button
                onClick={() => setStep("schedule")}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-base uppercase tracking-wider rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule My First Class
              </Button>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                I'll schedule later
              </button>
            </div>
          )}

          {step === "schedule" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center mb-2">
                Choose a class time for <strong>{programKey === "Not Sure Yet" ? "your first visit" : programKey}</strong>:
              </p>

              {sortedDays.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">
                  Loading schedule...
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {sortedDays.map((day) => (
                    <div key={day}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{day}</p>
                      {byDay[day].map((slot: any) => (
                        <button
                          key={slot.id}
                          onClick={() => handleBookSlot(slot)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all text-left mb-1.5 group"
                        >
                          <div>
                            <p className="font-semibold text-sm text-black">{slot.program}</p>
                            <p className="text-xs text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
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

              <button
                onClick={handleDismiss}
                className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === "done" && selectedSlot && (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-black mb-2">You're All Set! 🥋</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Program</span>
                    <span className="font-semibold">{selectedSlot.program}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Day</span>
                    <span className="font-semibold">{selectedSlot.day}, {selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Time</span>
                    <span className="font-semibold">{selectedSlot.time}</span>
                  </div>
                  {selectedSlot.instructor && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Instructor</span>
                      <span className="font-semibold">{selectedSlot.instructor}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Location</span>
                    <span className="font-semibold">MyDojo HQ – Tomball</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  We'll send a confirmation to <strong>{email}</strong>. See you on the mat!
                </p>
              </div>
              <Button
                onClick={handleDismiss}
                className="w-full h-11 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl"
              >
                Got It — See You There! 🥋
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100vh) rotate(20deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
