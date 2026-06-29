import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
import { openBookFreeClassGate } from "@/lib/chatbot";
import { PhoneChooser } from "@/components/PhoneChooser";
import { IntakeChatbot } from "@/components/IntakeChatbot";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { useVisitorSms } from "@/hooks/useVisitorSms";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";

// ─── Image constants ────────────────────────────────────────────────────────
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";
const HERO_VIDEO = "/manus-storage/hero_montage_v5_d1227c92.mp4";
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
  const { t } = useTranslation();
  // Fetch deadline from admin config (same source as kiosk thermometer)
  const { data: driveData } = trpc.kiosk.getMemberDriveProgress.useQuery();
  const deadline = useMemo(() => {
    if (driveData?.deadline) return new Date(driveData.deadline + "T23:59:59");
    return new Date("2026-07-25T23:59:59"); // fallback default
  }, [driveData?.deadline]);
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

      {/* Content — centered like TSK */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 min-h-screen">
        {/* Headline */}
        <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.95] mb-2 uppercase tracking-tight">
          BUILD YOUR
        </h1>
        <h1 className="text-6xl md:text-8xl font-black text-[#e63946] leading-[0.95] mb-5 uppercase tracking-tight">
          BEST SELF.
        </h1>

        {/* Subtitle */}
        <p className="text-white/90 text-lg md:text-xl font-semibold tracking-wide mb-8">
          Martial Arts &nbsp;|&nbsp; Kickboxing &nbsp;|&nbsp; Karate
        </p>

        {/* Single CTA — like TSK */}
        <button
          onClick={onBookClass}
          className="bg-[#e63946] hover:bg-[#c1121f] text-white font-black uppercase tracking-widest text-base px-10 py-4 rounded-sm transition-all duration-200 shadow-[0_0_30px_rgba(230,57,70,0.5)]"
        >
          I'M INTERESTED
        </button>
      </div>
    </section>
  );
}

