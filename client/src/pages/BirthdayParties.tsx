import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Star, Phone, Mail, Calendar, Users, Clock, Gift, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";

const PACKAGES = [
  {
    id: "ninja",
    name: "Ninja Party",
    emoji: "🥷",
    price: 199,
    tagline: "The Perfect Starter Party!",
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.4)",
    accent: "#a78bfa",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/bday-package-ninja-5eJDKLFQadeU39TqYLZqZJ.png",
    guests: "Up to 10 Guests",
    duration: "90 Minutes",
    features: [
      "90-minute dojo party",
      "30-min martial arts lesson",
      "Pizza & juice boxes (2 pies)",
      "Balloons & basic decorations",
      "Birthday certificate for the star",
      "Dedicated party host",
      "Invitations (digital)",
    ],
  },
  {
    id: "champion",
    name: "Champion Party",
    emoji: "🏆",
    price: 299,
    tagline: "Most Popular — Best Value!",
    color: "#d97706",
    glow: "rgba(217,119,6,0.4)",
    accent: "#fbbf24",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/bday-package-champion-Sqb2g3RSFVEeZA2VMihgtB.png",
    guests: "Up to 15 Guests",
    duration: "2 Hours",
    popular: true,
    features: [
      "2-hour dojo party",
      "45-min martial arts lesson & games",
      "Pizza & drinks (3 pies + juice)",
      "Custom banner & themed decorations",
      "Birthday certificate + trophy",
      "Dedicated party host",
      "Goodie bags for all guests",
      "Digital photo slideshow",
      "Invitations (digital + printed)",
    ],
  },
  {
    id: "blackbelt",
    name: "Black Belt VIP",
    emoji: "🥋",
    price: 449,
    tagline: "The Ultimate VIP Experience!",
    color: "#be185d",
    glow: "rgba(190,24,93,0.4)",
    accent: "#f472b6",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/bday-package-blackbelt-fP2uQ2wczPHzYL9VbHyZTA.png",
    guests: "Up to 25 Guests",
    duration: "2.5 Hours",
    features: [
      "2.5-hour VIP dojo party",
      "60-min martial arts lesson, games & board breaking",
      "Full pizza party spread (5 pies + drinks)",
      "Premium custom decorations & backdrop",
      "Birthday certificate + black belt + trophy",
      "Dedicated party host + assistant",
      "Custom goodie bags for all guests",
      "Professional photo session",
      "Custom cake cutting ceremony",
      "Invitations (digital + printed)",
      "Parent lounge area with refreshments",
    ],
  },
];

const PERKS = [
  { icon: Clock, label: "90 Min–2.5 Hrs of Fun", color: "#7c3aed" },
  { icon: Users, label: "All Ages Welcome", color: "#d97706" },
  { icon: Gift, label: "We Do All the Work!", color: "#be185d" },
  { icon: Zap, label: "Martial Arts Lesson Included", color: "#0891b2" },
];

