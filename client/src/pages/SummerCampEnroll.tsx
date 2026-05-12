/**
 * SummerCampEnroll.tsx
 * Summer Camp enrollment page — bright summer redesign with nano banana card tiles.
 * URL: /summer-camp/enroll
 *
 * Pricing rules:
 *  - $129/week per student (existing member price)
 *  - Additional students in the same family: 50% off ($64.50/week)
 *  - Full summer (all 10 weeks): 15% bonus discount applied to total
 *  - Ages 5–14
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Users, Tag, Star, Sun, Loader2 } from "lucide-react";

// ─── Camp Week Definitions ────────────────────────────────────────────────────
const CAMP_WEEKS = [
  {
    id: "w1",
    label: "June 3 – June 7",
    theme: "Ninja Warrior Week",
    emoji: "🥷",
    color: "#FF6B35",
    bg: "#FFF3EE",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-ninja-CdzcWin5H9yaR7tPKgEoWf.webp",
  },
  {
    id: "w2",
    label: "June 10 – June 14",
    theme: "Water War Week",
    emoji: "💦",
    color: "#0EA5E9",
    bg: "#EFF9FF",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-water-war-j8fS7pgataa5MkRXhkQc8d.webp",
  },
  {
    id: "w3",
    label: "June 17 – June 21",
    theme: "Board Breaking Week",
    emoji: "🪵",
    color: "#D97706",
    bg: "#FFFBEB",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-board-breaking-XiGNFSZjNdQYhQzVfegNe7.webp",
  },
  {
    id: "w4",
    label: "June 24 – June 28",
    theme: "Nerf Battle Week",
    emoji: "🎯",
    color: "#16A34A",
    bg: "#F0FDF4",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-nerf-aXvN6WxZGwkFMjyroPPqVg.webp",
  },
  {
    id: "w5",
    label: "July 1 – July 5",
    theme: "Glow Night Week",
    emoji: "✨",
    color: "#7C3AED",
    bg: "#F5F3FF",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-glow-J7emoTKfGcvoKpUkmgxUzX.webp",
  },
  {
    id: "w6",
    label: "July 10 – July 14",
    theme: "Leadership Week",
    emoji: "⭐",
    color: "#EA580C",
    bg: "#FFF7ED",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-leadership-AyNxp7Q5g2c7AVBDw4oadJ.webp",
  },
  {
    id: "w7",
    label: "July 17 – July 21",
    theme: "Tournament Prep Week",
    emoji: "🏆",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-tournament-Av5LiP4jqschWMLYk92dRW.webp",
  },
  {
    id: "w8",
    label: "July 24 – July 28",
    theme: "Water Gun Fun Week",
    emoji: "🔫",
    color: "#0891B2",
    bg: "#ECFEFF",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-watergun-ay9di88LwWpndr3t8ytW2t.webp",
  },
  {
    id: "w9",
    label: "July 31 – Aug 4",
    theme: "Black Belt Bootcamp",
    emoji: "🥋",
    color: "#111827",
    bg: "#F9FAFB",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-blackbelt-eBw9jDNg8tQCULVhr3BACh.webp",
  },
  {
    id: "w10",
    label: "Aug 7 – Aug 10",
    theme: "Summer Finale 🎉",
    emoji: "🎊",
    color: "#DC2626",
    bg: "#FFF1F2",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-finale-ncm7YGJYYCEbRjtJtcwwBS.webp",
  },
];

const PRICE_PER_WEEK = 129;
const ADDITIONAL_STUDENT_DISCOUNT = 0.5;
const FULL_SUMMER_DISCOUNT = 0.15;

interface StudentInfo { name: string; age: string; }
type Step = "weeks" | "students" | "info" | "review";

export default function SummerCampEnroll() {
  const [step, setStep] = useState<Step>("weeks");
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [studentCount, setStudentCount] = useState(1);
  const [students, setStudents] = useState<StudentInfo[]>([{ name: "", age: "" }]);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const checkoutMutation = trpc.popup.createSummerCampEnrollCheckout.useMutation();

  const isFullSummer = selectedWeeks.size === CAMP_WEEKS.length;
  const weeksCount = selectedWeeks.size;

  const pricing = useMemo(() => {
    if (weeksCount === 0 || studentCount === 0) return null;
    const firstStudentSubtotal = weeksCount * PRICE_PER_WEEK;
    const additionalStudents = Math.max(0, studentCount - 1);
    const additionalSubtotal = additionalStudents * weeksCount * PRICE_PER_WEEK * (1 - ADDITIONAL_STUDENT_DISCOUNT);
    let subtotal = firstStudentSubtotal + additionalSubtotal;
    let fullSummerSavings = 0;
    if (isFullSummer) {
      fullSummerSavings = subtotal * FULL_SUMMER_DISCOUNT;
      subtotal = subtotal * (1 - FULL_SUMMER_DISCOUNT);
    }
    return { firstStudentSubtotal, additionalSubtotal, fullSummerSavings, total: subtotal, totalCents: Math.round(subtotal * 100) };
  }, [weeksCount, studentCount, isFullSummer]);

  const toggleWeek = (id: string) => {
    setSelectedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllWeeks = () => {
    if (isFullSummer) setSelectedWeeks(new Set());
    else setSelectedWeeks(new Set(CAMP_WEEKS.map(w => w.id)));
  };

  const handleStudentCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(10, count));
    setStudentCount(clamped);
    setStudents(prev => {
      const updated = [...prev];
      while (updated.length < clamped) updated.push({ name: "", age: "" });
      return updated.slice(0, clamped);
    });
  };

  const updateStudent = (idx: number, field: keyof StudentInfo, value: string) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleCheckout = async () => {
    if (!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()) { toast.error("Please fill in all parent/guardian fields."); return; }
    if (students.some(s => !s.name.trim() || !s.age.trim())) { toast.error("Please fill in name and age for each student."); return; }
    const ages = students.map(s => parseInt(s.age));
    if (ages.some(a => isNaN(a) || a < 5 || a > 14)) { toast.error("All students must be between ages 5 and 14."); return; }
    setIsLoading(true);
    try {
      const selectedWeekLabels = CAMP_WEEKS.filter(w => selectedWeeks.has(w.id)).map(w => w.theme);
      const result = await checkoutMutation.mutateAsync({
        weeks: selectedWeekLabels,
        students: students.map(s => ({ name: s.name, age: parseInt(s.age) })),
        parentName, parentEmail, parentPhone, isFullSummer,
        totalCents: pricing!.totalCents,
        origin: window.location.origin,
      });
      if (result.checkoutUrl) window.open(result.checkoutUrl, "_blank");
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedFromWeeks = selectedWeeks.size > 0;
  const canProceedFromStudents = students.every(s => s.name.trim() && s.age.trim());

  const stepLabels = ["Select Weeks", "Students", "Contact", "Review"];
  const steps: Step[] = ["weeks", "students", "info", "review"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #FFF9C4 0%, #FFEAA7 30%, #FFD3A5 60%, #FFBCBC 100%)" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)" }} className="shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
            <Sun className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <div className="text-white font-black text-xl tracking-wider drop-shadow">MYDOJO</div>
            <div className="text-orange-100 text-xs font-bold uppercase tracking-widest">☀️ Summer Camp Enrollment 2025</div>
          </div>
          <div className="ml-auto text-white text-right hidden sm:block">
            <div className="text-xs font-bold opacity-80">Ages 5–14</div>
            <div className="text-sm font-black">$129/week</div>
          </div>
        </div>
      </div>

      {/* ── Progress Steps ───────────────────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-orange-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-1">
          {steps.map((s, i) => {
            const isDone = i < stepIdx;
            const isCurrent = s === step;
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm transition-all ${isDone ? "bg-green-500 text-white" : isCurrent ? "bg-orange-500 text-white scale-110" : "bg-gray-200 text-gray-400"}`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${isCurrent ? "text-orange-600" : isDone ? "text-green-600" : "text-gray-400"}`}>{stepLabels[i]}</span>
                {i < 3 && <div className={`flex-1 h-1 rounded-full mx-1 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ══ STEP 1: Week Selection ══════════════════════════════════════ */}
        {step === "weeks" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">
                🏕️ Choose Your <span style={{ color: "#FF6B35" }}>Weeks!</span>
              </h1>
              <p className="text-gray-600 text-base">Pick individual weeks or grab all 10 for a <strong className="text-yellow-600">15% bonus discount!</strong></p>
            </div>

            {/* Full Summer Pass Banner */}
            <button
              onClick={selectAllWeeks}
              className={`w-full mb-6 p-5 rounded-2xl border-3 flex items-center gap-4 transition-all shadow-lg ${isFullSummer
                ? "border-yellow-400 shadow-yellow-200"
                : "border-transparent hover:shadow-xl"
              }`}
              style={{
                background: isFullSummer
                  ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
                  : "linear-gradient(135deg, #FFF9C4, #FFEAA7)",
                border: isFullSummer ? "3px solid #F59E0B" : "3px solid #FCD34D",
              }}
            >
              <div className="text-4xl">☀️</div>
              <div className="text-left flex-1">
                <div className="font-black text-gray-800 text-lg">Full Summer Pass — All 10 Weeks</div>
                <div className="text-sm text-gray-600">June 3 – Aug 10 · Save an extra <strong className="text-yellow-700">15%</strong> off the total!</div>
              </div>
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isFullSummer ? "bg-yellow-500 border-yellow-500" : "border-yellow-400 bg-white"}`}>
                {isFullSummer && <Check className="w-4 h-4 text-white" />}
              </div>
            </button>

            {/* Week Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAMP_WEEKS.map((week) => {
                const selected = selectedWeeks.has(week.id);
                return (
                  <button
                    key={week.id}
                    onClick={() => toggleWeek(week.id)}
                    className="text-left rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
                    style={{
                      border: selected ? `3px solid ${week.color}` : "3px solid transparent",
                      outline: selected ? `2px solid ${week.color}20` : "none",
                    }}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={week.image}
                        alt={week.theme}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay on selected */}
                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${week.color}30` }}>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: week.color }}>
                            <Check className="w-7 h-7 text-white" />
                          </div>
                        </div>
                      )}
                      {/* Date badge */}
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-gray-700 shadow">
                        {week.label}
                      </div>
                      {/* Price badge */}
                      <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-black text-white shadow" style={{ background: week.color }}>
                        $129
                      </div>
                    </div>
                    {/* Card body */}
                    <div className="p-3" style={{ background: selected ? week.bg : "white" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{week.emoji}</span>
                        <span className="font-black text-gray-800 text-sm leading-tight">{week.theme}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pricing Preview */}
            {pricing && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-5 border border-orange-100">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{weeksCount} week{weeksCount !== 1 ? "s" : ""} × ${PRICE_PER_WEEK}</span>
                  <span className="font-bold text-gray-700">${pricing.firstStudentSubtotal.toFixed(2)}</span>
                </div>
                {isFullSummer && (
                  <div className="flex justify-between text-sm text-yellow-600 mb-1 font-bold">
                    <span>🎉 Full Summer Discount (15%)</span>
                    <span>−${pricing.fullSummerSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-gray-800 text-xl border-t border-gray-100 pt-3 mt-2">
                  <span>Estimated Total</span>
                  <span style={{ color: "#FF6B35" }}>${pricing.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Per student. Additional students get 50% off!</p>
              </div>
            )}

            <Button
              onClick={() => setStep("students")}
              disabled={!canProceedFromWeeks}
              className="w-full mt-6 text-white font-black uppercase tracking-wider py-7 text-base rounded-2xl shadow-lg"
              style={{ background: canProceedFromWeeks ? "linear-gradient(135deg, #FF6B35, #FF4500)" : undefined }}
            >
              {canProceedFromWeeks ? `Continue — ${weeksCount} Week${weeksCount !== 1 ? "s" : ""} Selected →` : "Select at least 1 week to continue"}
            </Button>
          </div>
        )}

        {/* ══ STEP 2: Students ════════════════════════════════════════════ */}
        {step === "students" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-800 mb-2">👦 Student Details</h1>
              <p className="text-gray-600">Ages 5–14. <strong className="text-green-600">Additional students get 50% off!</strong></p>
            </div>

            {/* Student Count */}
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 border border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="font-black text-gray-800">Number of Students</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleStudentCountChange(studentCount - 1)} className="w-9 h-9 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center font-black text-orange-600 text-xl transition-colors">−</button>
                  <span className="w-8 text-center font-black text-2xl text-gray-800">{studentCount}</span>
                  <button onClick={() => handleStudentCountChange(studentCount + 1)} className="w-9 h-9 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center font-black text-orange-600 text-xl transition-colors">+</button>
                </div>
              </div>
              {studentCount > 1 && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mt-3">
                  <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-700 text-sm font-bold">
                    Students 2+ get 50% off — saving ${((studentCount - 1) * weeksCount * PRICE_PER_WEEK * ADDITIONAL_STUDENT_DISCOUNT).toFixed(2)}!
                  </span>
                </div>
              )}
            </div>

            {/* Student Forms */}
            <div className="space-y-4">
              {students.map((student, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-md p-5 border border-orange-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white shadow" style={{ background: "#FF6B35" }}>{idx + 1}</div>
                    <span className="font-black text-gray-800">{idx === 0 ? "First Student" : `Student ${idx + 1}`}</span>
                    {idx > 0 && <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-bold ml-1">50% OFF 🎉</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-500 text-xs mb-1 block font-bold">Student Name</Label>
                      <Input value={student.name} onChange={e => updateStudent(idx, "name", e.target.value)} placeholder="Full name" className="border-gray-200 focus:border-orange-400 rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-gray-500 text-xs mb-1 block font-bold">Age (5–14)</Label>
                      <Input type="number" min={5} max={14} value={student.age} onChange={e => updateStudent(idx, "age", e.target.value)} placeholder="Age" className="border-gray-200 focus:border-orange-400 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            {pricing && (
              <div className="mt-5 bg-white rounded-2xl shadow-lg p-5 border border-orange-100">
                <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Price Summary</div>
                <div className="flex justify-between text-sm text-gray-500 mb-1"><span>Student 1 — {weeksCount} week{weeksCount !== 1 ? "s" : ""}</span><span className="font-bold text-gray-700">${pricing.firstStudentSubtotal.toFixed(2)}</span></div>
                {studentCount > 1 && <div className="flex justify-between text-sm text-green-600 mb-1 font-bold"><span>{studentCount - 1} additional student{studentCount > 2 ? "s" : ""} (50% off)</span><span>${pricing.additionalSubtotal.toFixed(2)}</span></div>}
                {isFullSummer && <div className="flex justify-between text-sm text-yellow-600 mb-1 font-bold"><span>Full Summer Discount (15%)</span><span>−${pricing.fullSummerSavings.toFixed(2)}</span></div>}
                <div className="flex justify-between font-black text-gray-800 text-xl border-t border-gray-100 pt-3 mt-2">
                  <span>Total</span><span style={{ color: "#FF6B35" }}>${pricing.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep("weeks")} variant="outline" className="flex-1 border-gray-300 text-gray-600 rounded-2xl py-6">← Back</Button>
              <Button onClick={() => setStep("info")} disabled={!canProceedFromStudents} className="flex-1 text-white font-black uppercase tracking-wider py-6 rounded-2xl shadow-lg" style={{ background: "linear-gradient(135deg, #FF6B35, #FF4500)" }}>
                Continue →
              </Button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Parent/Guardian Info ════════════════════════════════ */}
        {step === "info" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-800 mb-2">📋 Parent / Guardian</h1>
              <p className="text-gray-600">We'll send your confirmation and receipt here.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100 space-y-4">
              <div>
                <Label className="text-gray-600 text-sm mb-1 block font-bold">Full Name *</Label>
                <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Your full name" className="border-gray-200 focus:border-orange-400 rounded-xl py-5" />
              </div>
              <div>
                <Label className="text-gray-600 text-sm mb-1 block font-bold">Email Address *</Label>
                <Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="your@email.com" className="border-gray-200 focus:border-orange-400 rounded-xl py-5" />
              </div>
              <div>
                <Label className="text-gray-600 text-sm mb-1 block font-bold">Phone Number *</Label>
                <Input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="(281) 555-1234" className="border-gray-200 focus:border-orange-400 rounded-xl py-5" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep("students")} variant="outline" className="flex-1 border-gray-300 text-gray-600 rounded-2xl py-6">← Back</Button>
              <Button onClick={() => setStep("review")} disabled={!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()} className="flex-1 text-white font-black uppercase tracking-wider py-6 rounded-2xl shadow-lg" style={{ background: "linear-gradient(135deg, #FF6B35, #FF4500)" }}>
                Review Order →
              </Button>
            </div>
          </div>
        )}

        {/* ══ STEP 4: Review & Checkout ════════════════════════════════════ */}
        {step === "review" && pricing && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-gray-800 mb-2">🎉 Review Your Order</h1>
              <p className="text-gray-600">Everything look good? Let's get those spots secured!</p>
            </div>

            {/* Selected Weeks Preview */}
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📅</span>
                <span className="font-black text-gray-800">Weeks Selected ({weeksCount})</span>
                {isFullSummer && <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full font-bold">Full Summer ⭐</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CAMP_WEEKS.filter(w => selectedWeeks.has(w.id)).map(w => (
                  <div key={w.id} className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-1.5">
                    <span className="text-sm">{w.emoji}</span>
                    <span className="text-xs font-bold text-gray-700 leading-tight">{w.theme.replace(" 🎉", "")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Students */}
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-3"><span className="text-xl">👦</span><span className="font-black text-gray-800">Students ({studentCount})</span></div>
              {students.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 font-medium">{s.name}, age {s.age}</span>
                  {i > 0 && <span className="text-xs text-green-600 font-black bg-green-50 px-2 py-0.5 rounded-full">50% off</span>}
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-orange-100">
              <div className="font-black text-gray-800 mb-2 flex items-center gap-2"><span>📋</span> Contact</div>
              <div className="text-gray-700 font-medium">{parentName}</div>
              <div className="text-gray-500 text-sm">{parentEmail}</div>
              <div className="text-gray-500 text-sm">{parentPhone}</div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 border border-orange-100">
              <div className="font-black text-gray-800 mb-3 flex items-center gap-2"><span>💰</span> Price Breakdown</div>
              <div className="flex justify-between text-sm text-gray-500 mb-1.5"><span>Student 1 — {weeksCount} week{weeksCount !== 1 ? "s" : ""} × ${PRICE_PER_WEEK}</span><span className="font-bold text-gray-700">${pricing.firstStudentSubtotal.toFixed(2)}</span></div>
              {studentCount > 1 && <div className="flex justify-between text-sm text-green-600 mb-1.5 font-bold"><span>{studentCount - 1} additional student{studentCount > 2 ? "s" : ""} (50% off)</span><span>${pricing.additionalSubtotal.toFixed(2)}</span></div>}
              {isFullSummer && <div className="flex justify-between text-sm text-yellow-600 mb-1.5 font-bold"><span>Full Summer Bonus Discount (15%)</span><span>−${pricing.fullSummerSavings.toFixed(2)}</span></div>}
              <div className="flex justify-between font-black text-gray-800 text-2xl border-t border-gray-100 pt-3 mt-2">
                <span>Total Due Today</span>
                <span style={{ color: "#FF6B35" }}>${pricing.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep("info")} variant="outline" className="flex-1 border-gray-300 text-gray-600 rounded-2xl py-6">← Back</Button>
              <Button onClick={handleCheckout} disabled={isLoading} className="flex-1 text-white font-black uppercase tracking-wider py-6 text-base rounded-2xl shadow-xl" style={{ background: "linear-gradient(135deg, #FF6B35, #FF4500)" }}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Redirecting...</> : `Pay $${pricing.total.toFixed(2)} →`}
              </Button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">🔒 Secure checkout powered by Stripe. Your card info is never stored on our servers.</p>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>Questions? Call us at <a href="tel:8774693656" className="font-bold text-orange-600 hover:underline">(877) 4-MYDOJO</a></p>
        <p className="mt-1 text-xs text-gray-400">MyDojo Martial Arts · Ages 5–14 · Summer 2025</p>
      </div>
    </div>
  );
}
