import { openBookFreeClassGate } from "@/lib/chatbot";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Star, Flame, Shield, Zap, Heart, Trophy, Users } from "lucide-react";
import { Link } from "wouter";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";

const PROGRAMS = [
  {
    id: "kickboxing",
    name: "Adult Kickboxing",
    ages: "Ages 16+",
    image: `${CDN}/kickboxing-bg_d4fcc4c5.webp`,
    icon: `${CDN}/program-kickboxing-icon-3wZvsMQWK2QsE88jbA5XvL.webp`,
    description:
      "High-energy kickboxing classes that combine real martial arts techniques with a full-body cardio workout. Burn up to 800 calories per session while learning practical self-defense. Perfect for all fitness levels.",
    benefits: [
      "Burn up to 800 calories per class",
      "Real striking & self-defense techniques",
      "High-energy cardio conditioning",
      "All fitness levels welcome",
    ],
  },
  {
    id: "adult-karate",
    name: "Adult Karate",
    ages: "Ages 16+",
    image: `${CDN}/teens-adults_e35f9895.webp`,
    icon: `${CDN}/program-adult-karate-icon-97TNw8WYGfGSkrXWgHwAij.webp`,
    description:
      "Traditional Wado-Ryu karate taught by Master Vincent Holmes, 8th Degree Black Belt. Develop discipline, mental focus, and real self-defense skills through a structured belt progression system.",
    benefits: [
      "Traditional Wado-Ryu karate",
      "Structured belt rank system",
      "Mental focus & stress relief",
      "Practical self-defense skills",
    ],
  },
  {
    id: "teens",
    name: "Teens Program",
    ages: "Ages 13–17",
    image: `${CDN}/martial-arts-sports-crosstraining_0d4be133.jpg`,
    icon: `${CDN}/program-teens-adults-icon-LpWWvsSRjwWK2grH4tDkJg.webp`,
    description:
      "A dedicated program designed for teenagers that builds confidence, fitness, and leadership. Teens train in a structured environment that challenges them physically and mentally while building lasting character.",
    benefits: [
      "Builds teen confidence & leadership",
      "Anti-bullying & self-defense",
      "Positive peer community",
      "Academic focus & discipline",
    ],
  },
];

const BENEFITS = [
  { icon: Flame, title: "Burn Calories", desc: "Up to 800 calories per high-energy session." },
  { icon: Shield, title: "Self-Defense", desc: "Real techniques you can use in real situations." },
  { icon: Zap, title: "Explosive Fitness", desc: "Strength, speed, and cardio in every class." },
  { icon: Heart, title: "Stress Relief", desc: "Leave every class feeling energized and clear-headed." },
  { icon: Trophy, title: "Belt Progression", desc: "Clear milestones to keep you motivated." },
  { icon: Users, title: "Community", desc: "Train alongside a supportive, driven community." },
];

