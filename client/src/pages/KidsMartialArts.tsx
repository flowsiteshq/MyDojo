import { openBookFreeClassGate } from "@/lib/chatbot";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Star, Shield, Brain, Heart, Users, Trophy } from "lucide-react";
import { Link } from "wouter";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C";
const TEENS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/teens_martial_arts-imWkeSprHmEgaYUSsW63SN.png";

const PROGRAMS = [
  {
    id: "little-ninjas",
    name: "Little Ninjas",
    ages: "Ages 3–5",
    image: `${CDN}/little-ninjas_25d41024.webp`,
    icon: `${CDN}/program-little-ninjas-icon-mAMYQ5Bv6uisAiTZ5K5GQu.webp`,
    description:
      "A fun, high-energy introduction to martial arts designed specifically for young children. Little Ninjas develop coordination, listening skills, and confidence through age-appropriate games and techniques.",
    benefits: [
      "Builds listening & focus skills",
      "Develops coordination & balance",
      "Boosts confidence & self-esteem",
      "Teaches respect & discipline",
    ],
  },
  {
    id: "dragon-kids",
    name: "Dragon Kids",
    ages: "Ages 5–12",
    image: `${CDN}/core-kids_baf3bc26.webp`,
    icon: `${CDN}/program-kids-martial-arts-icon-Vj7bBxjn963m8EZYnaGfQP.webp`,
    description:
      "Our core kids program teaches real martial arts techniques in a structured, belt-rank system. Students develop physical fitness, mental discipline, and the confidence to handle life's challenges.",
    benefits: [
      "Real martial arts belt progression",
      "Improved focus & academic performance",
      "Anti-bullying & self-defense skills",
      "Teamwork & leadership development",
    ],
  },
  {
    id: "after-school",
    name: "After School Program",
    ages: "Ages 5–12",
    image: `${CDN}/tomball-main-floor_004b5a76.jpg`,
    icon: `${CDN}/program-after-school-icon-bqnXijqxdLdkt4EyjBiP44.webp`,
    description:
      "A safe, structured after-school environment where kids get homework help, healthy snacks, and martial arts training. Parents love the convenience; kids love the action.",
    benefits: [
      "Homework help & tutoring support",
      "Healthy snacks provided",
      "Safe supervised environment",
      "Daily martial arts training",
    ],
  },
  {
    id: "teens",
    name: "Teens Program",
    ages: "Ages 13–17",
    image: TEENS_IMG,
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
  { icon: Brain, title: "Focus & Discipline", desc: "Kids learn to concentrate and follow through on goals." },
  { icon: Shield, title: "Confidence & Safety", desc: "Self-defense skills and the confidence to use them wisely." },
  { icon: Heart, title: "Physical Fitness", desc: "Full-body workouts that make fitness fun for kids." },
  { icon: Users, title: "Community & Friends", desc: "A positive, supportive team environment." },
  { icon: Trophy, title: "Belt Progression", desc: "Clear goals and achievements to celebrate." },
  { icon: Star, title: "Character Building", desc: "Respect, integrity, and perseverance taught every class." },
];

export default function KidsMartialArts() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={`${CDN}/hero4_98841652.webp`}
            alt="Kids Martial Arts at MyDojo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-primary font-bold uppercase tracking-[0.3em] text-sm mb-4">MyDojo Kids Programs</p>
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.95] mb-3 uppercase tracking-tight">
            KIDS
          </h1>
          <h1 className="text-5xl md:text-8xl font-black text-primary leading-[0.95] mb-6 uppercase tracking-tight">
            MARTIAL ARTS
          </h1>
          <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Build confidence, discipline, and real self-defense skills in a fun, safe environment.
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
              <p className="text-3xl md:text-4xl font-black">500+</p>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider opacity-90">Kids Enrolled</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black">Ages 3–17</p>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider opacity-90">All Levels Welcome</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black">4.9★</p>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider opacity-90">Google Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Kids Love MyDojo ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Why Parents Choose Us</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase">MORE THAN JUST KICKS</h2>
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
            <h2 className="text-4xl md:text-5xl font-black uppercase">FIND THE RIGHT FIT</h2>
          </div>
          <div className="flex flex-col gap-16">
            {PROGRAMS.map((prog, i) => (
              <div
                key={prog.id}
                className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Image */}
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

      {/* ── Summer Camp CTA ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${CDN}/camp-week-blackbelt-eBw9jDNg8tQCULVhr3BACh.webp`} alt="Summer Camp" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-3">Seasonal Program</p>
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4">SUMMER CAMP</h2>
          <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
            A week-long adventure packed with martial arts, games, field trips, and memories that last a lifetime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openBookFreeClassGate()}
              className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-wider px-8 py-4 rounded-sm transition-all"
            >
              Reserve a Spot
            </button>
            <Link href="/summer-camp">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black uppercase tracking-wider px-8 py-4 h-auto font-bold rounded-sm">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary font-bold uppercase tracking-widest text-sm mb-2">What Parents Say</p>
          <h2 className="text-4xl font-black uppercase mb-12">REAL RESULTS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "My son went from shy and timid to confident and focused. MyDojo changed his life.", name: "Sarah M.", stars: 5 },
              { quote: "The instructors are incredible with kids. My daughter looks forward to every class.", name: "James R.", stars: 5 },
              { quote: "Best investment we've made for our kids. Discipline, respect, and real skills.", name: "Maria L.", stars: 5 },
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
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4">READY TO START?</h2>
          <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
            Join our high-energy, fun 45-minute complimentary kids martial arts class today!
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
