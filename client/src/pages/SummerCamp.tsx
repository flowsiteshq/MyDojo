import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Star, Shield, Zap, Users, Heart, Trophy, Sun, Check } from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { openIntakeChatbot } from "@/lib/chatbot";

// ─── Constants ────────────────────────────────────────────────────────────────

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";
const TOTAL_SPOTS = 30;
const INITIAL_SPOTS_TAKEN = 18; // live-looking counter seed

const THEME_WEEKS = [
  {
    dates: "June 3 – June 7",
    label: "JUNE 3 – JUNE 7",
    theme: "Ninja Warrior Week",
    desc: "Obstacle courses, speed challenges & ninja games!",
    color: "from-red-600 to-orange-500",
    image: "/images/camp-weeks/karate-kids.webp",
  },
  {
    dates: "June 10 – June 14",
    label: "JUNE 10 – JUNE 14",
    theme: "Water War Week",
    desc: "Water games, slip n' slide & splash battles!",
    color: "from-cyan-500 to-blue-600",
    image: "/images/summer-camp/water-activities.webp",
  },
  {
    dates: "June 17 – June 21",
    label: "JUNE 17 – JUNE 21",
    theme: "Board Breaking Week",
    desc: "Break barriers & boards. Build power & confidence!",
    color: "from-yellow-500 to-orange-600",
    image: "/images/camp-weeks/board-breaking.webp",
  },
  {
    dates: "June 24 – June 28",
    label: "JUNE 24 – JUNE 28",
    theme: "Nerf Battle Week",
    desc: "Team battles, missions & strategy challenges!",
    color: "from-green-500 to-teal-600",
    image: "/images/camp-weeks/self-defense.webp",
  },
  {
    dates: "July 1 – July 5",
    label: "JULY 1 – JULY 5",
    theme: "Glow Night Week",
    desc: "Glow games, lasers & epic night adventures!",
    color: "from-purple-600 to-pink-600",
    image: "/images/camp-weeks/finale.webp",
  },
  {
    dates: "July 10 – July 14",
    label: "JULY 10 – JULY 14",
    theme: "Leadership Week",
    desc: "Life skills, team building & community service!",
    color: "from-amber-500 to-yellow-400",
    image: "/images/camp-weeks/leadership.webp",
  },
  {
    dates: "July 17 – July 21",
    label: "JULY 17 – JULY 21",
    theme: "Tournament Prep Week",
    desc: "Sparring, drills & championship mindset training!",
    color: "from-blue-600 to-indigo-600",
    image: "/images/camp-weeks/tournament.webp",
  },
  {
    dates: "July 24 – July 28",
    label: "JULY 24 – JULY 28",
    theme: "Water Gun Fun Week",
    desc: "Epic water gun battles & outdoor adventures!",
    color: "from-sky-400 to-cyan-500",
    image: `${CDN}/water-gun-fun_20404a48.jpg`,
  },
  {
    dates: "July 31 – Aug 4",
    label: "JULY 31 – AUG 4",
    theme: "Black Belt Bootcamp",
    desc: "Advanced training, board breaks & championship drills!",
    color: "from-orange-600 to-red-700",
    image: "/images/camp-weeks/black-belt.webp",
  },
  {
    dates: "Aug 7 – Aug 10",
    label: "AUG 7 – AUG 10",
    theme: "Summer Finale Celebration",
    desc: "Awards ceremony, pizza party & epic memories!",
    color: "from-pink-500 to-rose-600",
    image: "/images/camp-weeks/weapons.webp",
  },
];

const DAILY_SCHEDULE = [
  { time: "8:00 AM", label: "DROP OFF", desc: "Warm welcome & check-in", icon: "🌅", color: "bg-orange-500" },
  { time: "9:00 AM", label: "MARTIAL ARTS TRAINING", desc: "Skills, drills & confidence building", icon: "🥋", color: "bg-red-600" },
  { time: "11:00 AM", label: "GAMES & CHALLENGES", desc: "Ninja courses, relay races & more", icon: "🏆", color: "bg-yellow-500" },
  { time: "12:00 PM", label: "LUNCH TIME", desc: "Bring lunch or add lunch option", icon: "🍕", color: "bg-green-500" },
  { time: "1:00 PM", label: "TEAM ACTIVITIES", desc: "Group games, crafts & fun challenges", icon: "🎯", color: "bg-blue-500" },
  { time: "3:00 PM", label: "PICK UP", desc: "Tired, happy & full of stories!", icon: "🚗", color: "bg-purple-500" },
];

