/**
 * SummerCampEnroll.tsx
 * Standalone Summer Camp enrollment page.
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
import { Check, ChevronDown, ChevronUp, Users, Calendar, Tag, Star } from "lucide-react";

// ─── Camp Week Definitions ────────────────────────────────────────────────────
const CAMP_WEEKS = [
  { id: "w1",  label: "June 3 – June 7",    theme: "Ninja Warrior Week",   badge: "#e53e3e" },
  { id: "w2",  label: "June 10 – June 14",  theme: "Water War Week",       badge: "#3182ce" },
  { id: "w3",  label: "June 17 – June 21",  theme: "Board Breaking Week",  badge: "#d69e2e" },
  { id: "w4",  label: "June 24 – June 28",  theme: "Nerf Battle Week",     badge: "#38a169" },
  { id: "w5",  label: "July 1 – July 5",    theme: "Glow Night Week",      badge: "#805ad5" },
  { id: "w6",  label: "July 10 – July 14",  theme: "Leadership Week",      badge: "#ed8936" },
  { id: "w7",  label: "July 17 – July 21",  theme: "Tournament Prep Week", badge: "#2b6cb0" },
  { id: "w8",  label: "July 24 – July 28",  theme: "Water Gun Fun Week",   badge: "#00b5d8" },
  { id: "w9",  label: "July 31 – Aug 4",    theme: "Black Belt Bootcamp",  badge: "#1a202c" },
  { id: "w10", label: "Aug 7 – Aug 10",     theme: "Summer Finale",        badge: "#e53e3e" },
];

const PRICE_PER_WEEK = 129;
const ADDITIONAL_STUDENT_DISCOUNT = 0.5; // 50% off
const FULL_SUMMER_DISCOUNT = 0.15; // 15% bonus discount

interface StudentInfo {
  name: string;
  age: string;
}

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

  // ─── Pricing Calculation ──────────────────────────────────────────────────
  const pricing = useMemo(() => {
    if (weeksCount === 0 || studentCount === 0) return null;

    // First student: full price
    const firstStudentSubtotal = weeksCount * PRICE_PER_WEEK;
    // Additional students: 50% off
    const additionalStudents = Math.max(0, studentCount - 1);
    const additionalSubtotal = additionalStudents * weeksCount * PRICE_PER_WEEK * (1 - ADDITIONAL_STUDENT_DISCOUNT);

    let subtotal = firstStudentSubtotal + additionalSubtotal;
    let fullSummerSavings = 0;

    if (isFullSummer) {
      fullSummerSavings = subtotal * FULL_SUMMER_DISCOUNT;
      subtotal = subtotal * (1 - FULL_SUMMER_DISCOUNT);
    }

    return {
      firstStudentSubtotal,
      additionalSubtotal,
      fullSummerSavings,
      total: subtotal,
      totalCents: Math.round(subtotal * 100),
    };
  }, [weeksCount, studentCount, isFullSummer]);

  // ─── Week Toggle ──────────────────────────────────────────────────────────
  const toggleWeek = (id: string) => {
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllWeeks = () => {
    if (isFullSummer) setSelectedWeeks(new Set());
    else setSelectedWeeks(new Set(CAMP_WEEKS.map((w) => w.id)));
  };

  // ─── Student Count Change ─────────────────────────────────────────────────
  const handleStudentCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(10, count));
    setStudentCount(clamped);
    setStudents((prev) => {
      const updated = [...prev];
      while (updated.length < clamped) updated.push({ name: "", age: "" });
      return updated.slice(0, clamped);
    });
  };

  const updateStudent = (idx: number, field: keyof StudentInfo, value: string) => {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  // ─── Checkout ─────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()) {
      toast.error("Please fill in all parent/guardian fields.");
      return;
    }
    if (students.some((s) => !s.name.trim() || !s.age.trim())) {
      toast.error("Please fill in name and age for each student.");
      return;
    }
    const ages = students.map((s) => parseInt(s.age));
    if (ages.some((a) => isNaN(a) || a < 5 || a > 14)) {
      toast.error("All students must be between ages 5 and 14.");
      return;
    }

    setIsLoading(true);
    try {
      const selectedWeekLabels = CAMP_WEEKS.filter((w) => selectedWeeks.has(w.id)).map((w) => w.theme);
      const result = await checkoutMutation.mutateAsync({
        weeks: selectedWeekLabels,
        students: students.map((s) => ({ name: s.name, age: parseInt(s.age) })),
        parentName,
        parentEmail,
        parentPhone,
        isFullSummer,
        totalCents: pricing!.totalCents,
        origin: window.location.origin,
      });
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step Validation ──────────────────────────────────────────────────────
  const canProceedFromWeeks = selectedWeeks.size > 0;
  const canProceedFromStudents = students.every((s) => s.name.trim() && s.age.trim());

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src="/images/logo.png" alt="MyDojo" className="h-8 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <div className="text-white font-black text-lg tracking-wider">MYDOJO</div>
            <div className="text-red-500 text-xs font-bold uppercase tracking-widest">Summer Camp Enrollment</div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {(["weeks", "students", "info", "review"] as Step[]).map((s, i) => {
            const labels = ["Select Weeks", "Students", "Contact", "Review"];
            const stepIdx = ["weeks", "students", "info", "review"].indexOf(step);
            const isDone = i < stepIdx;
            const isCurrent = s === step;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDone ? "bg-red-600 text-white" : isCurrent ? "bg-red-600 text-white" : "bg-zinc-700 text-zinc-400"}`}>
                  {isDone ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${isCurrent ? "text-white" : isDone ? "text-zinc-400" : "text-zinc-600"}`}>{labels[i]}</span>
                {i < 3 && <div className={`flex-1 h-px ${isDone ? "bg-red-600" : "bg-zinc-700"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── STEP 1: Week Selection ─────────────────────────────────────── */}
        {step === "weeks" && (
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider mb-1">Choose Your Weeks</h1>
            <p className="text-zinc-400 text-sm mb-6">Select the weeks you'd like to attend. Pick all 10 for a 15% bonus discount!</p>

            {/* Full Summer Toggle */}
            <button
              onClick={selectAllWeeks}
              className={`w-full mb-4 p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${isFullSummer ? "border-yellow-400 bg-yellow-400/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"}`}
            >
              <Star className={`w-5 h-5 flex-shrink-0 ${isFullSummer ? "text-yellow-400" : "text-zinc-500"}`} />
              <div className="text-left flex-1">
                <div className={`font-black uppercase tracking-wider text-sm ${isFullSummer ? "text-yellow-400" : "text-white"}`}>
                  Full Summer Pass — All 10 Weeks
                </div>
                <div className="text-xs text-zinc-400">Save an extra 15% when you book the entire summer</div>
              </div>
              {isFullSummer && <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
            </button>

            {/* Individual Weeks */}
            <div className="grid grid-cols-1 gap-2">
              {CAMP_WEEKS.map((week) => {
                const selected = selectedWeeks.has(week.id);
                return (
                  <button
                    key={week.id}
                    onClick={() => toggleWeek(week.id)}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${selected ? "border-red-500 bg-red-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}
                  >
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: selected ? "#ef4444" : "#52525b", backgroundColor: selected ? "#ef4444" : "transparent" }}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white">{week.theme}</div>
                      <div className="text-xs text-zinc-500">{week.label}</div>
                    </div>
                    <div className="text-sm font-bold text-zinc-300 flex-shrink-0">${PRICE_PER_WEEK}</div>
                  </button>
                );
              })}
            </div>

            {/* Pricing Preview */}
            {pricing && (
              <div className="mt-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                <div className="flex justify-between text-sm text-zinc-400 mb-1">
                  <span>{weeksCount} week{weeksCount !== 1 ? "s" : ""} × ${PRICE_PER_WEEK}</span>
                  <span>${pricing.firstStudentSubtotal.toFixed(2)}</span>
                </div>
                {isFullSummer && (
                  <div className="flex justify-between text-sm text-yellow-400 mb-1">
                    <span>Full Summer Discount (15%)</span>
                    <span>−${pricing.fullSummerSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-white text-lg border-t border-zinc-700 pt-2 mt-2">
                  <span>Estimated Total</span>
                  <span>${pricing.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Per student. Additional students 50% off.</p>
              </div>
            )}

            <Button
              onClick={() => setStep("students")}
              disabled={!canProceedFromWeeks}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider py-6 text-base"
            >
              Continue — {weeksCount} Week{weeksCount !== 1 ? "s" : ""} Selected
            </Button>
          </div>
        )}

        {/* ── STEP 2: Students ──────────────────────────────────────────── */}
        {step === "students" && (
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider mb-1">Student Details</h1>
            <p className="text-zinc-400 text-sm mb-6">Ages 5–14. Additional students get 50% off!</p>

            {/* Student Count */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-sm">Number of Students</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleStudentCountChange(studentCount - 1)} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold text-lg">−</button>
                  <span className="w-6 text-center font-black text-lg">{studentCount}</span>
                  <button onClick={() => handleStudentCountChange(studentCount + 1)} className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold text-lg">+</button>
                </div>
              </div>
              {studentCount > 1 && (
                <div className="flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-lg px-3 py-2">
                  <Tag className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 text-xs font-bold">Students 2+ get 50% off — saving ${((studentCount - 1) * weeksCount * PRICE_PER_WEEK * ADDITIONAL_STUDENT_DISCOUNT).toFixed(2)}!</span>
                </div>
              )}
            </div>

            {/* Student Forms */}
            <div className="space-y-4">
              {students.map((student, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs font-black">{idx + 1}</div>
                    <span className="font-bold text-sm">{idx === 0 ? "First Student" : `Student ${idx + 1}`}{idx > 0 ? " — 50% off" : ""}</span>
                    {idx > 0 && <span className="text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded-full font-bold">50% OFF</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs mb-1 block">Student Name</Label>
                      <Input
                        value={student.name}
                        onChange={(e) => updateStudent(idx, "name", e.target.value)}
                        placeholder="Full name"
                        className="bg-zinc-800 border-zinc-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs mb-1 block">Age (5–14)</Label>
                      <Input
                        type="number"
                        min={5}
                        max={14}
                        value={student.age}
                        onChange={(e) => updateStudent(idx, "age", e.target.value)}
                        placeholder="Age"
                        className="bg-zinc-800 border-zinc-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            {pricing && (
              <div className="mt-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Price Summary</div>
                <div className="flex justify-between text-sm text-zinc-400 mb-1">
                  <span>Student 1 — {weeksCount} week{weeksCount !== 1 ? "s" : ""}</span>
                  <span>${pricing.firstStudentSubtotal.toFixed(2)}</span>
                </div>
                {studentCount > 1 && (
                  <div className="flex justify-between text-sm text-green-400 mb-1">
                    <span>{studentCount - 1} additional student{studentCount > 2 ? "s" : ""} (50% off)</span>
                    <span>${pricing.additionalSubtotal.toFixed(2)}</span>
                  </div>
                )}
                {isFullSummer && (
                  <div className="flex justify-between text-sm text-yellow-400 mb-1">
                    <span>Full Summer Discount (15%)</span>
                    <span>−${pricing.fullSummerSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-white text-lg border-t border-zinc-700 pt-2 mt-2">
                  <span>Total</span>
                  <span>${pricing.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep("weeks")} variant="outline" className="flex-1 border-zinc-600 text-zinc-300 bg-transparent">Back</Button>
              <Button
                onClick={() => setStep("info")}
                disabled={!canProceedFromStudents}
                className="flex-2 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider py-6 flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Parent/Guardian Info ──────────────────────────────── */}
        {step === "info" && (
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider mb-1">Parent / Guardian</h1>
            <p className="text-zinc-400 text-sm mb-6">We'll send your confirmation and receipt here.</p>

            <div className="space-y-4">
              <div>
                <Label className="text-zinc-400 text-xs mb-1 block">Full Name *</Label>
                <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Your full name" className="bg-zinc-900 border-zinc-600 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs mb-1 block">Email Address *</Label>
                <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="your@email.com" className="bg-zinc-900 border-zinc-600 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs mb-1 block">Phone Number *</Label>
                <Input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="(281) 555-1234" className="bg-zinc-900 border-zinc-600 text-white" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep("students")} variant="outline" className="flex-1 border-zinc-600 text-zinc-300 bg-transparent">Back</Button>
              <Button
                onClick={() => setStep("review")}
                disabled={!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider py-6"
              >
                Review Order
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Checkout ─────────────────────────────────── */}
        {step === "review" && pricing && (
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider mb-1">Review Your Order</h1>
            <p className="text-zinc-400 text-sm mb-6">Everything look good? Proceed to secure checkout.</p>

            {/* Weeks */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="font-bold text-sm uppercase tracking-wider">Weeks Selected ({weeksCount})</span>
                {isFullSummer && <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700 px-2 py-0.5 rounded-full font-bold">Full Summer ⭐</span>}
              </div>
              <div className="space-y-1">
                {CAMP_WEEKS.filter((w) => selectedWeeks.has(w.id)).map((w) => (
                  <div key={w.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: w.badge }} />
                    <span className="text-white">{w.theme}</span>
                    <span className="text-zinc-500 text-xs">— {w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Students */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-red-500" />
                <span className="font-bold text-sm uppercase tracking-wider">Students ({studentCount})</span>
              </div>
              {students.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1">
                  <span className="text-white">{s.name}, age {s.age}</span>
                  {i > 0 && <span className="text-green-400 text-xs font-bold">50% off</span>}
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
              <div className="font-bold text-sm uppercase tracking-wider mb-2">Contact</div>
              <div className="text-sm text-zinc-300">{parentName}</div>
              <div className="text-sm text-zinc-400">{parentEmail}</div>
              <div className="text-sm text-zinc-400">{parentPhone}</div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
              <div className="font-bold text-sm uppercase tracking-wider mb-3">Price Breakdown</div>
              <div className="flex justify-between text-sm text-zinc-400 mb-1">
                <span>Student 1 — {weeksCount} week{weeksCount !== 1 ? "s" : ""} × ${PRICE_PER_WEEK}</span>
                <span>${pricing.firstStudentSubtotal.toFixed(2)}</span>
              </div>
              {studentCount > 1 && (
                <div className="flex justify-between text-sm text-green-400 mb-1">
                  <span>{studentCount - 1} additional student{studentCount > 2 ? "s" : ""} (50% off)</span>
                  <span>${pricing.additionalSubtotal.toFixed(2)}</span>
                </div>
              )}
              {isFullSummer && (
                <div className="flex justify-between text-sm text-yellow-400 mb-1">
                  <span>Full Summer Bonus Discount (15%)</span>
                  <span>−${pricing.fullSummerSavings.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-white text-xl border-t border-zinc-700 pt-3 mt-2">
                <span>Total Due Today</span>
                <span>${pricing.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep("info")} variant="outline" className="flex-1 border-zinc-600 text-zinc-300 bg-transparent">Back</Button>
              <Button
                onClick={handleCheckout}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider py-6 text-base"
              >
                {isLoading ? "Redirecting..." : `Pay $${pricing.total.toFixed(2)} →`}
              </Button>
            </div>

            <p className="text-center text-xs text-zinc-600 mt-4">🔒 Secure checkout powered by Stripe. Your card info is never stored on our servers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
