/**
 * SummerCampOpenHouse.tsx
 * Landing page for the Summer Camp Open House event — Wed May 27th at 6PM
 * Includes: event details, daily schedule, theme weeks selector with payment
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Calendar, Clock, MapPin, Users, Star, ChevronRight, Flame,
  Check, CreditCard, Lock, CheckCircle, Loader2, ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Camp Weeks ──────────────────────────────────────────────────────────────
const CAMP_WEEKS = [
  { id: "w1", label: "June 3 – June 7",   theme: "Ninja Warrior Week",   emoji: "🥷", color: "#FF6B35", bg: "#FFF3EE", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-ninja-CdzcWin5H9yaR7tPKgEoWf.webp" },
  { id: "w2", label: "June 10 – June 14", theme: "Water War Week",        emoji: "💦", color: "#0EA5E9", bg: "#EFF9FF", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-water-war-j8fS7pgataa5MkRXhkQc8d.webp" },
  { id: "w3", label: "June 17 – June 21", theme: "Board Breaking Week",   emoji: "🪵", color: "#D97706", bg: "#FFFBEB", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-board-breaking-XiGNFSZjNdQYhQzVfegNe7.webp" },
  { id: "w4", label: "June 24 – June 28", theme: "Nerf Battle Week",      emoji: "🎯", color: "#16A34A", bg: "#F0FDF4", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-nerf-aXvN6WxZGwkFMjyroPPqVg.webp" },
  { id: "w5", label: "July 1 – July 5",   theme: "Glow Night Week",       emoji: "✨", color: "#7C3AED", bg: "#F5F3FF", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-glow-J7emoTKfGcvoKpUkmgxUzX.webp" },
  { id: "w6", label: "July 10 – July 14", theme: "Leadership Week",       emoji: "⭐", color: "#EA580C", bg: "#FFF7ED", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-leadership-AyNxp7Q5g2c7AVBDw4oadJ.webp" },
  { id: "w7", label: "July 17 – July 21", theme: "Tournament Prep Week",  emoji: "🏆", color: "#1D4ED8", bg: "#EFF6FF", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-tournament-Av5LiP4jqschWMLYk92dRW.webp" },
  { id: "w8", label: "July 24 – July 28", theme: "Water Gun Fun Week",    emoji: "🔫", color: "#0891B2", bg: "#ECFEFF", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-watergun-ay9di88LwWpndr3t8ytW2t.webp" },
  { id: "w9", label: "July 31 – Aug 4",   theme: "Black Belt Bootcamp",   emoji: "🥋", color: "#111827", bg: "#F9FAFB", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-blackbelt-eBw9jDNg8tQCULVhr3BACh.webp" },
  { id: "w10", label: "Aug 7 – Aug 10",   theme: "Summer Finale 🎉",      emoji: "🎊", color: "#DC2626", bg: "#FFF1F2", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/camp-week-finale-ncm7YGJYYCEbRjtJtcwwBS.webp" },
];

const PRICE_PER_WEEK = 129;
const ADDITIONAL_STUDENT_DISCOUNT = 0.5;
const FULL_SUMMER_DISCOUNT = 0.15;

function getAgeFromDob(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

// ─── Daily Schedule ───────────────────────────────────────────────────────────
const scheduleItems = [
  { time: "8:00 AM",  label: "Drop Off",           icon: "🚗", description: "Doors open — kids check in and get settled" },
  { time: "9:00 AM",  label: "Martial Arts Training", icon: "🥋", description: "Karate & kickboxing fundamentals with expert instructors" },
  { time: "11:00 AM", label: "Games & Challenges",  icon: "🎯", description: "Ninja obstacle courses, team competitions & fun drills" },
  { time: "12:00 PM", label: "Lunch Time",           icon: "🍕", description: "Bring your own lunch or add our lunch option" },
  { time: "1:00 PM",  label: "Team Activities",      icon: "🏆", description: "Group games, leadership challenges & themed adventures" },
  { time: "5:30 PM",  label: "Pick Up",              icon: "🏠", description: "Safe dismissal — daily recap shared with parents" },
];

interface StudentInfo { name: string; dob: string; }

export default function SummerCampOpenHouse() {
  const enrollRef = useRef<HTMLDivElement>(null);

  // ─── Enrollment state ───────────────────────────────────────────────────────
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [isFullSummerMode, setIsFullSummerMode] = useState(false);
  const [studentCount, setStudentCount] = useState(1);
  const [students, setStudents] = useState<StudentInfo[]>([{ name: "", dob: "" }]);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const tokenizerInstanceRef = useRef<{ submit: (amount?: string) => void } | null>(null);
  const tokenizerInitializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);

  const checkoutMutation = trpc.popup.createSummerCampEnrollCheckout.useMutation();

  const isFullSummer = isFullSummerMode || selectedWeeks.size === CAMP_WEEKS.length;
  const weeksCount = isFullSummerMode ? CAMP_WEEKS.length : selectedWeeks.size;

  const pricing = useMemo(() => {
    if (weeksCount === 0 || studentCount === 0) return null;
    const firstStudentSubtotal = weeksCount * PRICE_PER_WEEK;
    const additionalStudentsSubtotal = Math.max(0, studentCount - 1) * weeksCount * PRICE_PER_WEEK * (1 - ADDITIONAL_STUDENT_DISCOUNT);
    let subtotal = firstStudentSubtotal + additionalStudentsSubtotal;
    const fullSummerDiscount = isFullSummer ? subtotal * FULL_SUMMER_DISCOUNT : 0;
    const total = subtotal - fullSummerDiscount;
    return {
      subtotal,
      fullSummerDiscount,
      total,
      totalCents: Math.round(total * 100),
    };
  }, [weeksCount, studentCount, isFullSummer]);

  // Toggle week selection
  const toggleWeek = (id: string) => {
    if (isFullSummerMode) return;
    setSelectedWeeks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Full summer toggle
  const toggleFullSummer = () => {
    setIsFullSummerMode(prev => {
      if (!prev) setSelectedWeeks(new Set(CAMP_WEEKS.map(w => w.id)));
      else setSelectedWeeks(new Set());
      return !prev;
    });
  };

  // Sync student array length
  useEffect(() => {
    setStudents(prev => {
      const next = [...prev];
      while (next.length < studentCount) next.push({ name: "", dob: "" });
      return next.slice(0, studentCount);
    });
  }, [studentCount]);

  // Load FluidPay tokenizer script
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    if (window.Tokenizer) { setTokenizerReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerReady(true);
    script.onerror = () => setPaymentError("Failed to load payment form. Please refresh.");
    document.head.appendChild(script);
  }, []);

  // Initialize tokenizer when payment section is shown
  useEffect(() => {
    if (!showPayment) return;
    if (!tokenizerReady || tokenizerInitializedRef.current) return;
    if (!window.Tokenizer) return;
    tokenizerInitializedRef.current = true;
    try {
      const instance = new window.Tokenizer({
        apikey: import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "",
        container: "#oh-fluidpay-tokenizer",
        submission: async (resp) => {
          if (!resp.token || resp.status === "error") {
            setPaymentError(resp.error || "Card tokenization failed. Please check your card details.");
            setIsLoading(false);
            return;
          }
          try {
            const selectedWeekLabels = isFullSummerMode
              ? CAMP_WEEKS.map(w => w.theme)
              : CAMP_WEEKS.filter(w => selectedWeeks.has(w.id)).map(w => w.theme);
            await checkoutMutation.mutateAsync({
              token: resp.token,
              weeks: selectedWeekLabels,
              students: students.map(s => ({ name: s.name, age: getAgeFromDob(s.dob), dob: s.dob })),
              parentName, parentEmail, parentPhone,
              isFullSummer,
              totalCents: pricing!.totalCents,
            });
            setEnrollSuccess(true);
            toast.success("Enrollment complete! 🎉", { description: "Check your phone for a confirmation text." });
          } catch (err: any) {
            setPaymentError(err?.message ?? "Payment failed. Please try again.");
            setIsLoading(false);
          }
        },
        onLoad: () => {},
        settings: {
          payment: { types: ["card"] },
          styles: {
            body: { "font-family": "inherit", "background-color": "transparent" },
            inputs: { "border-radius": "8px", "border": "2px solid #e5e7eb", "padding": "12px 14px", "font-size": "16px", "height": "48px" },
            labels: { "font-size": "14px", "font-weight": "700", "color": "#111827", "margin-bottom": "6px" },
          },
        },
      });
      tokenizerInstanceRef.current = instance;
    } catch (err: any) {
      setPaymentError(`Payment form error: ${err?.message || "Unknown"}. Please refresh.`);
    }
  }, [showPayment, tokenizerReady]);

  const handleProceedToPayment = () => {
    if (weeksCount === 0) { toast.error("Please select at least one week."); return; }
    const validStudents = students.slice(0, studentCount).filter(s => s.name.trim() && s.dob);
    if (validStudents.length < studentCount) { toast.error("Please fill in all student names and dates of birth."); return; }
    if (!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()) { toast.error("Please fill in all contact information."); return; }
    setShowPayment(true);
    setTimeout(() => enrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSubmitPayment = () => {
    if (!tokenizerInstanceRef.current) { toast.error("Payment form not ready. Please wait."); return; }
    setIsLoading(true);
    setPaymentError(null);
    tokenizerInstanceRef.current.submit(pricing!.total.toFixed(2));
  };

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-black text-white">

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/summer-camp/hero-colorful.jpg" alt="MyDojo Summer Camp" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center py-20">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold uppercase tracking-widest px-4 py-2 mb-6 rounded-full">
            <Calendar className="w-4 h-4" /> Special Event — You're Invited!
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-heading font-black mb-4 leading-tight">
            SUMMER CAMP<span className="block text-primary">OPEN HOUSE</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Come meet our instructors, tour the facility, and register your child for the most epic summer ever!
          </motion.p>

          {/* Event Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            {[
              { icon: <Calendar className="w-6 h-6 text-primary flex-shrink-0" />, label: "Date", value: "Wednesday, May 27th" },
              { icon: <Clock className="w-6 h-6 text-primary flex-shrink-0" />, label: "Time", value: "6:00 PM" },
              { icon: <MapPin className="w-6 h-6 text-primary flex-shrink-0" />, label: "Location", value: "MyDojo Tomball", sub: "11721 Spring Cypress Rd, Tomball, TX 77377" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4">
                {item.icon}
                <div className="text-left">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="font-bold text-lg">{item.value}</p>
                  {(item as any).sub && <p className="text-xs text-gray-400 mt-0.5">{(item as any).sub}</p>}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center gap-2 bg-yellow-500 text-black font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-full mb-8">
            <Flame className="w-4 h-4" /> Only 12 Spots Remaining — Register at the Open House!
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => enrollRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider">
              Register Now <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={() => enrollRef.current?.scrollIntoView({ behavior: "smooth" })}
              variant="outline" className="border-white text-white hover:bg-white hover:text-black text-lg px-10 py-6 h-auto font-heading uppercase tracking-wider bg-transparent">
              View Schedule & Pricing
            </Button>
          </motion.div>

          <div className="mt-10 flex justify-center animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/50" />
          </div>
        </div>
      </section>

      {/* ── What to Expect ── */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Open House Night</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-black">WHAT TO EXPECT</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: "🥋", title: "Meet the Instructors", desc: "Get to know the coaches who will be leading your child through an amazing summer of martial arts, games, and growth." },
              { icon: "🏛️", title: "Tour the Facility", desc: "See our state-of-the-art training floor, mat areas, and all the spaces where the magic happens every day." },
              { icon: "📋", title: "Register & Pay On the Spot", desc: "Spots are extremely limited. Select your weeks, pay securely, and lock in your child's spot before they're gone!" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-heading font-bold mb-3">{item.title}</h4>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daily Schedule ── */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Camp Program</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-black">A DAY AT SUMMER CAMP</h3>
            <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">Every day is packed with martial arts, games, teamwork, and fun.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            {scheduleItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6 mb-6 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-xl flex-shrink-0">{item.icon}</div>
                  {i < scheduleItems.length - 1 && <div className="w-0.5 h-full bg-primary/30 mt-2 min-h-[2rem]" />}
                </div>
                <div className="pb-6 flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-primary font-bold text-lg font-heading">{item.time}</span>
                    <span className="text-white font-bold text-xl font-heading uppercase">{item.label}</span>
                  </div>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo Banner ── */}
      <section className="relative h-64 md:h-96 overflow-hidden">
        <img src="/images/summer-camp/kids-training.jpg" alt="Kids training at MyDojo Summer Camp" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl md:text-5xl font-heading font-black max-w-lg">
              CONFIDENCE. FRIENDSHIP. <span className="text-primary">FUN.</span>
            </h3>
          </div>
        </div>
      </section>

      {/* ── Enrollment Section ── */}
      <section ref={enrollRef} className="py-20 bg-zinc-950" id="enroll">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Register Now</h2>
            <h3 className="text-4xl md:text-5xl font-heading font-black">SELECT YOUR WEEKS</h3>
            <p className="text-gray-400 mt-4 text-lg">$129/week per student · Additional students 50% off · Full Summer = 15% bonus discount</p>
          </div>

          {enrollSuccess ? (
            <div className="text-center py-16">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-3xl font-heading font-black mb-3">YOU'RE ENROLLED! 🎉</h3>
              <p className="text-gray-400 text-lg mb-8">Check your phone — a confirmation text is on its way. We can't wait to see your child at camp!</p>
              <Link href="/summer-camp">
                <Button className="bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-wider px-8 py-4 h-auto">
                  View Full Camp Details
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Recurring / Full Summer toggle */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => { setIsFullSummerMode(false); setSelectedWeeks(new Set()); }}
                    className={`flex-1 rounded-xl p-4 border-2 text-left transition-all ${!isFullSummerMode ? 'border-primary bg-primary/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
                  >
                    <div className="font-bold text-lg mb-1">🗓️ Select Specific Weeks</div>
                    <div className="text-sm text-gray-400">Choose only the weeks you want — pay per week selected</div>
                  </button>
                  <button
                    onClick={toggleFullSummer}
                    className={`flex-1 rounded-xl p-4 border-2 text-left transition-all relative ${isFullSummerMode ? 'border-yellow-500 bg-yellow-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
                  >
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">SAVE 15%</div>
                    <div className="font-bold text-lg mb-1">☀️ Full Summer (All 10 Weeks)</div>
                    <div className="text-sm text-gray-400">Best value — 15% discount applied automatically</div>
                  </button>
                </div>
              </div>

              {/* Week Grid */}
              {!isFullSummerMode && (
                <div>
                  <p className="text-sm text-gray-400 mb-4 font-medium">Click to select the weeks you want:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {CAMP_WEEKS.map(week => {
                      const selected = selectedWeeks.has(week.id);
                      return (
                        <button key={week.id} onClick={() => toggleWeek(week.id)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${selected ? 'border-primary scale-105' : 'border-zinc-700 hover:border-zinc-500'}`}
                          style={{ minHeight: 120 }}>
                          <img src={week.image} alt={week.theme} className="w-full h-20 object-cover opacity-70" />
                          <div className="p-2">
                            <div className="text-xs font-bold" style={{ color: week.color }}>{week.emoji} {week.theme}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{week.label}</div>
                          </div>
                          {selected && (
                            <div className="absolute top-2 right-2 bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedWeeks.size > 0 && (
                    <p className="text-sm text-primary font-bold mt-3">{selectedWeeks.size} week{selectedWeeks.size !== 1 ? 's' : ''} selected</p>
                  )}
                </div>
              )}

              {isFullSummerMode && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                  <p className="text-yellow-400 font-bold">☀️ All 10 weeks selected — 15% full-summer discount applied!</p>
                </div>
              )}

              {/* Students */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h4 className="font-heading font-bold text-xl mb-4">👦 Students</h4>
                <div className="flex items-center gap-4 mb-4">
                  <Label className="text-white font-medium">Number of students:</Label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setStudentCount(Math.max(1, studentCount - 1))}
                      className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold text-lg">−</button>
                    <span className="w-8 text-center font-bold text-lg">{studentCount}</span>
                    <button onClick={() => setStudentCount(Math.min(6, studentCount + 1))}
                      className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center font-bold text-lg">+</button>
                  </div>
                  {studentCount > 1 && <span className="text-xs text-green-400 font-bold">Additional students 50% off!</span>}
                </div>
                <div className="space-y-3">
                  {students.slice(0, studentCount).map((student, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white text-sm mb-1 block">Student {i + 1} Name</Label>
                        <Input value={student.name} onChange={e => setStudents(prev => { const n = [...prev]; n[i] = { ...n[i], name: e.target.value }; return n; })}
                          placeholder="Full name" className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500" />
                      </div>
                      <div>
                        <Label className="text-white text-sm mb-1 block">Date of Birth</Label>
                        <Input type="date" value={student.dob} onChange={e => setStudents(prev => { const n = [...prev]; n[i] = { ...n[i], dob: e.target.value }; return n; })}
                          className="bg-zinc-800 border-zinc-600 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parent Info */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h4 className="font-heading font-bold text-xl mb-4">👨‍👩‍👧 Parent / Guardian Info</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white text-sm mb-1 block">Full Name</Label>
                    <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Your full name"
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500" />
                  </div>
                  <div>
                    <Label className="text-white text-sm mb-1 block">Email</Label>
                    <Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="your@email.com"
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500" />
                  </div>
                  <div>
                    <Label className="text-white text-sm mb-1 block">Phone</Label>
                    <Input type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="(555) 000-0000"
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Pricing Summary */}
              {pricing && (
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <h4 className="font-heading font-bold text-xl mb-4">💳 Pricing Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>First student × {weeksCount} week{weeksCount !== 1 ? 's' : ''} @ $129/wk</span>
                      <span>${(weeksCount * PRICE_PER_WEEK).toFixed(2)}</span>
                    </div>
                    {studentCount > 1 && (
                      <div className="flex justify-between text-gray-300">
                        <span>{studentCount - 1} additional student{studentCount > 2 ? 's' : ''} × {weeksCount} wk × $64.50 (50% off)</span>
                        <span>${((studentCount - 1) * weeksCount * PRICE_PER_WEEK * 0.5).toFixed(2)}</span>
                      </div>
                    )}
                    {isFullSummer && pricing.fullSummerDiscount > 0 && (
                      <div className="flex justify-between text-green-400 font-bold">
                        <span>Full Summer Discount (15%)</span>
                        <span>−${pricing.fullSummerDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-zinc-700 pt-2 flex justify-between text-white font-black text-xl">
                      <span>Total Due Today</span>
                      <span className="text-primary">${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment */}
              {!showPayment ? (
                <Button onClick={handleProceedToPayment} disabled={weeksCount === 0 || !parentName || !parentEmail || !parentPhone}
                  className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-6 h-auto font-heading uppercase tracking-wider">
                  <CreditCard className="mr-2 w-5 h-5" /> Proceed to Payment
                </Button>
              ) : (
                <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-green-400" />
                    <h4 className="font-heading font-bold text-xl">Secure Payment</h4>
                    <span className="ml-auto text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded">256-bit SSL</span>
                  </div>
                  {paymentError && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{paymentError}</div>
                  )}
                  {!tokenizerReady && !paymentError && (
                    <div className="flex items-center gap-2 text-gray-400 mb-4"><Loader2 className="animate-spin w-4 h-4" /> Loading payment form...</div>
                  )}
                  <div id="oh-fluidpay-tokenizer" className={tokenizerReady ? "block" : "hidden"} />
                  <Button onClick={handleSubmitPayment} disabled={isLoading || !tokenizerReady}
                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-white text-lg py-6 h-auto font-heading uppercase tracking-wider">
                    {isLoading ? <><Loader2 className="animate-spin mr-2 w-5 h-5" /> Processing...</> : <><Lock className="mr-2 w-5 h-5" /> Pay ${pricing?.total.toFixed(2)} & Enroll</>}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">Your card is processed securely via FluidPay. We never store your card details.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Why MyDojo ── */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-primary font-bold tracking-widest uppercase mb-2 text-sm">Why Choose Us</h2>
              <h3 className="text-4xl md:text-5xl font-heading font-black mb-8">WHY PARENTS LOVE MYDOJO</h3>
              <div className="space-y-5">
                {[
                  { icon: "🛡️", title: "Safe & Secure", desc: "A structured, supervised environment parents can trust." },
                  { icon: "⚡", title: "Active & Engaging", desc: "High-energy activities that keep kids moving and learning all day." },
                  { icon: "⭐", title: "Build Confidence", desc: "Martial arts training that builds focus, respect & self-esteem." },
                  { icon: "👥", title: "Make New Friends", desc: "Kids build friendships and social skills in a positive community." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="bg-zinc-900 p-3 rounded-lg text-2xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img src="/images/summer-camp/group-activity.jpg" alt="Kids enjoying summer camp" className="rounded-2xl w-full h-auto shadow-2xl" />
              <div className="absolute -bottom-4 -right-4 bg-primary text-white rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-white" />
                  <span className="font-bold text-lg">500+ Families</span>
                </div>
                <p className="text-sm text-white/80">Trust MyDojo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/summer-camp/hero.jpg')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-black/30 text-white text-sm font-bold uppercase tracking-widest px-4 py-2 mb-6 rounded-full">
            <Calendar className="w-4 h-4" /> Wednesday, May 27th at 6:00 PM
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-black mb-6">JOIN US AT THE OPEN HOUSE!</h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
            Meet our coaches, see the facility, and secure your child's spot before summer camp fills up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => enrollRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="bg-white text-primary hover:bg-black hover:text-white text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider shadow-xl">
              Register & Pay Now
            </Button>
            <a href="tel:8774693656">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider bg-transparent">
                Call (877) 4-MYDOJO
              </Button>
            </a>
          </div>
          <p className="mt-8 text-white/70 text-sm">
            MyDojo Tomball · 11721 Spring Cypress Rd, Tomball, TX 77377 · <Users className="inline w-4 h-4" /> Only 12 spots remaining
          </p>
        </div>
      </section>
    </div>
  );
}