const TESTIMONIALS = [
  {
    name: "Jessica M.",
    avatar: "/images/summer-camp/hero-colorful.webp",
    stars: 5,
    text: "My son begged to come back every day! The staff is amazing and the activities are top notch.",
    program: "Summer Camp 2025",
  },
  {
    name: "Michael T.",
    avatar: "/images/summer-camp/group-activity.webp",
    stars: 5,
    text: "My daughter has more confidence than ever and made so many new friends. Best investment we made!",
    program: "Summer Camp 2025",
  },
  {
    name: "Amanda R.",
    avatar: "/images/summer-camp/kids-training.webp",
    stars: 5,
    text: "Best summer decision we made. The perfect mix of fun, fitness and martial arts!",
    program: "Summer Camp 2025",
  },
  {
    name: "David K.",
    avatar: "/images/summer-camp/activities-colorful.webp",
    stars: 5,
    text: "Our kids talk about camp all year long. The instructors are incredible role models. 10/10!",
    program: "Summer Camp 2025",
  },
];

const FAQS = [
  { q: "Is prior martial arts experience needed?", a: "Not at all! Our camp is designed for all skill levels, from complete beginners to experienced students. Our certified instructors tailor activities to each child's ability." },
  { q: "What are the age ranges for camp?", a: "Summer Camp is open to kids ages 5–14. We group children by age and skill level to ensure everyone has a great experience." },
  { q: "What time is drop off and pick up?", a: "Drop off is at 8:00 AM and pick up is at 3:00 PM. Extended care options are available — contact us for details." },
  { q: "Is lunch provided?", a: "Campers bring their own lunch. We have a lunch period at noon. Snacks are provided in the morning. We are a nut-aware facility." },
  { q: "Do you offer extended care?", a: "Yes! Extended care is available before and after camp hours. Please contact us to arrange this when registering." },
  { q: "What is included in the $49 pass?", a: "The $49 intro pass includes 3 full days of camp, all activities, a camp t-shirt, and access to all theme week activities during your chosen days." },
];

