import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { X, ChevronLeft, ChevronRight, Loader2, CheckCircle } from "lucide-react";

// ─── Trigger config ────────────────────────────────────────────────────────────
const STORAGE_KEY = "mydojo_popup_slideshow_v1";
const DELAY_MS = 8000;          // show after 8 s
const SCROLL_THRESHOLD = 0.40;  // OR when 40% scrolled

// ─── Slide definitions ─────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: "summer_camp" as const,
    bg: "/images/summer-camp/hero-colorful.webp",
    accent: "#f59e0b",         // amber
    accentDark: "#b45309",
    badge: "🏕️  Summer 2025",
    headline: ["SUMMER", "CAMP"],
    sub: "Martial Arts · Games · Team Challenges",
    bullets: ["Ages 5–14 · All skill levels", "Full-day & half-day options", "Certified instructors", "Early-bird pricing for sign-ups"],
    cta: "Reserve My Spot →",
    successHeadline: "You're on the list! 🎉",
    successBody: "We'll send early-bird pricing and registration details straight to your inbox.",
  },
  {
    id: "kickboxing" as const,
    bg: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/fqJvsNaCyZStNXye.jpg",
    accent: "#CC0000",
    accentDark: "#991b1b",
    badge: "🥊  Free Trial Class",
    headline: ["BURN UP TO", "800 CAL"],
    sub: "Adult Kickboxing · All Fitness Levels",
    bullets: ["45-minute high-energy sessions", "Real martial arts technique", "No experience needed", "First class is completely FREE"],
    cta: "Claim My Free Class →",
    successHeadline: "You're in! 🔥",
    successBody: "Our team will contact you shortly to schedule your FREE kickboxing class.",
  },
] as const;

type SlideId = typeof SLIDES[number]["id"];

// ─── Per-slide form state ──────────────────────────────────────────────────────
function useSlideForm(campaign: SlideId) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const mutation = trpc.popup.submitLead.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setAlreadySubmitted(data.alreadySubmitted);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    mutation.mutate({
      campaign,
      name: name.trim() || undefined,
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
  };

  return { name, setName, email, setEmail, phone, setPhone, submitted, alreadySubmitted, mutation, handleSubmit };
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PopupSlideshow() {
  const [visible, setVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const triggered = useRef(false);

  const shouldShow = () => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return true; }
  };

  const trigger = useCallback(() => {
    if (triggered.current || !shouldShow()) return;
    triggered.current = true;
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!shouldShow()) return;

    const timer = setTimeout(trigger, DELAY_MS);

    const handleScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      if (total > 0 && window.scrollY / total >= SCROLL_THRESHOLD) trigger();
    };

    // Exit-intent (desktop)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [trigger]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
  };

  const goTo = (idx: number) => {
    if (transitioning || idx === activeIdx) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setTransitioning(false);
    }, 250);
  };

  if (!visible) return null;

  const slide = SLIDES[activeIdx];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-[300] backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[301] flex items-center justify-center p-3 sm:p-6"
      >
        <div
          className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Background image layer ── */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
            style={{
              backgroundImage: `url('${slide.bg}')`,
              opacity: transitioning ? 0 : 1,
            }}
          />
          {/* Dark gradient overlay — stronger at bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/90" />

          {/* ── Close button ── */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── Slide nav dots ── */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: i === activeIdx ? slide.accent : "rgba(255,255,255,0.4)",
                  transform: i === activeIdx ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {/* ── Prev / Next arrows ── */}
          {activeIdx > 0 && (
            <button
              onClick={() => goTo(activeIdx - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {activeIdx < SLIDES.length - 1 && (
            <button
              onClick={() => goTo(activeIdx + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* ── Content ── */}
          <div
            className="relative z-10 flex flex-col md:flex-row min-h-[520px] transition-opacity duration-250"
            style={{ opacity: transitioning ? 0 : 1 }}
          >
            {/* Left: headline + bullets */}
            <div className="flex-1 flex flex-col justify-end p-6 md:p-8 md:pr-4">
              {/* Badge */}
              <div
                className="inline-block self-start text-white text-xs font-bold tracking-[2px] uppercase px-3 py-1 rounded-full mb-4"
                style={{ background: slide.accent }}
              >
                {slide.badge}
              </div>

              {/* Headline */}
              <h2 className="text-white font-black leading-none mb-1" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>
                {slide.headline[0]}
              </h2>
              <h2
                className="font-black leading-none mb-3"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: slide.accent }}
              >
                {slide.headline[1]}
              </h2>
              <p className="text-white/80 text-sm uppercase tracking-widest mb-5">{slide.sub}</p>

              {/* Bullets */}
              <ul className="space-y-2 hidden md:block">
                {slide.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-white/90 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: slide.accent }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: form panel */}
            <div className="w-full md:w-72 bg-white/10 backdrop-blur-md border-l border-white/10 p-6 flex flex-col justify-center">
              <SlideForm slide={slide} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Per-slide form sub-component ─────────────────────────────────────────────
function SlideForm({ slide }: { slide: typeof SLIDES[number] }) {
  const { name, setName, email, setEmail, phone, setPhone, submitted, alreadySubmitted, mutation, handleSubmit } =
    useSlideForm(slide.id);

  if (submitted) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: slide.accent }} />
        <h3 className="text-white font-bold text-lg mb-2">{slide.successHeadline}</h3>
        <p className="text-white/80 text-sm">
          {alreadySubmitted ? "We already have your info — we'll be in touch!" : slide.successBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-white font-bold text-base mb-1">Sign up — it's free!</p>

      <input
        type="text"
        placeholder="Your name *"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/20 border border-white/30 text-white placeholder-white/60 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        style={{ "--tw-ring-color": slide.accent } as React.CSSProperties}
      />
      <input
        type="email"
        placeholder="Email address *"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-white/20 border border-white/30 text-white placeholder-white/60 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        style={{ "--tw-ring-color": slide.accent } as React.CSSProperties}
      />
      <input
        type="tel"
        placeholder="Phone number *"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full bg-white/20 border border-white/30 text-white placeholder-white/60 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
        style={{ "--tw-ring-color": slide.accent } as React.CSSProperties}
      />

      {mutation.error && (
        <p className="text-red-300 text-xs">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full text-white font-bold uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 hover:brightness-110"
        style={{ background: slide.accent }}
      >
        {mutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        ) : (
          slide.cta
        )}
      </button>

      <p className="text-white/40 text-xs text-center">No spam. Unsubscribe anytime.</p>
    </form>
  );
}
