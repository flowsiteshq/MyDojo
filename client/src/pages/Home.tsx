import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { PhoneChooser } from "@/components/PhoneChooser";
import { openBookFreeClassGate } from "@/lib/chatbot";
import { useVisitorSms } from "@/hooks/useVisitorSms";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";
const HERO_IMAGE = "/manus-storage/mydojo-hero-training-editorial_3c711d6f.jpg";
const TRAINING_FLOOR = `${CDN}/tomball-training-floor_9a2c684b.jpg`;

const PROGRAMS = [
  {
    title: "Little Ninjas",
    ages: "Ages 3–5",
    copy: "A playful first step that builds listening, confidence, coordination, and respectful habits.",
    image: `${CDN}/little-ninjas_25d41024.webp`,
    href: "/programs#little-ninjas",
  },
  {
    title: "Kids Martial Arts",
    ages: "Ages 5–12",
    copy: "Structured training for focus, resilience, self-defense awareness, and steady belt progression.",
    image: `${CDN}/core-kids_baf3bc26.webp`,
    href: "/programs#dragon-kids",
  },
  {
    title: "Teens & Adults",
    ages: "Ages 13+",
    copy: "Challenge your body, sharpen your mindset, and learn practical skills in a welcoming community.",
    image: `${CDN}/teens-adults_e35f9895.webp`,
    href: "/programs#teens-adults",
  },
  {
    title: "Kickboxing",
    ages: "All experience levels",
    copy: "A high-energy workout that combines conditioning, technique, stress relief, and confidence.",
    image: `${CDN}/kickboxing-bg_d4fcc4c5.webp`,
    href: "/programs#kickboxing",
  },
];

const FAQS = [
  {
    question: "Do I need experience to begin?",
    answer: "No. Your introductory experience is designed for beginners, and our instructors help you start at a pace that feels right.",
  },
  {
    question: "What should I wear to my first class?",
    answer: "Comfortable workout clothes are perfect. We will explain anything else you need before you step on the mat.",
  },
  {
    question: "Is martial arts right for my child?",
    answer: "Our programs are built around age-appropriate coaching, clear structure, and a supportive environment for students at every starting point.",
  },
  {
    question: "How do I get started?",
    answer: "Choose a program or request a free introductory class. Our team will follow up to find the best next step for your family.",
  },
];

function Hero({ onBook }: { onBook: () => void }) {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-black md:min-h-[calc(100svh-6rem)]">
      <img
        src={HERO_IMAGE}
        alt="MyDojo students practicing martial arts"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/10" />

      <div className="container relative z-10 flex min-h-[calc(100svh-4rem)] items-end py-14 md:min-h-[calc(100svh-6rem)] md:py-20">
        <div className="max-w-3xl text-white">
          <p className="mb-5 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-white/75">
            MyDojo Martial Arts & Fitness · Tomball, Texas
          </p>
          <h1 className="max-w-3xl font-heading text-[clamp(4rem,10vw,9.5rem)] font-bold uppercase leading-[0.82] tracking-[-0.045em]">
            Train With
            <span className="block text-[#e63946]">Purpose.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/85 md:text-lg">
            Purposeful martial arts and kickboxing instruction for children, teens, and adults—built around confidence, discipline, and progress that carries beyond the mat.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={onBook} className="public-button w-full sm:w-auto">
              Book a free class <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/locations/tomball">
              <span className="inline-flex min-h-[3.125rem] w-full cursor-pointer items-center justify-center gap-2 border border-white/70 px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black sm:w-auto">
                View Tomball HQ <MapPin className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: <Users className="h-4 w-4" />, label: "Programs for ages 3+" },
    { icon: <ShieldCheck className="h-4 w-4" />, label: "Beginner-friendly coaching" },
    { icon: <Sparkles className="h-4 w-4" />, label: "A supportive dojo community" },
  ];

  return (
    <section className="bg-black text-white">
      <div className="container grid divide-y divide-white/15 py-1 md:grid-cols-3 md:divide-x md:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-center gap-3 px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-white/85">
            <span className="text-[#e63946]">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}