const WHY_PARENTS = [
  { icon: Shield, title: "Safe & Secure", desc: "A safe, structured environment you can trust.", color: "text-red-500" },
  { icon: Users, title: "Positive Role Models", desc: "Instructors who inspire and support your child.", color: "text-orange-500" },
  { icon: Zap, title: "Active & Engaging", desc: "High-energy activities that keep kids moving and learning.", color: "text-yellow-500" },
  { icon: Star, title: "Build Confidence", desc: "Martial arts training that builds focus, respect & confidence.", color: "text-green-500" },
  { icon: Heart, title: "Make New Friends", desc: "Kids make friends, strengthen social skills and have fun!", color: "text-blue-500" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SummerCamp() {
  const [spotsLeft, setSpotsLeft] = useState(TOTAL_SPOTS - INITIAL_SPOTS_TAKEN);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [themeStart, setThemeStart] = useState(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Sticky bar appears after scrolling past hero
  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setStickyVisible(heroBottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Simulate live spots countdown (slow trickle for urgency)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft((prev) => {
        if (prev <= 4) return prev;
        const rand = Math.random();
        if (rand > 0.97) return prev - 1;
        return prev;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    const t = setInterval(() => {
      setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const visibleThemes = 5;
  const maxStart = THEME_WEEKS.length - visibleThemes;

  const claimPass = () => openIntakeChatbot();

  return (
    <>
      <SEO
        title="Summer Camp 2026 — 3 Days for $49 | MyDojo Martial Arts"
        description="Join MyDojo's action-packed Summer Camp! 3 days for only $49. Martial arts, ninja games, water battles & more for ages 5–14. Limited spots — register today!"
      />

      {/* ── Sticky Offer Bar ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-700 via-red-600 to-orange-500 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-yellow-300 shrink-0 animate-spin" style={{ animationDuration: "4s" }} />
                <span className="text-white font-bold text-sm md:text-base">
                  ☀️ SUMMER CAMP SPECIAL: <span className="text-yellow-300">3 DAYS FOR ONLY $49!</span>
                </span>
              </div>
              <button
                onClick={claimPass}
                className="shrink-0 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-wider text-xs md:text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                CLAIM OFFER NOW →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full bg-black">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Video / Image background */}
          <div className="absolute inset-0">
            <img
              src="/images/summer-camp/hero-colorful.webp"
              alt="MyDojo Summer Camp Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </div>

          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-orange-500/10"
                style={{
                  width: `${80 + i * 40}px`,
                  height: `${80 + i * 40}px`,
                  left: `${10 + i * 15}%`,
                  top: `${20 + (i % 3) * 20}%`,
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                CONFIDENCE. FRIENDSHIP. FUN.
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-4 uppercase">
                SUMMER CAMP<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  STARTS HERE!
                </span>
              </h1>

              <div className="flex flex-wrap gap-4 mb-8">
                {["Martial Arts", "Games & Activities", "New Friends", "Pizza Fridays"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-white/80 text-sm">
                    <Check className="w-4 h-4 text-yellow-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400" />)}
                  </div>
                  <p className="text-white/70 text-xs">Trusted by <strong className="text-white">500+ Families</strong></p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={claimPass}
                  className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-black uppercase tracking-wider text-lg px-8 py-4 rounded-xl shadow-2xl shadow-red-900/50 transition-all hover:scale-105 flex items-center gap-2"
                >
                  Claim Summer Pass →
                </button>
                <button
                  onClick={() => document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" })}
                  className="border-2 border-white/40 text-white hover:bg-white/10 font-bold uppercase tracking-wider text-lg px-8 py-4 rounded-xl transition-all backdrop-blur-sm"
                >
                  View Schedule
                </button>
              </div>
            </motion.div>

            {/* Right: Offer card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/30 to-red-500/30 rounded-3xl blur-2xl" />
                <div className="relative bg-black/70 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-red-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                      LIMITED TIME OFFER
                    </div>
                    <p className="text-white/70 text-sm uppercase tracking-widest mb-1">3 DAYS FOR ONLY</p>
                    <div className="text-8xl font-black text-yellow-400 leading-none">$49</div>
                    <p className="text-white/50 text-xs mt-1">Includes camp t-shirt + all activities</p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {["Martial Arts Training", "Ninja Games & Challenges", "Team Activities", "Pizza Fridays", "Camp T-Shirt Included"].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-white/90 text-sm">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={claimPass}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-black uppercase tracking-wider py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/50 text-sm"
                  >
                    CLAIM SUMMER PASS →
                  </button>
                  <button
                    onClick={() => document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full text-white/60 hover:text-white text-sm font-semibold uppercase tracking-wider mt-3 py-2 transition-colors"
                  >
                    VIEW CAMP SCHEDULE
                  </button>

                  {/* Spots counter */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
                      <span>Spots remaining</span>
                      <span className="text-red-400 font-bold">{spotsLeft} / {TOTAL_SPOTS}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((TOTAL_SPOTS - spotsLeft) / TOTAL_SPOTS) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-white/40" />
          </motion.div>
        </section>

        {/* ── WHY PARENTS LOVE MYDOJO ───────────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase mb-3">
                WHY PARENTS <span className="text-red-600">LOVE MYDOJO</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Feature cards */}
              <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                {WHY_PARENTS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-gray-50 rounded-2xl p-5 text-center hover:shadow-lg transition-shadow"
                    >
                      <Icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                      <h3 className="font-black text-sm text-black uppercase mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden shadow-2xl h-72 lg:h-full min-h-[280px]"
              >
                <img
                  src="/images/summer-camp/group-activity.webp"
                  alt="MyDojo Summer Camp Group"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white text-sm font-bold ml-2">500+ Reviews</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
        <section className="py-20 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase mb-3">
                WHAT <span className="text-red-500">PARENTS</span> ARE SAYING
              </h2>
            </div>

            <div className="relative">
              {/* Prev */}
              <button
                onClick={() => setActiveTestimonial((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {[0, 1, 2].map((offset) => {
                  const idx = (activeTestimonial + offset) % TESTIMONIALS.length;
                  const t = TESTIMONIALS[idx];
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: offset * 0.1 }}
                      className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex gap-1 mb-4">
                        {[...Array(t.stars)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-500 shrink-0">
                          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">— {t.name}</p>
                          <p className="text-white/40 text-xs">{t.program}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Next */}
              <button
                onClick={() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? "bg-red-500 w-6" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── DAILY SCHEDULE ────────────────────────────────────────────────── */}
        <section id="schedule" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-black uppercase mb-3">
                A DAY AT <span className="text-red-600">SUMMER CAMP</span>
              </h2>
              <p className="text-gray-500 text-lg">Every day is packed with adventure, learning, and fun!</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Timeline */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-orange-500 via-red-500 to-purple-500" />

                <div className="space-y-6">
                  {DAILY_SCHEDULE.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-5 pl-2"
                    >
                      {/* Dot */}
                      <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-xl shrink-0 shadow-lg z-10`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.time}</p>
                        <p className="text-black font-black text-base uppercase">{item.label}</p>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden shadow-2xl h-[480px]"
              >
                <img
                  src="/images/summer-camp/activities-colorful.webp"
                  alt="Kids at Summer Camp"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="font-black text-2xl uppercase">Full Day of Fun!</p>
                    <p className="text-white/70 text-sm">8:00 AM – 3:00 PM</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── THEME WEEKS ───────────────────────────────────────────────────── */}
        <section className="py-20 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase mb-3">
                EPIC <span className="text-yellow-400">THEME WEEKS!</span>
              </h2>
              <p className="text-white/50 text-lg">Each week is a new adventure!</p>
            </div>

            {/* Scrollable cards */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                {THEME_WEEKS.map((week, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="relative shrink-0 w-56 h-72 rounded-2xl overflow-hidden snap-start group cursor-pointer"
                    onClick={claimPass}
                  >
                    <img
                      src={week.image}
                      alt={week.theme}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent`} />
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <div className={`inline-block self-start bg-gradient-to-r ${week.color} text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full mb-2`}>
                        {week.label}
                      </div>
                      <h3 className="text-white font-black text-base uppercase leading-tight mb-1">{week.theme}</h3>
                      <p className="text-white/60 text-xs leading-relaxed">{week.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={claimPass}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-black uppercase tracking-wider px-10 py-4 rounded-xl transition-all hover:scale-105 shadow-xl text-sm"
              >
                REGISTER FOR A THEME WEEK →
              </button>
            </div>
          </div>
        </section>

        {/* ── SPOTS COUNTER + BRING A FRIEND ────────────────────────────────── */}
        <section className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spots counter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-8 flex items-center gap-6"
            >
              <div className="shrink-0">
                <Users className="w-12 h-12 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-lg uppercase mb-2">SPOTS ARE FILLING FAST!</p>
                <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                  <motion.div
                    className="bg-gradient-to-r from-red-600 to-orange-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${((TOTAL_SPOTS - spotsLeft) / TOTAL_SPOTS) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                  />
                </div>
                <p className="text-white/60 text-sm">
                  <span className="text-red-400 font-black text-xl">{TOTAL_SPOTS - spotsLeft}</span>
                  <span className="text-white/40"> / {TOTAL_SPOTS} SPOTS REMAINING</span>
                </p>
              </div>
            </motion.div>

            {/* Bring a friend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 flex items-center gap-6 cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={claimPass}
            >
              <div className="shrink-0">
                <Trophy className="w-12 h-12 text-black" />
              </div>
              <div>
                <p className="text-black font-black text-lg uppercase mb-1">BRING A FRIEND DAY!</p>
                <p className="text-black/70 text-sm">Bring a friend and you both get a special prize! 🎁</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── WHAT TO BRING + FAQ ───────────────────────────────────────────── */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* What to bring */}
            <div>
              <h2 className="text-3xl font-black text-black uppercase mb-6">
                WHAT TO <span className="text-red-600">BRING</span>
              </h2>
              <div className="space-y-3 mb-8">
                {["Water Bottle", "Lunch (or add lunch option)", "Comfortable Clothes", "Positive Attitude!"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
              <div className="relative rounded-2xl overflow-hidden h-48">
                <img
                  src="/images/summer-camp/kids-training.webp"
                  alt="Kids training at MyDojo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* FAQ */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-black text-black uppercase mb-6">
                FREQUENTLY ASKED <span className="text-red-600">QUESTIONS</span>
              </h2>
              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="font-bold text-black text-sm pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
        <section className="relative py-24 bg-black overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src="/images/summer-camp/activities-colorful.webp"
              alt="Summer Camp"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60" />
          </div>

          {/* Kids photos flanking */}
          <div className="absolute left-0 bottom-0 h-full w-48 hidden xl:block overflow-hidden">
            <img
              src="/images/summer-camp/hero-colorful.webp"
              alt="Happy camper"
              className="h-full w-full object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black" />
          </div>
          <div className="absolute right-0 bottom-0 h-full w-48 hidden xl:block overflow-hidden">
            <img
              src="/images/summer-camp/group-activity.webp"
              alt="Happy campers"
              className="h-full w-full object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight mb-4">
                GIVE THEM A SUMMER<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  THEY'LL NEVER FORGET!
                </span>
              </h2>
              <p className="text-white/70 text-xl mb-10">3 Days. Endless Adventures. Lifetime Memories.</p>

              <button
                onClick={claimPass}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-black uppercase tracking-wider text-xl px-12 py-5 rounded-xl transition-all hover:scale-105 shadow-2xl shadow-orange-900/50 mb-4"
              >
                CLAIM 3 DAYS FOR ONLY $49 →
              </button>
              <p className="text-white/40 text-sm uppercase tracking-widest">LIMITED SUMMER SPOTS — RESERVE TODAY!</p>
            </motion.div>
          </div>

          {/* Bottom trust bar */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 mt-16 border-t border-white/10 pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: "🥋", label: "EXPERT INSTRUCTORS" },
                { icon: "🏛️", label: "STATE-OF-THE-ART FACILITY" },
                { icon: "❤️", label: "FOCUS ON CONFIDENCE, DISCIPLINE & FUN" },
                { icon: "⭐", label: "TRUSTED BY 500+ FAMILIES" },
              ].map((item, i) => (
                <div key={i} className="text-white/60">
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
