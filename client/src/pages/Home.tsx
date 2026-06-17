import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone, ChevronRight, Star, Shield, Award, Users, Zap, Heart,
  Target, BookOpen, CheckCircle, ArrowRight, ChevronLeft, ChevronRight as ChevronRightIcon,
  Clock, MapPin, Calendar
} from "lucide-react";
import { openIntakeChatbot } from "@/lib/chatbot";
import { IntakeChatbot } from "@/components/IntakeChatbot";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { useVisitorSms } from "@/hooks/useVisitorSms";
import { cn } from "@/lib/utils";

// ─── Image constants ────────────────────────────────────────────────────────
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";
const HERO_VIDEO = "/manus-storage/hero_montage_47ab46a1.mp4";
const LITTLE_NINJAS_IMG = `${CDN}/little-ninjas_25d41024.webp`;
const CORE_KIDS_IMG = `${CDN}/core-kids_baf3bc26.webp`;
const TEENS_ADULTS_IMG = `${CDN}/teens-adults_e35f9895.webp`;
const KICKBOXING_IMG = `${CDN}/kickboxing-bg_d4fcc4c5.webp`;
const POPUP_CHILD = `${CDN}/popup-card-child-bLGQWmY93vixcyFEBo3Jf9.webp`;
const POPUP_FAMILY = `${CDN}/popup-card-family-AsxQoWfuzLKSK4vLwUoDoW.webp`;
const POPUP_MYSELF = `${CDN}/popup-card-myself-Q28shwqFCizjLa57ncRJDq.webp`;
const POPUP_TEEN = `${CDN}/popup-card-summer-camp-Ny6vLhvcXXKGLB6qNNbyUC.webp`;
const TRAINING_FLOOR = `${CDN}/tomball-training-floor_9a2c684b.jpg`;
const MAIN_FLOOR = `${CDN}/tomball-main-floor_284d59f6.jpg`;

// ─── Countdown Timer ─────────────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-black text-white leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] uppercase tracking-widest text-gray-300 mt-0.5">{label}</span>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ onBookClass }: { onBookClass: () => void }) {
  const deadline = useMemo(() => new Date("2026-07-25T23:59:59"), []);
  const timeLeft = useCountdown(deadline);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Background video — looping montage */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Darkening overlays for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl">
          {/* Urgency badge — inline above eyebrow */}
          <div className="inline-flex items-center gap-3 bg-black/70 backdrop-blur border border-[#e63946]/50 rounded-lg px-4 py-3 mb-5 shadow-xl">
            <div className="text-center">
              <p className="text-white font-black text-xs uppercase tracking-wider">LIMITED SPOTS!</p>
              <p className="text-[#e63946] font-bold text-[10px] mt-0.5">100 New Members Before July 25</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <CountdownUnit value={timeLeft.days} label="Days" />
              <span className="text-white font-black text-base pb-3">:</span>
              <CountdownUnit value={timeLeft.hours} label="Hrs" />
              <span className="text-white font-black text-base pb-3">:</span>
              <CountdownUnit value={timeLeft.minutes} label="Mins" />
              <span className="text-white font-black text-base pb-3">:</span>
              <CountdownUnit value={timeLeft.seconds} label="Secs" />
            </div>
          </div>

          {/* Eyebrow */}
          <p className="text-[#e63946] font-bold uppercase tracking-[0.25em] text-sm mb-4">
            Tomball's Favorite Martial Arts School
          </p>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.0] mb-2 uppercase tracking-tight">
            BUILD CONFIDENCE.
          </h1>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.0] mb-2 uppercase tracking-tight">
            LEARN SELF DEFENSE.
          </h1>
          <h1 className="text-5xl md:text-7xl font-black text-[#e63946] leading-[1.0] mb-6 uppercase tracking-tight">
            HAVE FUN.
          </h1>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: "Ages 3+" },
              { label: "Teens & Adults" },
              { label: "Kickboxing" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2">
                <Shield className="h-4 w-4 text-[#e63946]" />
                <span className="text-white font-semibold text-sm">{b.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={onBookClass}
              className="group flex items-center justify-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-black uppercase tracking-wider text-lg px-8 py-4 rounded-sm transition-all duration-200 shadow-[0_0_30px_rgba(230,57,70,0.4)]"
            >
              BOOK YOUR FREE CLASS
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="tel:+18774693656"
              className="flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white font-bold uppercase tracking-wider text-base px-6 py-4 rounded-sm transition-all duration-200 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              (877) 4-MYDOJO
            </a>
          </div>
        </div>
      </div>




    </section>
  );
}

