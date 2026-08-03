import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";

interface KioskEventScreensaverProps {
  onDismiss: () => void;
}

interface DojoEvent {
  id: string;
  title: string;
  subtitle?: string;
  date: string;       // e.g. "August 9, 2026"
  time?: string;      // e.g. "10:00 AM – 12:00 PM"
  location?: string;  // e.g. "Main Dojo Floor"
  tag?: string;       // e.g. "BELT TEST" | "SPECIAL EVENT" | "SEMINAR"
  tagColor?: string;  // e.g. "red" | "gold" | "blue" | "green"
}

/**
 * Full-screen kiosk screensaver that rotates through upcoming weekly events.
 * Replaces the old Student Drive thermometer.
 * Tapping anywhere dismisses it.
 */
export function KioskEventScreensaver({ onDismiss }: KioskEventScreensaverProps) {
  const { data } = trpc.kiosk.getScreensaverEvents.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const events: DojoEvent[] = data?.events ?? [];

  // Auto-rotate slides every 5 seconds
  const [activeIdx, setActiveIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (events.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setActiveIdx(prev => (prev + 1) % events.length);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [events.length]);

  const tagColorMap: Record<string, { bg: string; text: string; glow: string }> = {
    red:   { bg: "rgba(225,6,0,0.85)",    text: "#fff",    glow: "rgba(225,6,0,0.6)" },
    gold:  { bg: "rgba(212,175,55,0.9)",  text: "#000",    glow: "rgba(212,175,55,0.5)" },
    blue:  { bg: "rgba(30,100,220,0.85)", text: "#fff",    glow: "rgba(30,100,220,0.5)" },
    green: { bg: "rgba(22,163,74,0.85)",  text: "#fff",    glow: "rgba(22,163,74,0.5)" },
    purple:{ bg: "rgba(124,58,237,0.85)", text: "#fff",    glow: "rgba(124,58,237,0.5)" },
  };

  const event = events[activeIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none"
      style={{
        background: "linear-gradient(160deg, #0a0a0a 0%, #12000a 40%, #0a0a12 100%)",
      }}
      onClick={onDismiss}
    >
      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(225,6,0,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top header */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <img
          src="/images/logo-circular.webp"
          alt="MyDojo"
          className="w-20 h-20 mb-4"
          style={{ filter: "drop-shadow(0 0 20px rgba(225,6,0,0.7))" }}
        />
        <div className="flex items-center gap-3">
          <div className="h-px w-16" style={{ background: "linear-gradient(90deg, transparent, #E10600)" }} />
          <h2
            className="text-sm font-black uppercase tracking-[0.4em]"
            style={{ color: "#E10600", textShadow: "0 0 20px rgba(225,6,0,0.8)" }}
          >
            Upcoming Events
          </h2>
          <div className="h-px w-16" style={{ background: "linear-gradient(90deg, #E10600, transparent)" }} />
        </div>
      </div>

      {/* Event card */}
      {event ? (
        <div
          className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 mx-6 text-center"
          style={{
            opacity: fade ? 1 : 0,
            transition: "opacity 0.4s ease",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            boxShadow: "0 0 60px rgba(225,6,0,0.15), 0 0 120px rgba(0,0,0,0.5)",
            maxWidth: "680px",
            width: "100%",
          }}
        >
          {/* Tag badge */}
          {event.tag && (() => {
            const colors = tagColorMap[event.tagColor || "red"];
            return (
              <div
                className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]"
                style={{
                  background: colors.bg,
                  color: colors.text,
                  boxShadow: `0 0 20px ${colors.glow}`,
                }}
              >
                {event.tag}
              </div>
            );
          })()}

          {/* Event title */}
          <div>
            <h1
              className="font-black uppercase leading-tight mb-2"
              style={{
                fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                background: "linear-gradient(135deg, #ffffff 0%, #cccccc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.01em",
              }}
            >
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="text-lg font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                {event.subtitle}
              </p>
            )}
          </div>

          {/* Divider */}
          <div
            className="w-32 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #E10600, transparent)" }}
          />

          {/* Details row */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
              <Calendar className="w-5 h-5" style={{ color: "#E10600" }} />
              <span className="text-lg font-semibold">{event.date}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                <Clock className="w-5 h-5" style={{ color: "#E10600" }} />
                <span className="text-lg font-semibold">{event.time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                <MapPin className="w-5 h-5" style={{ color: "#E10600" }} />
                <span className="text-lg font-semibold">{event.location}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fallback if no events configured */
        <div
          className="relative z-10 flex flex-col items-center gap-4 px-10 py-10 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            maxWidth: "600px",
          }}
        >
          <h1
            className="text-5xl font-black uppercase"
            style={{
              background: "linear-gradient(135deg, #ffffff, #E10600)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            TRAIN HARD.<br />EARN YOUR BELT.
          </h1>
          <p className="text-white/40 text-base uppercase tracking-widest">No upcoming events scheduled</p>
        </div>
      )}

      {/* Slide dots */}
      {events.length > 1 && (
        <div className="relative z-10 flex gap-2 mt-8">
          {events.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIdx ? "24px" : "8px",
                height: "8px",
                background: i === activeIdx ? "#E10600" : "rgba(255,255,255,0.25)",
                boxShadow: i === activeIdx ? "0 0 10px rgba(225,6,0,0.8)" : "none",
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="relative z-10 mt-10 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.25)" }}>
        <span className="text-sm uppercase tracking-widest">Tap anywhere to check in</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}
