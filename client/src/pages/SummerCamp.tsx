import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Star, Shield, Zap, Users, Heart, Trophy, Sun, Check, Gift } from "lucide-react";
import SEO from "@/components/SEO";
import { openIntakeChatbot } from "@/lib/chatbot";

// ─── CDN base ─────────────────────────────────────────────────────────────────
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";

// ─── Data ─────────────────────────────────────────────────────────────────────
const TOTAL_SPOTS = 30;
const INITIAL_TAKEN = 18;

const THEME_WEEKS = [
  { label: "JUNE 3 – JUNE 7",    theme: "NINJA WARRIOR WEEK",    desc: "Obstacle courses, speed challenges & ninja games!",       image: "/images/camp-weeks/karate-kids.webp",     badge: "#e53e3e" },
  { label: "JUNE 10 – JUNE 14",  theme: "WATER WAR WEEK",        desc: "Water games, slip n' slide & splash battles!",            image: "/images/summer-camp/water-activities.webp", badge: "#3182ce" },
  { label: "JUNE 17 – JUNE 21",  theme: "BOARD BREAKING WEEK",   desc: "Break barriers & boards. Build power & confidence!",      image: "/images/camp-weeks/board-breaking.webp",  badge: "#d69e2e" },
  { label: "JUNE 24 – JUNE 28",  theme: "NERF BATTLE WEEK",      desc: "Team battles, missions & strategy challenges!",           image: "/images/camp-weeks/self-defense.webp",    badge: "#38a169" },
  { label: "JULY 1 – JULY 5",    theme: "GLOW NIGHT WEEK",       desc: "Glow games, lasers & epic night adventures!",             image: "/images/camp-weeks/finale.webp",          badge: "#805ad5" },
  { label: "JULY 10 – JULY 14",  theme: "LEADERSHIP WEEK",       desc: "Life skills, team building & community service!",         image: "/images/camp-weeks/leadership.webp",      badge: "#ed8936" },
  { label: "JULY 17 – JULY 21",  theme: "TOURNAMENT PREP WEEK",  desc: "Sparring, drills & championship mindset training!",       image: "/images/camp-weeks/tournament.webp",      badge: "#2b6cb0" },
  { label: "JULY 24 – JULY 28",  theme: "WATER GUN FUN WEEK",    desc: "Epic water gun battles & outdoor adventures!",            image: `${CDN}/water-gun-fun_20404a48.jpg`,       badge: "#00b5d8" },
  { label: "JULY 31 – AUG 4",    theme: "BLACK BELT BOOTCAMP",   desc: "Advanced training, board breaks & championship drills!",  image: "/images/camp-weeks/black-belt.webp",      badge: "#1a202c" },
  { label: "AUG 7 – AUG 10",     theme: "SUMMER FINALE",         desc: "Awards ceremony, pizza party & epic memories!",           image: "/images/camp-weeks/weapons.webp",         badge: "#e53e3e" },
];

const SCHEDULE = [
  { time: "8:00 AM",  label: "DROP OFF",              desc: "Warm welcome & check-in",          icon: "🌅", bg: "#ed8936" },
  { time: "9:00 AM",  label: "MARTIAL ARTS TRAINING", desc: "Skills, drills & confidence building", icon: "🥋", bg: "#e53e3e" },
  { time: "11:00 AM", label: "GAMES & CHALLENGES",    desc: "Ninja courses, relay races & more", icon: "🏆", bg: "#38a169" },
  { time: "12:00 PM", label: "LUNCH TIME",            desc: "Bring lunch or add lunch option",   icon: "🍕", bg: "#3182ce" },
  { time: "1:00 PM",  label: "TEAM ACTIVITIES",       desc: "Group games, crafts & fun challenges", icon: "🎯", bg: "#805ad5" },
  { time: "3:00 PM",  label: "PICK UP",               desc: "Tired, happy & full of stories!",   icon: "🚗", bg: "#718096" },
];