// ─── Enrollment Cards ─────────────────────────────────────────────────────────
function EnrollmentSection({ onBookClass }: { onBookClass: () => void }) {
  const cards = [
    {
      id: "child",
      title: "My Child",
      ages: "Ages 3-12",
      img: POPUP_CHILD,
      desc: "Build confidence, focus, and discipline for life.",
    },
    {
      id: "teen",
      title: "Teen",
      ages: "Ages 13-17",
      img: POPUP_TEEN,
      desc: "Develop leadership, respect, and self-defense skills.",
    },
    {
      id: "myself",
      title: "Myself",
      ages: "Adults 18+",
      img: POPUP_MYSELF,
      desc: "Get fit, learn self-defense, and feel unstoppable.",
    },
    {
      id: "family",
      title: "Family",
      ages: "Multiple Members",
      img: POPUP_FAMILY,
      desc: "Train together, grow together, succeed together.",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
            WHO ARE <span className="text-[#e63946]">YOU</span> ENROLLING?
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(card => (
            <div
              key={card.id}
              className="group relative bg-white border-2 border-gray-100 hover:border-[#e63946] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={onBookClass}
            >
              <div className="relative h-48 md:h-56 overflow-hidden">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="font-black text-lg text-black uppercase">{card.title}</h3>
                <p className="text-xs text-gray-500 font-medium mb-2">{card.ages}</p>
                <p className="text-sm text-gray-600 mb-4 leading-snug">{card.desc}</p>
                <button
                  className="w-full flex items-center justify-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-bold uppercase text-sm py-2.5 rounded transition-colors"
                >
                  SELECT <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── What Your Child Will Learn ───────────────────────────────────────────────
function WhatTheyLearnSection({ onBookClass }: { onBookClass: () => void }) {
  const values = [
    { icon: <Award className="h-8 w-8 text-white" />, label: "Confidence" },
    { icon: <Heart className="h-8 w-8 text-white" />, label: "Respect" },
    { icon: <Target className="h-8 w-8 text-white" />, label: "Focus" },
    { icon: <Zap className="h-8 w-8 text-white" />, label: "Discipline" },
    { icon: <Shield className="h-8 w-8 text-white" />, label: "Anti-Bullying" },
    { icon: <Users className="h-8 w-8 text-white" />, label: "Fitness" },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={TRAINING_FLOOR} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/80" />
      </div>
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            WHAT YOUR CHILD <span className="text-[#e63946]">WILL LEARN</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-12">
          {values.map(v => (
            <div key={v.label} className="flex flex-col items-center gap-3 group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-[#e63946]/20 group-hover:border-[#e63946] transition-all duration-300">
                {v.icon}
              </div>
              <p className="text-white font-bold text-xs md:text-sm uppercase tracking-wider text-center">{v.label}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={onBookClass}
            className="inline-flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-black uppercase tracking-wider text-lg px-10 py-4 rounded-sm transition-all duration-200"
          >
            BOOK FREE CLASS <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Summer Special Banner ────────────────────────────────────────────────────
function SummerSpecialSection({ onBookClass }: { onBookClass: () => void }) {
  return (
    <section className="py-0 bg-black overflow-hidden">
      <div className="relative">
        {/* Gold/Red gradient bar */}
        <div className="bg-gradient-to-r from-[#e63946] via-[#c1121f] to-[#e63946] py-3 text-center">
          <p className="text-white font-black uppercase tracking-[0.3em] text-sm">
            SUMMER SPECIAL — LIMITED TIME OFFER
          </p>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Summer Special badge */}
            <div className="flex-shrink-0 text-center">
              <div className="relative inline-block">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex flex-col items-center justify-center shadow-[0_0_60px_rgba(255,215,0,0.4)]">
                  <span className="text-black font-black text-2xl uppercase leading-tight">SUMMER</span>
                  <span className="text-black font-black text-3xl uppercase leading-tight">SPECIAL</span>
                  <span className="text-black text-xs font-bold mt-1">2026</span>
                </div>
              </div>
            </div>

            {/* Middle: Offers */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "FREE", item: "Uniform", value: "$60 VALUE", icon: <Shield className="h-8 w-8 text-[#FFD700]" /> },
                { label: "FREE", item: "Beginner Class", value: "$49 VALUE", icon: <Calendar className="h-8 w-8 text-[#FFD700]" /> },
                { label: "FREE", item: "Confidence Assessment", value: "$49 VALUE", icon: <CheckCircle className="h-8 w-8 text-[#FFD700]" /> },
              ].map(offer => (
                <div key={offer.item} className="text-center border border-[#FFD700]/30 rounded-xl p-6 bg-white/5">
                  <div className="flex justify-center mb-3">{offer.icon}</div>
                  <p className="text-[#FFD700] font-black text-2xl uppercase">{offer.label}</p>
                  <p className="text-white font-bold text-lg uppercase leading-tight">{offer.item}</p>
                  <p className="text-gray-400 text-sm mt-1">{offer.value}</p>
                </div>
              ))}
            </div>

            {/* Right: Urgency + CTA */}
            <div className="flex-shrink-0 text-center bg-white rounded-xl p-8 shadow-2xl">
              <p className="text-black font-black text-lg uppercase">ONLY</p>
              <p className="text-[#e63946] font-black text-6xl leading-none">25</p>
              <p className="text-black font-bold text-sm uppercase mb-4">SUMMER SPOTS<br />REMAINING!</p>
              <button
                onClick={onBookClass}
                className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFC000] text-black font-black uppercase tracking-wider px-6 py-3 rounded-sm transition-colors"
              >
                BOOK TODAY <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof / Testimonials ──────────────────────────────────────────────
function TestimonialsSection({ onBookClass }: { onBookClass: () => void }) {
  const [idx, setIdx] = useState(0);
  const testimonials = [
    {
      name: "Jessica M.",
      role: "Parent",
      text: "My son has more confidence and focus than ever before. The instructors truly care!",
      stars: 5,
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/HONlObwBdLAnGGRP.jpg",
    },
    {
      name: "Michael T.",
      role: "Parent",
      text: "The best decision we made for our daughter. She loves every class and has learned so much!",
      stars: 5,
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uMNMXRfxfSZQbfbK.jpg",
    },
    {
      name: "Sarah K.",
      role: "Parent",
      text: "Clean facility, amazing staff, and a positive environment. Highly recommend!",
      stars: 5,
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/POUQPzFzOxDdiDNV.jpg",
    },
    {
      name: "David R.",
      role: "Parent",
      text: "Nothing stuck until MyDojo. The structure has helped my daughter improve her grades too!",
      stars: 5,
      avatar: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ISYgyHwTaHvYSOvQ.jpg",
    },
    {
      name: "Amanda T.",
      role: "Parent — Summer Camp",
      text: "Best summer decision we made. My kids talk about camp all year long!",
      stars: 5,
      avatar: `${CDN}/testimonial-amanda_e12fc346.jpg`,
    },
  ];

  const prev = () => setIdx(i => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIdx(i => (i + 1) % testimonials.length);

  // Show 3 at a time on desktop
  const visible = [0, 1, 2].map(offset => testimonials[(idx + offset) % testimonials.length]);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-[#FFD700] text-[#FFD700]" />
            ))}
            <span className="ml-2 text-2xl font-black text-black">5.0</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
            SEE WHY FAMILIES <span className="text-[#e63946]">LOVE</span> MYDOJO
          </h2>
          <p className="text-gray-500 mt-2">500+ five-star reviews on Google & Facebook</p>
        </div>

        {/* Testimonial cards */}
        <div className="relative mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visible.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${t.name}&background=e63946&color=fff`; }}
                  />
                  <div>
                    <p className="font-bold text-sm text-black">– {t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-[#e63946] flex items-center justify-center transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={cn("w-2 h-2 rounded-full transition-all", i === idx ? "bg-[#e63946] w-6" : "bg-gray-300")}
                />
              ))}
            </div>
            <button onClick={next} className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-[#e63946] flex items-center justify-center transition-colors">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Why MyDojo ───────────────────────────────────────────────────────────────
function WhyMyDojoSection() {
  const reasons = [
    { icon: <Shield className="h-6 w-6" />, title: "Safe Facility", desc: "Clean, family-friendly environment with certified instructors." },
    { icon: <Award className="h-6 w-6" />, title: "Experienced Instructors", desc: "Decades of combined martial arts expertise and teaching experience." },
    { icon: <Heart className="h-6 w-6" />, title: "Character Development", desc: "We build confident, respectful, and disciplined young leaders." },
    { icon: <BookOpen className="h-6 w-6" />, title: "Structured Curriculum", desc: "Progressive belt system with clear goals and achievements." },
    { icon: <Zap className="h-6 w-6" />, title: "Fitness & Health", desc: "Full-body workouts that improve strength, flexibility, and cardio." },
    { icon: <Target className="h-6 w-6" />, title: "Leadership Training", desc: "Programs designed to develop tomorrow's leaders today." },
    { icon: <Users className="h-6 w-6" />, title: "Family Environment", desc: "A welcoming community where every member feels at home." },
    { icon: <CheckCircle className="h-6 w-6" />, title: "Anti-Bullying Focus", desc: "Practical tools to handle conflict with confidence and calm." },
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            WHY CHOOSE <span className="text-[#e63946]">MYDOJO?</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {reasons.map(r => (
            <div key={r.title} className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#e63946]/50 hover:bg-white/10 transition-all duration-300">
              <div className="text-[#e63946] mb-3 group-hover:scale-110 transition-transform">{r.icon}</div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-2">{r.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Programs Section ─────────────────────────────────────────────────────────
function ProgramsSection({ onBookClass }: { onBookClass: () => void }) {
  const programs = [
    {
      title: "Little Ninjas",
      ages: "Ages 3–5",
      img: LITTLE_NINJAS_IMG,
      benefits: ["Listening skills", "Balance & coordination", "Social development", "Fun & safe environment"],
      href: "/programs#little-ninjas",
    },
    {
      title: "Kids Martial Arts",
      ages: "Ages 5–12",
      img: CORE_KIDS_IMG,
      benefits: ["Self-discipline", "Anti-bullying", "Confidence building", "Belt progression"],
      href: "/programs#dragon-kids",
    },
    {
      title: "Teens & Adults",
      ages: "Ages 13+",
      img: TEENS_ADULTS_IMG,
      benefits: ["Self-defense", "Leadership skills", "Stress relief", "Physical fitness"],
      href: "/programs#teens-adults",
    },
    {
      title: "Kickboxing",
      ages: "All Ages",
      img: KICKBOXING_IMG,
      benefits: ["Burn 800+ calories", "Full-body workout", "Real techniques", "High energy classes"],
      href: "/programs#kickboxing",
    },
  ];

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#e63946] font-bold uppercase tracking-[0.25em] text-sm mb-2">Explore All Programs</p>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            CHOOSE YOUR DISCIPLINE
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map(p => (
            <div key={p.title} className="group relative overflow-hidden rounded-xl bg-zinc-900 flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-black text-xl uppercase">{p.title}</h3>
                  <p className="text-gray-300 text-xs uppercase tracking-wider">{p.ages}</p>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <ul className="space-y-1.5 mb-5 flex-1">
                  {p.benefits.map(b => (
                    <li key={b} className="flex items-center gap-2 text-gray-300 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-[#e63946] shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onBookClass}
                  className="w-full flex items-center justify-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-bold uppercase text-sm py-3 rounded transition-colors"
                >
                  BOOK FREE CLASS <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Schedule Section ─────────────────────────────────────────────────────────
function ScheduleSection({ onBookClass }: { onBookClass: () => void }) {
  const schedule = [
    { day: "Monday", classes: ["Little Ninjas 4:00 PM", "Core Kids 5:00 PM", "Teens/Adults 6:00 PM", "Kickboxing 7:00 PM"] },
    { day: "Tuesday", classes: ["Core Kids 4:30 PM", "Teens/Adults 5:30 PM", "Kickboxing 6:30 PM"] },
    { day: "Wednesday", classes: ["Little Ninjas 4:00 PM", "Core Kids 5:00 PM", "Teens/Adults 6:00 PM", "Kickboxing 7:00 PM"] },
    { day: "Thursday", classes: ["Core Kids 4:30 PM", "Teens/Adults 5:30 PM", "Kickboxing 6:30 PM"] },
    { day: "Friday", classes: ["Core Kids 4:30 PM", "Teens/Adults 5:30 PM"] },
    { day: "Saturday", classes: ["Little Ninjas 10:00 AM", "Core Kids 11:00 AM", "Teens/Adults 12:00 PM"] },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
            CLASS <span className="text-[#e63946]">SCHEDULE</span>
          </h2>
          <p className="text-gray-500 mt-2">Tomball HQ — 23511 FM 2920, Tomball, TX 77377</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {schedule.map(s => (
            <div key={s.day} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-black text-sm uppercase text-[#e63946] mb-3 pb-2 border-b border-gray-200">{s.day}</h3>
              <ul className="space-y-1.5">
                {s.classes.map(c => (
                  <li key={c} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <Clock className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/schedule">
            <button className="inline-flex items-center gap-2 border-2 border-black hover:bg-black hover:text-white text-black font-bold uppercase tracking-wider px-8 py-3 rounded-sm transition-all duration-200 mr-4">
              VIEW FULL SCHEDULE
            </button>
          </Link>
          <button
            onClick={onBookClass}
            className="inline-flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-black uppercase tracking-wider px-8 py-3 rounded-sm transition-all duration-200"
          >
            BOOK FREE CLASS <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────
function FAQSection() {
  const faqs = [
    { q: "What should my child wear?", a: "For the first class, comfortable workout clothes (t-shirt and sweatpants/shorts) are perfect. We train barefoot on the mats. If you decide to join, we'll help you get a proper uniform." },
    { q: "How old does my child need to be?", a: "Our Little Ninjas program starts at age 3! We have programs for every age group from 3 to adults." },
    { q: "What styles of martial arts do you teach?", a: "We teach a blend of traditional Karate, Kickboxing, and practical self-defense techniques — all adapted for the student's age and level." },
    { q: "Do I need experience to start?", a: "Absolutely not! All our programs are designed for complete beginners. Our instructors will guide you every step of the way." },
    { q: "How often should I attend classes?", a: "We recommend 2–3 classes per week for the best results. Consistency is key to progress in martial arts." },
    { q: "How much do classes cost?", a: "We offer flexible membership options. The best way to find out is to come in for a FREE trial class — no pressure, no commitment." },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
            FREQUENTLY ASKED <span className="text-[#e63946]">QUESTIONS</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-gray-200 rounded-xl px-6 shadow-sm">
              <AccordionTrigger className="font-bold text-sm uppercase tracking-wide text-black hover:text-[#e63946] hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// ─── Footer CTA ───────────────────────────────────────────────────────────────
function FinalCTASection({ onBookClass }: { onBookClass: () => void }) {
  return (
    <section className="relative py-20 bg-[#e63946] overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/logo-icon-white.99cb4daa.webp')] bg-center bg-no-repeat opacity-5 bg-[length:600px]" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight">
              DON'T WAIT.<br />
              <span className="text-black">SPOTS ARE FILLING FAST!</span>
            </h2>
            <p className="text-white/90 text-lg mt-4">
              Helping 100 new members start their martial arts journey before July 25.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onBookClass}
              className="flex items-center gap-3 bg-white hover:bg-gray-100 text-[#e63946] font-black uppercase tracking-wider text-xl px-10 py-5 rounded-sm transition-all duration-200 shadow-2xl"
            >
              BOOK YOUR FREE CLASS <ArrowRight className="h-6 w-6" />
            </button>
            <a href="tel:+18774693656" className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" /> Or call (877) 4-MYDOJO
            </a>
          </div>

          {/* 100 Members badge */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-black/20 border-4 border-white/30 flex flex-col items-center justify-center text-center p-3">
              <span className="text-white font-black text-3xl leading-none">100</span>
              <span className="text-white text-[9px] uppercase font-bold leading-tight mt-1">NEW MEMBERS<br />BY JULY 25TH<br />CHALLENGE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Mobile CTA ────────────────────────────────────────────────────────
function StickyMobileCTA({ onBookClass }: { onBookClass: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300",
      visible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex">
        <a
          href="tel:+18774693656"
          className="flex-1 flex items-center justify-center gap-2 bg-black text-white font-bold uppercase text-sm py-4"
        >
          <Phone className="h-4 w-4" /> CALL NOW
        </a>
        <button
          onClick={onBookClass}
          className="flex-2 flex-[2] flex items-center justify-center gap-2 bg-[#e63946] text-white font-black uppercase text-sm py-4"
        >
          BOOK FREE CLASS <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Floating Phone Button ────────────────────────────────────────────────────
function FloatingPhone() {
  return (
    <a
      href="tel:+18774693656"
      className="hidden md:flex fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-[#e63946] shadow-[0_4px_20px_rgba(230,57,70,0.5)] items-center justify-center hover:scale-110 transition-transform"
      title="Call MyDojo"
    >
      <Phone className="h-6 w-6 text-white" />
    </a>
  );
}

// ─── Info Bar ─────────────────────────────────────────────────────────────────
function InfoBar() {
  return (
    <div className="bg-black border-b border-white/10 py-2 hidden md:block">
      <div className="container mx-auto px-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-[#e63946]" /> 23511 FM 2920, Tomball, TX 77377</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-[#e63946]" /> Mon–Sat Classes Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-[#e63946]" />
          <a href="tel:+18774693656" className="hover:text-white transition-colors">(877) 4-MYDOJO</a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [showIntakeBot, setShowIntakeBot] = useState(false);
  useVisitorSms({ page: "home" });

  const handleBookClass = () => {
    openIntakeChatbot();
  };

  return (
    <>
      <SEO
        title="MyDojo Martial Arts — Tomball's #1 Martial Arts School | Book Free Class"
        description="Join Tomball's favorite martial arts school. Programs for kids ages 3+, teens, adults, and families. Kickboxing, Karate, and more. Book your FREE trial class today!"
        canonical="https://www.mydojoma.com"
      />
      <SchemaMarkup type="LocalBusiness" />

      <HeroSection onBookClass={handleBookClass} />
      <EnrollmentSection onBookClass={handleBookClass} />
      <WhatTheyLearnSection onBookClass={handleBookClass} />
      <SummerSpecialSection onBookClass={handleBookClass} />
      <TestimonialsSection onBookClass={handleBookClass} />
      <WhyMyDojoSection />
      <ProgramsSection onBookClass={handleBookClass} />
      <ScheduleSection onBookClass={handleBookClass} />
      <FAQSection />
      <FinalCTASection onBookClass={handleBookClass} />

      {/* Conversion elements */}
      <StickyMobileCTA onBookClass={handleBookClass} />
      <FloatingPhone />

      {showIntakeBot && <IntakeChatbot onClose={() => setShowIntakeBot(false)} />}
    </>
  );
}