function Intro({ onBook }: { onBook: () => void }) {
  return (
    <section className="public-section bg-[var(--mydojo-paper)]">
      <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="public-eyebrow">A place to grow</p>
          <h2 className="public-title mt-5 max-w-xl">More than a workout. A practice for life.</h2>
        </div>
        <div className="max-w-2xl lg:pb-1">
          <p className="public-copy">
            Every class pairs quality instruction with clear expectations, meaningful encouragement, and a community that notices progress. Whether you are introducing a child to their first martial arts class or returning to fitness yourself, we meet you where you are.
          </p>
          <button onClick={onBook} className="public-button-secondary mt-7">
            Find your program <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Programs({ onBook }: { onBook: () => void }) {
  return (
    <section className="public-section bg-white">
      <div className="container">
        <div className="mb-11 flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <p className="public-eyebrow">Our programs</p>
            <h2 className="public-title mt-5">Choose your starting point.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-zinc-500">Each path begins with a supportive introduction, clear goals, and guidance from instructors who know how to help you progress.</p>
        </div>

        <div className="grid border-l border-t border-[var(--mydojo-line)] md:grid-cols-2">
          {PROGRAMS.map((program) => (
            <article key={program.title} className="group grid min-h-[29rem] grid-rows-[15rem_1fr] border-b border-r border-[var(--mydojo-line)] bg-white md:grid-cols-[0.95fr_1.05fr] md:grid-rows-1">
              <div className="relative overflow-hidden">
                <img src={program.image} alt={program.title} className="h-full w-full object-cover grayscale-[15%] transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-black/10" />
              </div>
              <div className="flex flex-col p-7 md:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#e63946]">{program.ages}</p>
                <h3 className="mt-3 font-heading text-4xl font-bold uppercase leading-none tracking-[-0.02em] text-black">{program.title}</h3>
                <p className="mt-5 text-sm leading-6 text-zinc-600">{program.copy}</p>
                <div className="mt-auto flex flex-wrap gap-3 pt-7">
                  <Link href={program.href}>
                    <span className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-black hover:text-[#e63946]">
                      Explore program <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <button onClick={onBook} className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#e63946] hover:text-[#bf2634]">
                    Book intro
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrainingStory({ onBook }: { onBook: () => void }) {
  return (
    <section className="bg-black text-white">
      <div className="container grid min-h-[42rem] lg:grid-cols-2 lg:min-h-[38rem]">
        <div className="relative min-h-[20rem] overflow-hidden lg:min-h-0">
          <img src={TRAINING_FLOOR} alt="Students training at MyDojo" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="flex flex-col justify-center px-1 py-16 sm:px-8 lg:px-20">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-[#e63946]">The MyDojo approach</p>
          <h2 className="mt-5 font-heading text-[clamp(3.1rem,6vw,5.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.035em]">
            Clear goals.<br />Real progress.
          </h2>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/75">
            Students develop one class at a time—with instruction that values consistency, character, technique, and the confidence that comes from seeing hard work pay off.
          </p>
          <ul className="mt-8 grid gap-3 text-sm font-semibold text-white/90 sm:grid-cols-2">
            {["Approachable for beginners", "Age-appropriate instruction", "Structured progression", "A team that knows your name"].map((item) => (
              <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#e63946]" />{item}</li>
            ))}
          </ul>
          <button onClick={onBook} className="public-button mt-9 w-full sm:w-fit">Start your introduction <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section className="public-section bg-[var(--mydojo-paper)]">
      <div className="container grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden bg-zinc-200">
          <img src="https://files.manuscdn.com/manus-storage/master-holmes-headshot_cd686d71.jpg" alt="Master Vincent Holmes" className="h-full w-full object-cover object-top grayscale-[10%]" />
          <div className="absolute bottom-0 left-0 bg-[#e63946] px-5 py-4 text-xs font-extrabold uppercase tracking-[0.13em] text-white">Master Vincent Holmes</div>
        </div>
        <div className="max-w-2xl">
          <p className="public-eyebrow">Leadership on the mat</p>
          <h2 className="public-title mt-5">Built on discipline, respect, and care.</h2>
          <p className="public-copy mt-7">
            MyDojo is led by instructors who believe martial arts should help people become stronger in every part of life. We create the structure; students bring the effort; together, we celebrate meaningful progress.
          </p>
          <Link href="/founder"><span className="mt-8 inline-flex cursor-pointer items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#e63946] hover:text-[#bf2634]">Meet the founder <ArrowRight className="h-4 w-4" /></span></Link>
        </div>
      </div>
    </section>
  );
}

function Visit({ onBook }: { onBook: () => void }) {
  return (
    <section className="public-section bg-white">
      <div className="container grid gap-10 border-y border-[var(--mydojo-line)] py-12 md:grid-cols-[1.15fr_0.85fr] md:py-16">
        <div>
          <p className="public-eyebrow">Visit MyDojo</p>
          <h2 className="public-title mt-5">Your next class starts here.</h2>
          <p className="public-copy mt-6 max-w-xl">Come see the dojo, meet our team, and experience what a focused, encouraging class feels like.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onBook} className="public-button">Book a free class <ArrowRight className="h-4 w-4" /></button>
            <Link href="/locations/tomball"><span className="public-button-secondary cursor-pointer">Directions <MapPin className="h-4 w-4" /></span></Link>
          </div>
        </div>
        <div className="grid content-start gap-0 border-l border-t border-[var(--mydojo-line)] text-sm">
          <div className="flex gap-4 border-b border-r border-[var(--mydojo-line)] p-5"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#e63946]" /><div><p className="font-bold uppercase tracking-wide text-black">Tomball Headquarters</p><p className="mt-1 leading-6 text-zinc-600">11721 Spring Cypress Rd<br />Tomball, TX</p></div></div>
          <div className="flex gap-4 border-b border-r border-[var(--mydojo-line)] p-5"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#e63946]" /><div><p className="font-bold uppercase tracking-wide text-black">Class schedule</p><p className="mt-1 leading-6 text-zinc-600">Explore age-specific class times and program availability.</p><Link href="/schedule"><span className="mt-3 inline-flex cursor-pointer text-xs font-extrabold uppercase tracking-[0.12em] text-[#e63946]">View schedule</span></Link></div></div>
        </div>
      </div>
    </section>
  );
}

function Questions() {
  return (
    <section className="public-section bg-[var(--mydojo-paper)]">
      <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div><p className="public-eyebrow">Before your first class</p><h2 className="public-title mt-5">Questions, answered.</h2></div>
        <Accordion type="single" collapsible className="border-t border-[var(--mydojo-line)]">
          {FAQS.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`} className="border-b border-[var(--mydojo-line)]">
              <AccordionTrigger className="py-5 text-left text-sm font-bold uppercase tracking-[0.06em] text-black hover:text-[#e63946] hover:no-underline">{faq.question}</AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5 text-sm leading-7 text-zinc-600">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta({ onBook }: { onBook: () => void }) {
  return (
    <section className="bg-[#e63946] py-16 text-white md:py-24">
      <div className="container flex flex-col items-start justify-between gap-9 lg:flex-row lg:items-end">
        <div className="max-w-3xl"><p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-white/70">Begin your journey</p><h2 className="mt-5 font-heading text-[clamp(3.5rem,7vw,7rem)] font-bold uppercase leading-[0.86] tracking-[-0.04em]">Ready when<br />you are.</h2></div>
        <div className="max-w-md"><p className="text-base leading-7 text-white/85">Take the first step with a complimentary introductory class. Our team will help you find the right program and a time that works.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><button onClick={onBook} className="inline-flex min-h-[3.125rem] items-center justify-center gap-2 bg-black px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black">Book a free class <ArrowRight className="h-4 w-4" /></button><PhoneChooser className="inline-flex min-h-[3.125rem] items-center justify-center gap-2 border border-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black"><Phone className="h-4 w-4" /> Call MyDojo</PhoneChooser></div></div>
      </div>
    </section>
  );
}

function MobileCta({ onBook }: { onBook: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white p-2 transition-transform duration-300 md:hidden ${visible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="grid grid-cols-2 gap-2"><PhoneChooser className="flex h-12 items-center justify-center gap-2 border border-black text-xs font-extrabold uppercase tracking-[0.1em] text-black"><Phone className="h-4 w-4" /> Call</PhoneChooser><button onClick={onBook} className="flex h-12 items-center justify-center gap-2 bg-[#e63946] text-xs font-extrabold uppercase tracking-[0.1em] text-white">Book a class <ArrowRight className="h-4 w-4" /></button></div>
    </div>
  );
}

export default function Home() {
  useVisitorSms({ page: "home" });
  const handleBook = () => openBookFreeClassGate();

  return (
    <div className="public-page">
      <SEO title="MyDojo Martial Arts & Fitness | Tomball, Texas" description="Purposeful martial arts and kickboxing programs for kids, teens, and adults in Tomball, Texas. Request your complimentary introductory class." canonical="https://www.mydojoma.com" />
      <SchemaMarkup type="LocalBusiness" />
      <Hero onBook={handleBook} />
      <TrustStrip />
      <Intro onBook={handleBook} />
      <Programs onBook={handleBook} />
      <TrainingStory onBook={handleBook} />
      <Founder />
      <Visit onBook={handleBook} />
      <Questions />
      <FinalCta onBook={handleBook} />
      <MobileCta onBook={handleBook} />
    </div>
  );
}
