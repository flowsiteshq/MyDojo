import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, ChevronRight, Sparkles } from "lucide-react";

interface KioskEventScreensaverProps {
  onDismiss: () => void;
}

type HalloweenEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: string;
  tag: string;
  accent: string;
};

const HALLOWEEN_EVENTS: HalloweenEvent[] = [
  {
    id: "haunted-dojo-2026",
    title: "Haunted Dojo",
    subtitle: "Parents' Night Out · Games, pizza, and spooky fun",
    date: "Friday, October 30",
    time: "6:00–9:00 PM",
    location: "Main Dojo Floor",
    tag: "SPECIAL EVENT",
    accent: "#ff7a18",
  },
  {
    id: "belt-test-2026",
    title: "Halloween Belt Test",
    subtitle: "Bring your focus, courage, and best spirit to the mat",
    date: "Saturday, October 31",
    time: "10:00 AM",
    location: "Main Dojo Floor",
    tag: "BELT TEST",
    accent: "#a855f7",
  },
];

/**
 * Full-screen idle display for the kiosk.
 * This is intentionally self-contained so stale event-feed messages cannot
 * reappear on the check-in screensaver.
 */
export function KioskEventScreensaver({ onDismiss }: KioskEventScreensaverProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const event = HALLOWEEN_EVENTS[activeIdx];

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setActiveIdx((previous) => (previous + 1) % HALLOWEEN_EVENTS.length);
        setFade(true);
      }, 250);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none"
      style={{
        background: "radial-gradient(circle at 50% 20%, rgba(255,122,24,0.18), transparent 35%), linear-gradient(145deg, #090512 0%, #160522 48%, #09050f 100%)",
      }}
      onClick={onDismiss}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(#ff7a18 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
      <div className="absolute -top-20 -left-14 text-[11rem] opacity-10 rotate-[-18deg]">🕸️</div>
      <div className="absolute -bottom-16 -right-8 text-[10rem] opacity-10 rotate-[18deg]">🦇</div>

      <div className="relative z-10 flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-4 text-5xl mb-3" aria-hidden="true">
          <span>🎃</span><Sparkles className="w-8 h-8" style={{ color: "#ffb347" }} /><span>👻</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-px w-14" style={{ background: "linear-gradient(90deg, transparent, #ff7a18)" }} />
          <h2 className="text-sm font-black uppercase tracking-[0.35em]" style={{ color: "#ff9d3d", textShadow: "0 0 20px rgba(255,122,24,0.8)" }}>
            MyDojo Halloween Week
          </h2>
          <div className="h-px w-14" style={{ background: "linear-gradient(90deg, #ff7a18, transparent)" }} />
        </div>
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-6 px-8 py-9 mx-6 text-center max-w-3xl w-[calc(100%-3rem)]"
        style={{
          opacity: fade ? 1 : 0,
          transition: "opacity 0.25s ease",
          background: "linear-gradient(135deg, rgba(255,122,24,0.13), rgba(168,85,247,0.13))",
          border: `2px solid ${event.accent}99`,
          borderRadius: "28px",
          boxShadow: `0 0 70px ${event.accent}33, inset 0 0 40px rgba(255,255,255,0.03)`,
        }}
      >
        <div className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em]" style={{ background: event.accent, color: "#120817", boxShadow: `0 0 24px ${event.accent}99` }}>
          {event.tag}
        </div>
        <div>
          <h1 className="font-black uppercase leading-tight mb-2" style={{ fontSize: "clamp(2.6rem, 8vw, 5.5rem)", background: `linear-gradient(135deg, #fff 15%, ${event.accent} 80%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {event.title}
          </h1>
          <p className="text-lg md:text-xl font-medium text-white/70">{event.subtitle}</p>
        </div>
        <div className="w-36 h-px" style={{ background: `linear-gradient(90deg, transparent, ${event.accent}, transparent)` }} />
        <div className="flex flex-wrap justify-center gap-5 text-white/80">
          <div className="flex items-center gap-2"><Calendar className="w-5 h-5" style={{ color: event.accent }} /><span className="font-semibold">{event.date}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-5 h-5" style={{ color: event.accent }} /><span className="font-semibold">{event.time}</span></div>
          <div className="flex items-center gap-2"><MapPin className="w-5 h-5" style={{ color: event.accent }} /><span className="font-semibold">{event.location}</span></div>
        </div>
      </div>

      <div className="relative z-10 flex gap-2 mt-7">
        {HALLOWEEN_EVENTS.map((item, index) => <div key={item.id} className="rounded-full transition-all duration-300" style={{ width: index === activeIdx ? "24px" : "8px", height: "8px", background: index === activeIdx ? item.accent : "rgba(255,255,255,0.25)" }} />)}
      </div>
      <div className="relative z-10 mt-8 flex items-center gap-2 text-white/40">
        <span className="text-sm uppercase tracking-widest">Tap anywhere to check in</span><ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}