export default function AdultKickboxing() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={`${CDN}/kickboxing-bg_d4fcc4c5.webp`}
            alt="Adult Kickboxing at MyDojo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-primary font-bold uppercase tracking-[0.3em] text-sm mb-4">MyDojo Adult Programs</p>
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.95] mb-3 uppercase tracking-tight">
            ADULT
          </h1>
          <h1 className="text-5xl md:text-8xl font-black text-primary leading-[0.95] mb-6 uppercase tracking-tight">
            KICKBOXING
          </h1>
          <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            The best 3-dimensional workout — strength, cardio, and self-defense. All in one class.
          </p>
          <button
            onClick={() => openBookFreeClassGate()}
            className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-base px-10 py-4 rounded-sm transition-all duration-200 shadow-[0_0_30px_rgba(230,57,70,0.5)]"
          >
            I'M INTERESTED
          </button>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-primary py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <p className="text-3xl md:text-4xl font-black">800</p>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider opacity-90">Calories / Class</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black">Ages 13+</p>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider opacity-90">All Levels Welcome</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black">4.9★</p>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider opacity-90">Google Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Adults Love MyDojo ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Why Train With Us</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase">THE BEST WORKOUT<br />YOU'LL EVER DO</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="bg-black p-4 rounded-full">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-black text-base uppercase tracking-wide">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs ── */}
      <section className="py-20 bg-zinc-950 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Our Programs</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase">CHOOSE YOUR DISCIPLINE</h2>
          </div>
          <div className="flex flex-col gap-16">
            {PROGRAMS.map((prog, i) => (
              <div
                key={prog.id}
                className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
              >
                {/* Image — alternate sides */}
                <div className={`relative rounded-xl overflow-hidden shadow-2xl ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <img src={prog.image} alt={prog.name} className="w-full h-72 md:h-96 object-cover" />
                  <div className="absolute top-4 left-4 bg-primary text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-sm">
                    Free Trial
                  </div>
                </div>
                {/* Content */}
                <div className={i % 2 === 1 ? "md:order-1" : ""}>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={prog.icon} alt="" className="h-10 w-10 object-contain" />
                    <span className="text-primary text-xs font-bold uppercase tracking-widest">{prog.ages}</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black uppercase mb-4">{prog.name}</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">{prog.description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                    {prog.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-200">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => openBookFreeClassGate()}
                    className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-wider text-sm px-8 py-3 rounded-sm transition-all duration-200 inline-flex items-center gap-2 group"
                  >
                    Try a Free Class <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder Spotlight ── */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={`${CDN}/tomball-training-floor_9a2c684b.jpg`}
                alt="Master Holmes teaching"
                className="w-full h-80 md:h-[500px] object-cover rounded-xl shadow-2xl"
              />
              <div className="absolute top-4 right-4 bg-primary text-white text-center px-4 py-3 rounded-sm shadow-xl">
                <p className="text-3xl font-black leading-none">8th</p>
                <p className="text-xs font-black uppercase tracking-wider">Degree</p>
                <p className="text-xs font-black uppercase tracking-wider">Black Belt</p>
              </div>
            </div>
            <div>
              <p className="text-primary font-bold uppercase tracking-widest text-sm mb-3">Learn From the Best</p>
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-6">MASTER VINCENT HOLMES</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                Founder of MyDojo and an 8th Degree Black Belt with over 30 years of teaching experience. Master Holmes has trained thousands of adults to reach their peak physical and mental potential through the discipline of martial arts.
              </p>
              <p className="text-gray-300 leading-relaxed mb-8">
                Every adult class at MyDojo is built on his proven system — combining traditional Wado-Ryu karate with modern kickboxing to deliver results that go far beyond the gym.
              </p>
              <Link href="/founder">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black uppercase tracking-wider px-8 py-3 h-auto font-bold rounded-sm">
                  Meet Master Holmes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Student Reviews</p>
          <h2 className="text-4xl font-black uppercase mb-12">REAL RESULTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "I've tried every gym in Houston. Nothing comes close to the workout and community at MyDojo.", name: "David K.", stars: 5 },
              { quote: "Lost 30 pounds in 4 months. The kickboxing classes are intense, fun, and addictive.", name: "Priya S.", stars: 5 },
              { quote: "Master Holmes is the real deal. You learn actual self-defense, not just fitness moves.", name: "Carlos M.", stars: 5 },
            ].map((t) => (
              <div key={t.name} className="bg-gray-50 p-8 rounded-xl text-left">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4 leading-relaxed">"{t.quote}"</p>
                <p className="font-black text-sm uppercase tracking-wider">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-primary text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/cta-bg_5eebb32b.webp')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4">READY TO TRAIN?</h2>
          <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
            Join our high-energy 45-minute complimentary Kickboxing or Karate class — no experience needed.
          </p>
          <button
            onClick={() => openBookFreeClassGate()}
            className="bg-white text-primary hover:bg-black hover:text-white font-black uppercase tracking-wider text-lg px-10 py-4 rounded-sm transition-all duration-300 shadow-xl"
          >
            Book Your Free Class
          </button>
        </div>
      </section>

    </div>
  );
}
