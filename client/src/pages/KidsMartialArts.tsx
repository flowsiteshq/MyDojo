import { ArrowRight, Check, Heart, ShieldCheck, Sparkles, Target, UsersRound } from "lucide-react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { openBookFreeClassGate } from "@/lib/chatbot";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";

const PROGRAMS = [
  { name: "Little Ninjas", ages: "Ages 3–5", image: `${CDN}/little-ninjas_25d41024.webp`, copy: "A playful, age-appropriate start where young students practice coordination, listening, confidence, and respect.", href: "/programs/little-ninjas" },
  { name: "Dragon Kids", ages: "Ages 5–12", image: `${CDN}/core-kids_baf3bc26.webp`, copy: "A structured martial arts path with clear belt goals, positive coaching, and skills that carry into home and school.", href: "/programs/core-kids" },
  { name: "After School", ages: "Ages 5–12", image: `${CDN}/tomball-main-floor_004b5a76.jpg`, copy: "A supervised afternoon rhythm that combines martial arts, activities, and an environment families can count on.", href: "/programs/after-school" },
  { name: "Teens Program", ages: "Ages 13–17", image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/teens_martial_arts-imWkeSprHmEgaYUSsW63SN.png", copy: "Training that challenges teens to build self-confidence, strength, leadership, and practical self-defense awareness.", href: "/programs/teens" },
];

const OUTCOMES = [
  { icon: Target, title: "Focus & follow-through", copy: "A clear class structure helps students practice listening, effort, and finishing what they start." },
  { icon: ShieldCheck, title: "Confidence & safety", copy: "Students gain an age-appropriate understanding of boundaries, awareness, and self-defense." },
  { icon: Heart, title: "Character in action", copy: "Respect, discipline, and resilience are built into the way we coach every class." },
  { icon: UsersRound, title: "A positive team", copy: "Kids train in a community that celebrates progress and encourages healthy friendships." },
];

export default function KidsMartialArts() {
  return (
    <div className="public-page">
      <SEO title="Kids Martial Arts in Tomball | MyDojo" description="Kids martial arts programs in Tomball for ages 3–17. Build confidence, focus, and real-life skills in a supportive dojo." />
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-black md:min-h-[calc(100svh-6rem)]">
        <img src={`${CDN}/hero4_98841652.webp`} alt="Kids martial arts class at MyDojo" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="container relative z-10 flex min-h-[calc(100svh-4rem)] items-end py-14 md:min-h-[calc(100svh-6rem)] md:py-20"><div className="max-w-3xl text-white"><p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-white/75">MyDojo kids programs</p><h1 className="mt-5 font-heading text-[clamp(4.2rem,10vw,9rem)] font-bold uppercase leading-[0.82] tracking-[-0.045em]">Big confidence<br /><span className="text-[#e63946]">starts small.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-white/85 md:text-lg">A focused, energetic introduction to martial arts for children and teens—where students build skills they can use in class, at home, and in life.</p><button onClick={openBookFreeClassGate} className="public-button mt-9">Book a free class <ArrowRight className="h-4 w-4" /></button></div></div>
      </section>

      <section className="public-section bg-[var(--mydojo-paper)]"><div className="container grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="public-eyebrow">The difference is in the coaching</p><h2 className="public-title mt-5">Martial arts with meaning.</h2></div><p className="public-copy max-w-2xl">MyDojo helps young students grow through a clear, encouraging practice. We care about quality technique, but we also care about the habits students develop while earning it.</p></div></section>

      <section className="bg-white py-16 md:py-24"><div className="container grid border-l border-t border-[var(--mydojo-line)] sm:grid-cols-2 lg:grid-cols-4">{OUTCOMES.map(({ icon: Icon, title, copy }) => <article key={title} className="border-b border-r border-[var(--mydojo-line)] p-7 md:p-8"><Icon className="h-6 w-6 text-[#e63946]" /><h2 className="mt-7 font-heading text-3xl font-bold uppercase leading-none text-black">{title}</h2><p className="mt-4 text-sm leading-6 text-zinc-600">{copy}</p></article>)}</div></section>

      <section className="public-section bg-black text-white"><div className="container"><div className="mb-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"><div><p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-[#e63946]">Programs by age</p><h2 className="mt-5 font-heading text-[clamp(3.4rem,6vw,6rem)] font-bold uppercase leading-[0.86] tracking-[-0.04em]">The right next step.</h2></div><p className="max-w-xl text-base leading-7 text-white/70">Every program is designed around the way its students learn. Explore a starting point, then let our team help you plan a first visit.</p></div><div className="grid border-l border-t border-white/15 md:grid-cols-2">{PROGRAMS.map((program) => <article key={program.name} className="group border-b border-r border-white/15"><img src={program.image} alt={program.name} className="h-56 w-full object-cover grayscale-[20%] transition duration-500 group-hover:scale-[1.02] group-hover:grayscale-0" /><div className="p-7"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#e63946]">{program.ages}</p><h3 className="mt-3 font-heading text-4xl font-bold uppercase leading-none">{program.name}</h3><p className="mt-4 text-sm leading-6 text-white/70">{program.copy}</p><div className="mt-7 flex gap-5"><Link href={program.href}><span className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:text-[#e63946]">Explore <ArrowRight className="h-4 w-4" /></span></Link><button onClick={openBookFreeClassGate} className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#e63946] hover:text-white">Book intro</button></div></div></article>)}</div></div></section>

      <section className="public-section bg-white"><div className="container grid gap-10 border-y border-[var(--mydojo-line)] py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"><div><p className="public-eyebrow">See the dojo for yourself</p><h2 className="public-title mt-5">Your child’s first class is a simple place to begin.</h2><p className="public-copy mt-6 max-w-2xl">Request a complimentary introduction and we will help you choose the best program, explain what to expect, and find an easy first step for your family.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><button onClick={openBookFreeClassGate} className="public-button">Book a free class <ArrowRight className="h-4 w-4" /></button><Link href="/locations/tomball"><span className="public-button-secondary cursor-pointer">Visit Tomball HQ</span></Link></div></div></section>
    </div>
  );
}