export default function BirthdayParties() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [form, setForm] = useState({
    parentName: "",
    phone: "",
    email: "",
    childName: "",
    childAge: "",
    partyDate: "",
    guestCount: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const bookingMutation = trpc.birthday.requestBooking.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("🎉 Party request sent! We'll contact you within 24 hours.");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Something went wrong. Please call us directly.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      toast.error("Please select a package first!");
      return;
    }
    bookingMutation.mutate({ ...form, packageId: selectedPackage });
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", fontFamily: "'Oswald', 'Impact', sans-serif" }}>
      <SEO
        title="Birthday Parties at MyDojo | Martial Arts Parties Starting at $199"
        description="Host the BEST birthday party ever at MyDojo! 3 epic packages starting at $199. Martial arts lessons, pizza, decorations & more. Ages 5–14. Book today!"
      />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 600 }}>
        <div className="absolute inset-0">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/Lu5Er8YqGDyrsXYnbeua3C/bday-hero-UaDpj4SuAFNZ7KDsddA2V9.png"
            alt="MyDojo Birthday Parties"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.7) 60%, rgba(10,10,15,1) 100%)" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest mb-4"
              style={{ background: "rgba(124,58,237,0.3)", border: "1px solid #7c3aed", color: "#a78bfa" }}>
              🎂 MyDojo Birthday Parties
            </div>
            <h1 className="font-black uppercase leading-none mb-4"
              style={{ fontSize: "clamp(3rem, 10vw, 7rem)", color: "#fff", textShadow: "0 0 40px rgba(124,58,237,0.8), 0 0 80px rgba(217,119,6,0.4)" }}>
              BIRTHDAY{" "}
              <span style={{ color: "#fbbf24", textShadow: "0 0 30px rgba(251,191,36,0.9)" }}>PARTIES</span>
            </h1>
            <p className="text-2xl font-bold uppercase tracking-widest mb-2" style={{ color: "#f472b6" }}>
              HOST THE BEST PARTY EVER!
            </p>
            <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
              Martial arts fun, pizza, decorations & memories that last a lifetime 🥋🎉
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#packages">
                <Button className="font-black uppercase tracking-wider text-black px-10 py-6 h-auto text-lg rounded-xl hover:scale-105 transition-transform"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                  🎁 VIEW PACKAGES — FROM $199
                </Button>
              </a>
              <a href="#book">
                <Button variant="outline" className="font-black uppercase tracking-wider px-10 py-6 h-auto text-lg rounded-xl border-2 hover:scale-105 transition-transform"
                  style={{ borderColor: "#7c3aed", color: "#a78bfa", background: "transparent" }}>
                  📅 BOOK YOUR DATE
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PERKS BAR ─────────────────────────────────────────────────────── */}
      <section className="py-8 px-4" style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {PERKS.map((p) => (
            <div key={p.label} className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${p.color}22`, border: `1px solid ${p.color}` }}>
                <p.icon className="w-6 h-6" style={{ color: p.color }} />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.8)" }}>{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PACKAGES ──────────────────────────────────────────────────────── */}
      <section id="packages" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "#fbbf24" }}>Choose Your Experience</p>
            <h2 className="font-black uppercase text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
              3 EPIC PACKAGES
            </h2>
            <p className="mt-3 text-base" style={{ color: "rgba(255,255,255,0.5)" }}>All packages include a dedicated party host, setup & cleanup — we do all the work!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                onClick={() => {
                  setSelectedPackage(pkg.id);
                  document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `2px solid ${selectedPackage === pkg.id ? pkg.color : "rgba(255,255,255,0.08)"}`,
                  boxShadow: selectedPackage === pkg.id ? `0 0 30px ${pkg.glow}` : "none",
                }}
              >
                {pkg.popular && (
                  <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                    style={{ background: pkg.color, color: "#fff" }}>
                    ⭐ Most Popular
                  </div>
                )}

                {/* Package image */}
                <div className="relative h-52 overflow-hidden">
                  <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, rgba(10,10,15,0.95) 100%)` }} />
                  <div className="absolute bottom-3 left-4">
                    <span className="text-3xl">{pkg.emoji}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-black uppercase text-white text-xl">{pkg.name}</h3>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: pkg.accent }}>{pkg.tagline}</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-black text-4xl" style={{ color: pkg.accent }}>${pkg.price}</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>/party</span>
                  </div>

                  <div className="flex gap-4 mb-5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <span>👥 {pkg.guests}</span>
                    <span>⏱ {pkg.duration}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                        <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: pkg.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    className="w-full py-3 rounded-xl font-black uppercase tracking-wider text-sm transition-all"
                    style={{
                      background: selectedPackage === pkg.id ? pkg.color : "transparent",
                      border: `2px solid ${pkg.color}`,
                      color: selectedPackage === pkg.id ? "#fff" : pkg.accent,
                    }}
                  >
                    {selectedPackage === pkg.id ? "✓ Selected — Book Below" : "Select This Package →"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOOKING FORM ──────────────────────────────────────────────────── */}
      <section id="book" className="py-20 px-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "#fbbf24" }}>Reserve Your Date</p>
            <h2 className="font-black uppercase text-white text-4xl">BOOK YOUR PARTY</h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Fill out the form below and we'll reach out within 24 hours to confirm your date!
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center rounded-2xl p-12"
              style={{ background: "rgba(124,58,237,0.1)", border: "2px solid #7c3aed" }}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-black uppercase text-white text-2xl mb-3">Party Request Sent!</h3>
              <p style={{ color: "rgba(255,255,255,0.6)" }}>
                We'll contact you within 24 hours to confirm your date and answer any questions. Get ready for the BEST party ever!
              </p>
              <p className="mt-4 font-bold" style={{ color: "#fbbf24" }}>
                Questions? Call us: (877) 469-3656
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* Package selection indicator */}
              {selectedPackage && (
                <div className="rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2"
                  style={{ background: "rgba(124,58,237,0.15)", border: "1px solid #7c3aed", color: "#a78bfa" }}>
                  <Crown className="w-4 h-4" />
                  Package selected: {PACKAGES.find(p => p.id === selectedPackage)?.name} — ${PACKAGES.find(p => p.id === selectedPackage)?.price}
                </div>
              )}
              {!selectedPackage && (
                <div className="rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2"
                  style={{ background: "rgba(217,119,6,0.1)", border: "1px solid #d97706", color: "#fbbf24" }}>
                  ⬆️ Select a package above first, then fill out this form
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Parent Name *</label>
                  <Input required value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                    placeholder="Your full name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Phone *</label>
                  <Input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 000-0000" type="tel"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Email *</label>
                <Input required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com" type="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Birthday Child's Name *</label>
                  <Input required value={form.childName} onChange={e => setForm(f => ({ ...f, childName: e.target.value }))}
                    placeholder="Child's name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Child's Age</label>
                  <Input value={form.childAge} onChange={e => setForm(f => ({ ...f, childAge: e.target.value }))}
                    placeholder="e.g. 8" type="number" min="1" max="18"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Preferred Party Date *</label>
                  <Input required value={form.partyDate} onChange={e => setForm(f => ({ ...f, partyDate: e.target.value }))}
                    type="date" min={new Date().toISOString().split("T")[0]}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Expected Guest Count</label>
                  <Input value={form.guestCount} onChange={e => setForm(f => ({ ...f, guestCount: e.target.value }))}
                    placeholder="e.g. 15" type="number" min="1"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Special Requests / Notes</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Allergies, theme preferences, special requests…"
                  rows={3}
                  className="w-full rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 border"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                />
              </div>

              <Button type="submit" disabled={bookingMutation.isPending}
                className="w-full py-6 h-auto font-black uppercase tracking-wider text-lg rounded-xl text-black hover:scale-[1.02] transition-transform"
                style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                {bookingMutation.isPending ? "Sending…" : "🎉 REQUEST MY PARTY DATE →"}
              </Button>

              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Or call us directly: <a href="tel:8774693656" className="font-bold" style={{ color: "#fbbf24" }}>(877) 469-3656</a>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="font-black uppercase text-white text-center text-3xl mb-10">PARTY FAQ</h2>
        <div className="space-y-4">
          {[
            { q: "What ages are the parties for?", a: "Our parties are perfect for kids ages 4–14. All activities are age-appropriate and supervised by certified instructors." },
            { q: "How far in advance should I book?", a: "We recommend booking at least 2–3 weeks in advance, especially for weekend dates. Popular dates fill up fast!" },
            { q: "Can I bring my own cake?", a: "Absolutely! You're welcome to bring your own cake or order one from us. Just let us know in the notes." },
            { q: "What do guests need to wear?", a: "Comfortable athletic clothes are perfect. We provide all martial arts equipment. No need for special gear!" },
            { q: "Is a deposit required?", a: "Yes, a 50% deposit is required to hold your date. The balance is due on the day of the party." },
          ].map((item) => (
            <div key={item.q} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="font-bold text-white mb-2 flex items-start gap-2"><Star className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />{item.q}</p>
              <p className="text-sm pl-6" style={{ color: "rgba(255,255,255,0.6)" }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 text-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(190,24,93,0.2))", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="font-black uppercase text-white text-4xl mb-4">READY TO PARTY? 🎉</h2>
        <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>Call us now or book online — we'll handle everything!</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="tel:8774693656">
            <Button className="font-black uppercase tracking-wider text-black px-10 py-6 h-auto text-lg rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
              <Phone className="w-5 h-5" /> (877) 469-3656
            </Button>
          </a>
          <a href="#book">
            <Button variant="outline" className="font-black uppercase tracking-wider px-10 py-6 h-auto text-lg rounded-xl border-2 hover:scale-105 transition-transform"
              style={{ borderColor: "#7c3aed", color: "#a78bfa", background: "transparent" }}>
              <Calendar className="w-5 h-5 mr-2" /> BOOK ONLINE
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
