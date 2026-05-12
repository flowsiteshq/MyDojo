import { Link } from "wouter";
import { Phone, CheckCircle, Calendar, Clock, Shirt, Users } from "lucide-react";
import { openIntakeChatbot } from "@/lib/chatbot";

/**
 * MobileHome — shown ONLY on mobile (< md breakpoint).
 * Matches the provided mockup:
 *  1. Full-bleed hero with dark overlay, headline, 3 benefit pills, ENROLL NOW CTA
 *  2. "At a Glance" stats strip (4 columns)
 *  3. "Why Parents Choose Us" — checklist left, photo right
 *  4. Sticky bottom bar — phone + ENROLL NOW
 */
export function MobileHome() {
  return (
    <div className="md:hidden flex flex-col w-full">
      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col justify-end pb-8">
        {/* Background image — use img tag for reliable mobile rendering */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/hero1_1d3d63d3.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />

        {/* Content */}
        <div className="relative z-10 px-5 pb-4">
          <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">
            Give your child an unforgettable
          </p>
          <h1 className="font-heading font-black text-white text-4xl leading-tight mb-1">
            SUMMER OF
          </h1>
          <h1 className="font-heading font-black text-primary text-4xl leading-tight mb-4">
            GROWTH &amp; FUN!
          </h1>
          <p className="text-white/90 text-base mb-5 leading-relaxed">
            Our summer camp builds confidence, discipline, and friendships that last.
          </p>

          {/* 3 benefit pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { icon: "👤", label: "Build Confidence" },
              { icon: "⭐", label: "Learn Life Skills" },
              { icon: "👥", label: "Make Friends" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5"
              >
                <span className="text-sm">{b.icon}</span>
                <span className="text-white text-xs font-semibold">{b.label}</span>
              </div>
            ))}
          </div>

          {/* ENROLL NOW CTA */}
          <Link href="/summer-camp/enroll">
            <button className="w-full bg-primary hover:bg-primary/90 text-white font-heading font-black text-lg uppercase tracking-widest py-4 rounded-xl shadow-xl mb-2">
              ENROLL NOW
            </button>
          </Link>
          <p className="text-white/60 text-xs text-center">2 Classes + Uniform Included</p>
        </div>
      </section>

      {/* ── 2. AT A GLANCE STATS STRIP ──────────────────────────────────── */}
      <section className="bg-white mx-4 -mt-6 rounded-2xl shadow-xl px-4 py-5 relative z-10">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
          Summer Camp at a Glance
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Calendar className="h-6 w-6 text-primary mx-auto mb-1" />, value: "10 Weeks", sub: "of fun & growth" },
            { icon: <Clock className="h-6 w-6 text-primary mx-auto mb-1" />, value: "Daily", sub: "activities" },
            { icon: <Shirt className="h-6 w-6 text-primary mx-auto mb-1" />, value: "Uniform", sub: "included" },
            { icon: <Users className="h-6 w-6 text-primary mx-auto mb-1" />, value: "Ages 5–14", sub: "welcome" },
          ].map((s) => (
            <div key={s.value} className="text-center">
              {s.icon}
              <p className="font-bold text-xs text-gray-900 leading-tight">{s.value}</p>
              <p className="text-gray-400 text-[10px] leading-tight">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. WHY PARENTS CHOOSE US ────────────────────────────────────── */}
      <section className="px-4 pt-8 pb-6">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">
          Why Parents Choose Us
        </p>
        <div className="flex gap-4 items-start">
          {/* Checklist */}
          <div className="flex-1">
            <h2 className="font-heading font-black text-gray-900 text-2xl leading-tight mb-4">
              More Than Just a Camp
            </h2>
            <ul className="space-y-2.5">
              {[
                "Certified & experienced instructors",
                "Safe, positive & supportive environment",
                "Structured classes with real-life lessons",
                "Active, engaging & screen-free",
                "Builds confidence, focus & discipline",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Photo */}
          <div className="w-36 flex-shrink-0">
            <img
              src="/images/community-candid-logo.png"
              alt="MyDojo kids"
              className="w-full h-44 object-cover rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* ── 4. PROGRAMS QUICK LINKS ─────────────────────────────────────── */}
      <section className="px-4 pb-6">
        <h3 className="font-heading font-black text-gray-900 text-xl mb-3">Our Programs</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Little Ninjas", age: "Ages 3–5", img: "/images/program-little-ninjas.jpg", href: "/programs#little-ninjas" },
            { label: "Core Kids", age: "Ages 5–12", img: "/images/program-core-kids.jpg", href: "/programs#dragon-kids" },
            { label: "Teens & Adults", age: "Ages 13+", img: "/images/program-teens-adults-branded.png", href: "/programs#teens-adults" },
            { label: "Kickboxing", age: "All ages", img: "/images/featured-kickboxing.jpg", href: "/programs/kickboxing" },
          ].map((p) => (
            <Link key={p.label} href={p.href}>
              <div className="relative rounded-xl overflow-hidden h-28 shadow-md">
                <img src={p.img} alt={p.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-2">
                  <p className="text-white font-bold text-xs leading-tight">{p.label}</p>
                  <p className="text-white/70 text-[10px]">{p.age}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. BOOK FREE TRIAL CTA ──────────────────────────────────────── */}
      <section className="mx-4 mb-6 bg-black rounded-2xl px-5 py-6 text-center">
        <p className="text-primary font-bold text-xs uppercase tracking-widest mb-1">Limited Spots</p>
        <h3 className="text-white font-heading font-black text-2xl mb-2">Try a FREE Class!</h3>
        <p className="text-gray-400 text-sm mb-4">No experience needed. All ages welcome.</p>
        <button
          onClick={openIntakeChatbot}
          className="w-full bg-primary text-white font-heading font-black uppercase tracking-wider py-3.5 rounded-xl text-base"
        >
          Book Free Trial
        </button>
      </section>

      {/* Spacer so sticky bar doesn't cover content */}
      <div className="h-20" />

      {/* ── 6. STICKY BOTTOM BAR ────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-2xl px-4 py-3 flex items-center gap-3">
        <a
          href="tel:8774693656"
          className="flex items-center gap-2 text-white flex-shrink-0"
        >
          <Phone className="h-5 w-5" />
          <div className="leading-none">
            <p className="text-[10px] text-white/80 font-medium">Call Us</p>
            <p className="text-sm font-bold">(877) 469-3656</p>
          </div>
        </a>
        <div className="w-px h-8 bg-white/30 mx-1" />
        <Link href="/summer-camp/enroll" className="flex-1">
          <button className="w-full bg-white text-primary font-heading font-black uppercase tracking-wider py-2.5 rounded-lg text-sm">
            ENROLL NOW
          </button>
        </Link>
      </div>
    </div>
  );
}