const TESTIMONIALS = [
  { name: "Jessica M.", text: "My son begged to come back every day! The staff is amazing and the activities are top notch.",                 avatar: "/manus-storage/testimonial-jessica_86f2b45e.jpg", initials: "JM", color: "#e53e3e" },
  { name: "Michael T.", text: "My daughter has more confidence than ever and made so many new friends. Best investment we made!",          avatar: "/manus-storage/testimonial-michael_aa81d0ad.jpg", initials: "MT", color: "#3182ce" },
  { name: "Amanda R.",  text: "Best summer decision we made. The perfect mix of fun, fitness and martial arts!",                        avatar: "/manus-storage/testimonial-amanda_e12fc346.jpg", initials: "AR", color: "#38a169" },
  { name: "David K.",   text: "Our kids talk about camp all year long. The instructors are incredible role models. 10/10!",              avatar: "/manus-storage/testimonial-jessica_86f2b45e.jpg", initials: "DK", color: "#805ad5" },
  { name: "Sarah L.",   text: "My daughter went from shy to confident in one week. Absolutely life-changing experience!",                avatar: "/manus-storage/testimonial-amanda_e12fc346.jpg", initials: "SL", color: "#ed8936" },
];

const FAQS = [
  { q: "Is prior martial arts experience needed?",  a: "Not at all! Our camp is designed for all skill levels, from complete beginners to experienced students. Our certified instructors tailor activities to each child's ability." },
  { q: "What are the age ranges for camp?",         a: "Summer Camp is open to kids ages 5–14. We group children by age and skill level to ensure everyone has a great experience." },
  { q: "What time is drop off and pick up?",        a: "Drop off is at 8:00 AM and pick up is at 3:00 PM. Extended care options are available — contact us for details." },
  { q: "Is lunch provided?",                        a: "Campers bring their own lunch. We have a lunch period at noon. Snacks are provided in the morning. We are a nut-aware facility." },
  { q: "Do you offer extended care?",               a: "Yes! Extended care is available before and after camp hours. Please contact us to arrange this when registering." },
  { q: "What is included in the $49 pass?",         a: "The $49 3-Day Pass includes all martial arts training, ninja games, team activities, pizza on Fridays, and a MyDojo camp t-shirt. It's everything you need for an epic summer experience!" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SummerCamp() {
  const [spotsLeft, setSpotsLeft] = useState(TOTAL_SPOTS - INITIAL_TAKEN);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const bottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setStickyVisible(bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTestimonialIdx(p => (p + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSpotsLeft(p => (p > 4 && Math.random() > 0.97) ? p - 1 : p);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const taken = TOTAL_SPOTS - spotsLeft;
  const claimPass = () => openIntakeChatbot();

  const scrollTheme = (dir: "left" | "right") => {
    if (themeRef.current) {
      themeRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
    }
  };

  return (
    <>
      <SEO
        title="Summer Camp 2026 — 3 Days for $49 | MyDojo Martial Arts"
        description="Join MyDojo's action-packed Summer Camp! 3 days for only $49. Martial arts, ninja games, water battles & more for ages 5–14. Limited spots — register today!"
      />

      {/* ── STICKY BAR ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-6 py-3"
            style={{ background: "#cc0000" }}
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-yellow-300 shrink-0" />
              <span className="text-white font-bold text-sm md:text-base">
                ☀️ SUMMER CAMP SPECIAL: <span className="text-yellow-300 font-black">3 DAYS FOR ONLY $49!</span>
              </span>
            </div>
            <button
              onClick={claimPass}
              className="shrink-0 font-black uppercase tracking-wider text-xs md:text-sm px-5 py-2 rounded transition-colors"
              style={{ background: "#ecc94b", color: "#000" }}
            >
              CLAIM OFFER NOW →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full" style={{ fontFamily: "'Oswald', 'Impact', sans-serif" }}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative w-full overflow-hidden" style={{ minHeight: "600px" }}>
          {/* Full-width background image */}
          <div className="absolute inset-0">
            <img
              src="/manus-storage/8e083585-f603-439a-984f-ab1ee1a46df9_f2409561.png"
              alt="MyDojo Summer Camp"
              className="w-full h-full object-cover object-top"
            />
            {/* Dark overlay — heavier on left, lighter on right so image shows */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.1) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, rgba(0,0,0,0.5) 100%)" }} />
          </div>

          {/* Red diagonal accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: "#cc0000" }} />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 flex flex-col lg:flex-row items-start lg:items-center gap-8">

            {/* LEFT: Copy */}
            <div className="flex-1 max-w-xl">
              {/* Headline graphic — replaces text badge + h1 */}
              <div className="mb-4" style={{ maxWidth: 480 }}>
                <img
                  src="/manus-storage/4660e950-243b-4314-9e73-972d0ac40f8f_6afcbef1.png"
                  alt="Summer Camp Starts Here!"
                  className="w-full h-auto object-contain"
                  style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.7))" }}
                />
              </div>

              {/* Icon badges — 4-column grid matching mockup */}
              <div className="grid grid-cols-4 gap-3 mb-6" style={{ maxWidth: 340 }}>
                {[
                  { icon: "🥋", label: "MARTIAL\nARTS" },
                  { icon: "🎮", label: "GAMES &\nACTIVITIES" },
                  { icon: "👥", label: "NEW\nFRIENDS" },
                  { icon: "🍕", label: "PIZZA\nFRIDAYS" },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center text-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-white font-bold" style={{ fontSize: 9, letterSpacing: 0.5, lineHeight: 1.3, whiteSpace: "pre-line" }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Trust badge — matches mockup: group icon + text */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded mb-6" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Users className="w-10 h-10 text-white shrink-0" />
                <div>
                  <p className="text-white font-black text-sm leading-none">TRUSTED BY</p>
                  <p className="font-black text-xl leading-none" style={{ color: "#f6e05e" }}>500+ FAMILIES</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Offer — no card box, elements float directly on hero photo */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col items-start gap-3">
              {/* $49 price graphic */}
              <img
                src="/manus-storage/80ba2d25-3c98-4a3d-8ec1-671b987e2e81_a931f3d8.png"
                alt="3 Days for only $49 - Limited Time Offer"
                className="w-full h-auto object-contain"
                style={{ maxWidth: 320, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.6))" }}
              />

              {/* Checklist — matching mockup */}
              <div className="space-y-1.5">
                {["Martial Arts Training", "Ninja Games & Challenges", "Team Activities", "Pizza Fridays", "Camp T-Shirt Included"].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-green-400 font-black text-base leading-none">✓</span>
                    <span className="text-white font-semibold text-sm" style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.9)" }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="w-full space-y-2 pt-1">
                <button
                  onClick={claimPass}
                  className="w-full py-3 font-black uppercase tracking-wider text-white rounded transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: "#cc0000", fontSize: "1rem", maxWidth: 300 }}
                >
                  CLAIM SUMMER PASS →
                </button>
                <button
                  onClick={() => document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full py-2 font-bold uppercase tracking-wider text-center text-sm"
                  style={{ color: "#ffffff", textShadow: "1px 1px 4px rgba(0,0,0,0.9)" }}
                >
                  VIEW CAMP SCHEDULE
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── STICKY BAR (inline, below hero) ─────────────────────────────── */}
        <div className="w-full flex items-center justify-between px-6 py-3" style={{ background: "#cc0000" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">☀️</span>
            <span className="text-white font-bold text-sm md:text-base">
              SUMMER CAMP SPECIAL: <span className="font-black" style={{ color: "#f6e05e" }}>3 DAYS FOR ONLY $49!</span>
            </span>
          </div>
          <button
            onClick={claimPass}
            className="shrink-0 font-black uppercase tracking-wider text-xs md:text-sm px-5 py-2 rounded transition-colors"
            style={{ background: "#ecc94b", color: "#000" }}
          >
            CLAIM OFFER NOW →
          </button>
        </div>

        {/* ── WHY PARENTS LOVE MYDOJO ───────────────────────────────────────── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-black uppercase text-3xl md:text-4xl text-black mb-10">
              WHY PARENTS <span style={{ color: "#cc0000" }}>LOVE MYDOJO</span>
            </h2>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* 5 feature cards */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { Icon: Shield,  color: "#cc0000", title: "SAFE & SECURE",         desc: "A safe, structured environment you can trust." },
                  { Icon: Users,   color: "#ed8936", title: "POSITIVE ROLE MODELS",  desc: "Instructors who inspire and support your child." },
                  { Icon: Zap,     color: "#3182ce", title: "ACTIVE & ENGAGING",     desc: "High-energy activities that keep kids moving and learning." },
                  { Icon: Star,    color: "#cc0000", title: "BUILD CONFIDENCE",      desc: "Martial arts training that builds focus, respect & confidence." },
                  { Icon: Heart,   color: "#3182ce", title: "MAKE NEW FRIENDS",      desc: "Kids make friends, strengthen social skills and have fun!" },
                ].map(({ Icon, color, title, desc }) => (
                  <div key={title} className="flex flex-col items-center text-center p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
                    <Icon className="w-8 h-8 mb-2" style={{ color }} />
                    <p className="font-black text-xs uppercase text-black mb-1 leading-tight">{title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Photo with brush-stroke edge */}
              <div className="lg:w-72 shrink-0 relative rounded-xl overflow-hidden shadow-xl" style={{ minHeight: "280px" }}>
                <img
                  src="/manus-storage/why-parents-group_02fa50c1.jpg"
                  alt="MyDojo kids group"
                  className="w-full h-full object-cover"
                  style={{ minHeight: "280px" }}
                />
                {/* Brush-stroke left edge effect */}
                <div className="absolute inset-y-0 left-0 w-8" style={{ background: "linear-gradient(to right, white, transparent)" }} />
                <div className="absolute bottom-3 left-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-white text-sm font-bold ml-1 drop-shadow">500+ Reviews</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
        <section className="py-16" style={{ background: "#111" }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-black uppercase text-3xl md:text-4xl text-white text-center mb-10">
              WHAT <span style={{ color: "#cc0000" }}>PARENTS</span> ARE SAYING
            </h2>

            <div className="relative">
              {/* Prev */}
              <button
                onClick={() => setTestimonialIdx(p => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[0, 1, 2].map(offset => {
                  const t = TESTIMONIALS[(testimonialIdx + offset) % TESTIMONIALS.length];
                  return (
                    <motion.div
                      key={t.name + offset}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="rounded-xl p-5"
                      style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {/* Stars */}
                      <div className="flex gap-0.5 mb-3">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                      {/* Avatar + name */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-red-600">
                          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover object-top" />
                        </div>
                        <div>
                          <span className="text-white font-bold text-sm block">– {t.name}</span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Summer Camp 2025</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Next */}
              <button
                onClick={() => setTestimonialIdx(p => (p + 1) % TESTIMONIALS.length)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === testimonialIdx ? "24px" : "8px",
                    height: "8px",
                    background: i === testimonialIdx ? "#cc0000" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── DAILY SCHEDULE ────────────────────────────────────────────────── */}
        <section id="schedule" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-black uppercase text-3xl md:text-4xl text-black text-center mb-12">
              A DAY AT <span style={{ color: "#cc0000" }}>SUMMER CAMP</span>
            </h2>

            <div className="flex flex-col lg:flex-row gap-10 items-center">
              {/* Horizontal timeline */}
              <div className="flex-1">
                {/* Connecting line */}
                <div className="relative">
                  <div className="hidden md:block absolute top-6 left-6 right-6 h-0.5" style={{ background: "linear-gradient(to right, #ed8936, #e53e3e, #38a169, #3182ce, #805ad5, #718096)" }} />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {SCHEDULE.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col items-center text-center"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 shadow-lg relative z-10" style={{ background: item.bg }}>
                          {item.icon}
                        </div>
                        <p className="text-xs font-bold mb-0.5" style={{ color: "#718096" }}>{item.time}</p>
                        <p className="font-black text-xs uppercase text-black leading-tight mb-1">{item.label}</p>
                        <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action photo */}
              <div className="lg:w-80 shrink-0 rounded-xl overflow-hidden shadow-2xl" style={{ height: "320px" }}>
                <img
                  src="/images/camp-weeks/board-breaking.webp"
                  alt="Kid breaking board at camp"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── THEME WEEKS ───────────────────────────────────────────────────── */}
        <section className="py-16" style={{ background: "#0a0a0a" }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="font-black uppercase text-3xl md:text-5xl text-white mb-1">
                EPIC <span style={{ color: "#f6e05e" }}>THEME WEEKS!</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Each week is a new adventure!</p>
            </div>

            {/* Scrollable cards with arrows */}
            <div className="relative">
              {/* Left arrow */}
              <button
                onClick={() => scrollTheme("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <div
                ref={themeRef}
                className="flex gap-4 overflow-x-auto pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {THEME_WEEKS.map((week, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    onClick={claimPass}
                    className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer group"
                    style={{ width: "160px", height: "260px" }}
                  >
                    <img
                      src={week.image}
                      alt={week.theme}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }} />
                    <div className="absolute inset-0 p-3 flex flex-col justify-end">
                      <div
                        className="inline-block self-start text-white text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded mb-1"
                        style={{ background: week.badge }}
                      >
                        {week.label}
                      </div>
                      <p className="text-white font-black text-sm uppercase leading-tight mb-1">{week.theme}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{week.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scrollTheme("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </section>

        {/* ── SPOTS COUNTER + BRING A FRIEND ────────────────────────────────── */}
        <section className="py-10" style={{ background: "#111" }}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Spots */}
            <div className="flex items-center gap-5 rounded-xl p-6" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Users className="w-12 h-12 shrink-0" style={{ color: "#cc0000" }} />
              <div className="flex-1">
                <p className="text-white font-black text-lg uppercase mb-2">SPOTS ARE FILLING FAST!</p>
                <div className="w-full rounded-full h-3 mb-2" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <motion.div
                    className="h-3 rounded-full"
                    style={{ background: "#cc0000" }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(taken / TOTAL_SPOTS) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                  />
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)" }} className="text-sm">
                  <span className="font-black text-2xl" style={{ color: "#fc8181" }}>{taken}</span>
                  <span> / {TOTAL_SPOTS} SPOTS REMAINING</span>
                </p>
              </div>
            </div>

            {/* Bring a friend */}
            <div
              className="flex items-center gap-5 rounded-xl p-6 cursor-pointer hover:opacity-95 transition-opacity"
              style={{ background: "#ecc94b" }}
              onClick={claimPass}
            >
              <Gift className="w-12 h-12 shrink-0 text-black" />
              <div>
                <p className="font-black text-lg uppercase text-black">BRING A FRIEND DAY!</p>
                <p className="text-sm" style={{ color: "rgba(0,0,0,0.65)" }}>Bring a friend and you both get a special prize! 🎁</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT TO BRING + FAQ ───────────────────────────────────────────── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* What to bring */}
            <div>
              <h2 className="font-black uppercase text-2xl text-black mb-5">
                WHAT TO <span style={{ color: "#cc0000" }}>BRING</span>
              </h2>
              <div className="space-y-3 mb-6">
                {["Water Bottle", "Lunch (or add lunch option)", "Comfortable Clothes", "Positive Attitude!"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 shrink-0" style={{ color: "#38a169" }} />
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg" style={{ height: "200px" }}>
                <img src="/images/summer-camp/kids-training.webp" alt="Kids training" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* FAQ */}
            <div className="lg:col-span-1">
              <h2 className="font-black uppercase text-2xl text-black mb-5">
                FREQUENTLY ASKED <span style={{ color: "#cc0000" }}>QUESTIONS</span>
              </h2>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="font-bold text-black text-sm pr-3">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-3 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo */}
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ minHeight: "300px" }}>
              <img
                src="/images/summer-camp/activities-colorful.webp"
                alt="Happy campers"
                className="w-full h-full object-cover"
                style={{ minHeight: "300px" }}
              />
            </div>
          </div>
        </section>

        {/* ── CTA FOOTER ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #cc0000 0%, #e53e3e 50%, #ed8936 100%)" }}>
          {/* 3-column grid: left kid | center text | right kid */}
          <div className="max-w-7xl mx-auto px-6 grid xl:grid-cols-[200px_1fr_200px] grid-cols-1 gap-0 items-end">
            {/* Left kid — sits at bottom edge */}
            <div className="hidden xl:block" style={{ height: 320, overflow: "hidden" }}>
              <img src="/manus-storage/cta-kid-left_2282a125.jpg" alt="" className="w-full h-full object-cover object-top" />
            </div>

            {/* Center text */}
            <div className="text-center py-16 px-4">
              <h2 className="font-black uppercase text-white leading-tight mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
                GIVE THEM A SUMMER THEY'LL NEVER FORGET!
              </h2>
              <p className="text-white/80 text-lg mb-8">3 Days. Endless Adventures. Lifetime Memories.</p>
              <button
                onClick={claimPass}
                className="font-black uppercase tracking-wider text-black rounded-lg px-10 py-4 text-lg transition-all hover:opacity-90 hover:scale-105 shadow-2xl"
                style={{ background: "#f6e05e" }}
              >
                CLAIM 3 DAYS FOR ONLY $49 →
              </button>
              <p className="text-white/60 text-xs uppercase tracking-widest mt-4">LIMITED SUMMER SPOTS — RESERVE TODAY!</p>
            </div>

            {/* Right kid — sits at bottom edge */}
            <div className="hidden xl:block" style={{ height: 320, overflow: "hidden" }}>
              <img src="/manus-storage/cta-kid-right_83443a39.jpg" alt="" className="w-full h-full object-cover object-top" />
            </div>
          </div>

          {/* Trust bar */}
          <div className="relative z-10 border-t border-white/20 py-6">
            <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { icon: "🥋", label: "EXPERT INSTRUCTORS" },
                { icon: "🏛️", label: "STATE-OF-THE-ART FACILITY" },
                { icon: "❤️", label: "FOCUS ON CONFIDENCE, DISCIPLINE & FUN" },
                { icon: "⭐", label: "TRUSTED BY 500+ FAMILIES" },
              ].map(item => (
                <div key={item.label} className="text-white/80">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-xs font-bold uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