// ─── Enrollment Cards ─────────────────────────────────────────────────────────
function EnrollmentSection({ onBookClass }: { onBookClass: () => void }) {
  const { t } = useTranslation();
  const cards = [
    {
      id: "child",
      title: t("home.enroll_child"),
      ages: t("home.enroll_child_ages"),
      img: POPUP_CHILD,
      desc: t("home.enroll_child_desc"),
    },
    {
      id: "teen",
      title: t("home.enroll_teen"),
      ages: t("home.enroll_teen_ages"),
      img: POPUP_TEEN,
      desc: t("home.enroll_teen_desc"),
    },
    {
      id: "myself",
      title: t("home.enroll_myself"),
      ages: t("home.enroll_myself_ages"),
      img: POPUP_MYSELF,
      desc: t("home.enroll_myself_desc"),
    },
    {
      id: "family",
      title: t("home.enroll_family"),
      ages: t("home.enroll_family_ages"),
      img: POPUP_FAMILY,
      desc: t("home.enroll_family_desc"),
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
            {t("home.enrolling_title")} <span className="text-[#e63946]">{t("home.enrolling_accent")}</span> {t("home.enrolling_suffix")}
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
                  {t("home.select")} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: "500+", label: "Students Trained" },
    { value: "20+", label: "Years of Excellence" },
    { value: "8th", label: "Degree Black Belt Founder" },
    { value: "4.9★", label: "Google Rating" },
  ];
  return (
    <section className="bg-[#e63946] py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-white font-black text-3xl md:text-4xl leading-none">{s.value}</p>
              <p className="text-white/80 text-xs uppercase tracking-wider font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Founder Spotlight ───────────────────────────────────────────────────────
function FounderSpotlight({ onBookClass }: { onBookClass: () => void }) {
  const CDN_BASE = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="relative flex-shrink-0">
            <div className="w-72 h-80 md:w-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={`${CDN_BASE}/teens-adults_e35f9895.webp`}
                alt="Master Vincent Holmes"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#e63946] text-white rounded-xl px-5 py-3 shadow-xl text-center">
              <p className="font-black text-2xl leading-none">8th</p>
              <p className="text-xs font-bold uppercase tracking-wider">Degree</p>
              <p className="text-xs font-bold uppercase tracking-wider">Black Belt</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[#e63946] font-bold uppercase tracking-[0.25em] text-sm mb-3">Meet Your Instructor</p>
            <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight mb-6">
              Achieve Your Full Potential<br />
              <span className="text-[#e63946]">With Master Holmes</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Master Vincent Holmes, 8th Degree Black Belt and founder of MyDojo, has dedicated over 20 years to transforming lives through martial arts in the Tomball community.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              His philosophy is simple: martial arts is not about fighting — it's about building a person. Every student who walks through our doors receives world-class instruction in a safe, family-oriented environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onBookClass}
                className="flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-black uppercase tracking-wider px-8 py-4 rounded-sm transition-all duration-200"
              >
                Book Your Free Class <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="/founder"
                className="flex items-center gap-2 border-2 border-black hover:bg-black hover:text-white text-black font-bold uppercase tracking-wider px-8 py-4 rounded-sm transition-all duration-200"
              >
                About Master Holmes
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── What Your Child Will Learn (REMOVED — kept for reference) ────────────────
function WhatTheyLearnSection({ onBookClass }: { onBookClass: () => void }) {
  const { t } = useTranslation();
  const values = [
    { icon: <Award className="h-8 w-8 text-white" />, label: t("home.confidence_label") },
    { icon: <Heart className="h-8 w-8 text-white" />, label: t("home.respect_label") },
    { icon: <Target className="h-8 w-8 text-white" />, label: t("home.focus_label") },
    { icon: <Zap className="h-8 w-8 text-white" />, label: t("home.discipline_label") },
    { icon: <Shield className="h-8 w-8 text-white" />, label: t("home.antibullying_label") },
    { icon: <Users className="h-8 w-8 text-white" />, label: t("home.fitness_label") },
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
            {t("home.what_learn_title")} <span className="text-[#e63946]">{t("home.what_learn_accent")}</span>
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
            {t("home.book_free_class")} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Summer Special Banner ────────────────────────────────────────────────────
function SummerSpecialSection({ onBookClass }: { onBookClass: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="py-0 bg-black overflow-hidden">
      <div className="relative">
        {/* Gold/Red gradient bar */}
        <div className="bg-gradient-to-r from-[#e63946] via-[#c1121f] to-[#e63946] py-3 text-center">
          <p className="text-white font-black uppercase tracking-[0.3em] text-sm">
            {t("home.summer_special_banner")}
          </p>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Summer Special badge */}
            <div className="flex-shrink-0 text-center">
              <div className="relative inline-block">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex flex-col items-center justify-center shadow-[0_0_60px_rgba(255,215,0,0.4)]">
                  <span className="text-black font-black text-2xl uppercase leading-tight">{t("home.summer_special_title")}</span>
                  <span className="text-black font-black text-3xl uppercase leading-tight">{t("home.summer_special_sub")}</span>
                  <span className="text-black text-xs font-bold mt-1">{t("home.summer_year")}</span>
                </div>
              </div>
            </div>

            {/* Middle: Offers */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "FREE", item: t("home.free_uniform"), value: t("home.value_60"), icon: <Shield className="h-8 w-8 text-[#FFD700]" /> },
                { label: "FREE", item: t("home.free_class"), value: t("home.value_49"), icon: <Calendar className="h-8 w-8 text-[#FFD700]" /> },
                { label: "FREE", item: t("home.free_assessment"), value: t("home.value_49"), icon: <CheckCircle className="h-8 w-8 text-[#FFD700]" /> },
              ].map(offer => (
                <div key={offer.item} className="text-center border border-white/10 rounded-xl p-6">
                  <div className="flex justify-center mb-3">{offer.icon}</div>
                  <p className="text-[#FFD700] font-black text-2xl uppercase">{offer.label}</p>
                  <p className="text-white font-bold text-lg uppercase leading-tight">{offer.item}</p>
                  <p className="text-gray-400 text-sm mt-1">{offer.value}</p>
                </div>
              ))}
            </div>

            {/* Right: Urgency + CTA */}
            <div className="flex-shrink-0 text-center bg-white rounded-xl p-8 shadow-2xl">
              <p className="text-black font-black text-lg uppercase">{t("home.only")}</p>
              <p className="text-[#e63946] font-black text-6xl leading-none">25</p>
              <p className="text-black font-bold text-sm uppercase mb-4 whitespace-pre-line">{t("home.summer_spots")}</p>
              <button
                onClick={onBookClass}
                className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFC000] text-black font-black uppercase tracking-wider px-6 py-3 rounded-sm transition-colors"
              >
                {t("home.book_today")} <ArrowRight className="h-4 w-4" />
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
  const { t } = useTranslation();
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
            {t("home.testimonials_title")} <span className="text-[#e63946]">{t("home.testimonials_accent")}</span> {t("home.testimonials_suffix")}
          </h2>
          <p className="text-gray-500 mt-2">{t("home.testimonials_reviews")}</p>
        </div>

        {/* Testimonial cards */}
        <div className="relative mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visible.map((t2, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t2.stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t2.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={t2.avatar}
                    alt={t2.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${t2.name}&background=e63946&color=fff`; }}
                  />
                  <div>
                    <p className="font-bold text-sm text-black">– {t2.name}</p>
                    <p className="text-xs text-gray-500">{t2.role}</p>
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
  const { t } = useTranslation();
  const reasons = [
    { icon: <Shield className="h-6 w-6" />, title: t("home.safe_facility"), desc: t("home.safe_facility_desc") },
    { icon: <Award className="h-6 w-6" />, title: t("home.experienced_instructors"), desc: t("home.experienced_instructors_desc") },
    { icon: <Heart className="h-6 w-6" />, title: t("home.character_dev"), desc: t("home.character_dev_desc") },
    { icon: <BookOpen className="h-6 w-6" />, title: t("home.structured_curriculum"), desc: t("home.structured_curriculum_desc") },
    { icon: <Zap className="h-6 w-6" />, title: t("home.fitness_health"), desc: t("home.fitness_health_desc") },
    { icon: <Target className="h-6 w-6" />, title: t("home.leadership"), desc: t("home.leadership_desc") },
    { icon: <Users className="h-6 w-6" />, title: t("home.family_env"), desc: t("home.family_env_desc") },
    { icon: <CheckCircle className="h-6 w-6" />, title: t("home.antibullying"), desc: t("home.antibullying_desc") },
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            {t("home.why_title")} <span className="text-[#e63946]">{t("home.why_accent")}</span>
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
  const { t } = useTranslation();
  const programs = [
    {
      title: t("home.little_ninjas_title"),
      ages: t("home.little_ninjas_ages"),
      img: LITTLE_NINJAS_IMG,
      benefits: [t("home.little_ninjas_b1"), t("home.little_ninjas_b2"), t("home.little_ninjas_b3"), t("home.little_ninjas_b4")],
      href: "/programs#little-ninjas",
    },
    {
      title: t("home.kids_ma_title"),
      ages: t("home.kids_ma_ages"),
      img: CORE_KIDS_IMG,
      benefits: [t("home.kids_ma_b1"), t("home.kids_ma_b2"), t("home.kids_ma_b3"), t("home.kids_ma_b4")],
      href: "/programs#dragon-kids",
    },
    {
      title: t("home.teens_adults_title"),
      ages: t("home.teens_adults_ages"),
      img: TEENS_ADULTS_IMG,
      benefits: [t("home.teens_adults_b1"), t("home.teens_adults_b2"), t("home.teens_adults_b3"), t("home.teens_adults_b4")],
      href: "/programs#teens-adults",
    },
    {
      title: t("home.kickboxing_title"),
      ages: t("home.kickboxing_ages"),
      img: KICKBOXING_IMG,
      benefits: [t("home.kickboxing_b1"), t("home.kickboxing_b2"), t("home.kickboxing_b3"), t("home.kickboxing_b4")],
      href: "/programs#kickboxing",
    },
  ];

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#e63946] font-bold uppercase tracking-[0.25em] text-sm mb-2">{t("home.programs_subtitle")}</p>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            {t("home.programs_title")}
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
                  {t("home.book_free_class")} <ArrowRight className="h-3.5 w-3.5" />
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
  const { t } = useTranslation();
  const schedule = [
    { day: t("home.mon_classes"), classes: ["Little Ninjas 4:00 PM", "Core Kids 5:00 PM", "Teens/Adults 6:00 PM", "Kickboxing 7:00 PM"] },
    { day: t("home.tue_classes"), classes: ["Core Kids 4:30 PM", "Teens/Adults 5:30 PM", "Kickboxing 6:30 PM"] },
    { day: t("home.wed_classes"), classes: ["Little Ninjas 4:00 PM", "Core Kids 5:00 PM", "Teens/Adults 6:00 PM", "Kickboxing 7:00 PM"] },
    { day: t("home.thu_classes"), classes: ["Core Kids 4:30 PM", "Teens/Adults 5:30 PM", "Kickboxing 6:30 PM"] },
    { day: t("home.fri_classes"), classes: ["Core Kids 4:30 PM", "Teens/Adults 5:30 PM"] },
    { day: t("home.sat_classes"), classes: ["Little Ninjas 10:00 AM", "Core Kids 11:00 AM", "Teens/Adults 12:00 PM"] },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
            {t("home.schedule_title")} <span className="text-[#e63946]">{t("home.schedule_accent")}</span>
          </h2>
          <p className="text-gray-500 mt-2">{t("home.schedule_address")}</p>
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
              {t("home.view_full_schedule")}
            </button>
          </Link>
          <button
            onClick={onBookClass}
            className="inline-flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] text-white font-black uppercase tracking-wider px-8 py-3 rounded-sm transition-all duration-200"
          >
            {t("home.book_free_class")} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────
function FAQSection() {
  const { t } = useTranslation();
  const faqs = [
    { q: t("home.faq_q1"), a: t("home.faq_a1") },
    { q: t("home.faq_q2"), a: t("home.faq_a2") },
    { q: t("home.faq_q3"), a: t("home.faq_a3") },
    { q: t("home.faq_q4"), a: t("home.faq_a4") },
    { q: t("home.faq_q5"), a: t("home.faq_a5") },
    { q: t("home.faq_q6"), a: t("home.faq_a6") },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight">
            {t("home.faq_title")} <span className="text-[#e63946]">{t("home.faq_accent")}</span>
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
  const { t } = useTranslation();
  return (
    <section className="relative py-20 bg-[#e63946] overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/logo-icon-white.99cb4daa.webp')] bg-center bg-no-repeat opacity-5 bg-[length:600px]" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight">
              {t("home.final_cta_title")}<br />
              <span className="text-black">{t("home.final_cta_accent")}</span>
            </h2>
            <p className="text-white/90 text-lg mt-4">
              {t("home.final_cta_desc")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onBookClass}
              className="flex items-center gap-3 bg-white hover:bg-gray-100 text-[#e63946] font-black uppercase tracking-wider text-xl px-10 py-5 rounded-sm transition-all duration-200 shadow-2xl"
            >
              {t("home.book_your_free_class")} <ArrowRight className="h-6 w-6" />
            </button>
            <PhoneChooser className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" /> {t("home.or_call")}
            </PhoneChooser>
          </div>

          {/* 100 Members badge */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-black/20 border-4 border-white/30 flex flex-col items-center justify-center text-center p-3">
              <span className="text-white font-black text-3xl leading-none">{t("home.100_members")}</span>
              <span className="text-white text-[9px] uppercase font-bold leading-tight mt-1 whitespace-pre-line">{t("home.100_members_label")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sticky Mobile CTA ────────────────────────────────────────────────────────
function StickyMobileCTA({ onBookClass }: { onBookClass: () => void }) {
  const { t } = useTranslation();
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
        <PhoneChooser className="flex-1 flex items-center justify-center gap-2 bg-black text-white font-bold uppercase text-sm py-4">
          <Phone className="h-4 w-4" /> {t("home.call_or_text")}
        </PhoneChooser>
        <button
          onClick={onBookClass}
          className="flex-2 flex-[2] flex items-center justify-center gap-2 bg-[#e63946] text-white font-black uppercase text-sm py-4"
        >
          {t("home.book_free_class")} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Floating Phone Button ────────────────────────────────────────────────────
function FloatingPhone() {
  return (
    <PhoneChooser className="hidden md:flex fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-[#e63946] shadow-[0_4px_20px_rgba(230,57,70,0.5)] items-center justify-center hover:scale-110 transition-transform">
      <Phone className="h-6 w-6 text-white" />
    </PhoneChooser>
  );
}

// ─── Info Bar ─────────────────────────────────────────────────────────────────
function InfoBar() {
  const { t } = useTranslation();
  return (
    <div className="bg-black border-b border-white/10 py-2 hidden md:block">
      <div className="container mx-auto px-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-[#e63946]" /> {t("home.info_address")}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-[#e63946]" /> {t("home.info_hours")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-[#e63946]" />
          <PhoneChooser className="hover:text-white transition-colors cursor-pointer">{t("general.phone_number")}</PhoneChooser>
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
    openBookFreeClassGate();
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
      <StatsBar />
      <EnrollmentSection onBookClass={handleBookClass} />
      <ProgramsSection onBookClass={handleBookClass} />
      <TestimonialsSection onBookClass={handleBookClass} />
      <FounderSpotlight onBookClass={handleBookClass} />
      <FAQSection />
      <FinalCTASection onBookClass={handleBookClass} />

      {/* Conversion elements */}
      <StickyMobileCTA onBookClass={handleBookClass} />
      <FloatingPhone />

      {showIntakeBot && <IntakeChatbot onClose={() => setShowIntakeBot(false)} />}
    </>
  );
}
