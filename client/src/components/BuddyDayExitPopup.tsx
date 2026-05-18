import { useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar, Clock, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "mydojo_buddy_day_exit_popup_v1";
// Only show after the visitor popup has had a chance to appear (20s+)
const MIN_TIME_ON_PAGE_MS = 20_000;

export default function BuddyDayExitPopup() {
  const [visible, setVisible] = useState(false);
  const triggered = useRef(false);
  const pageEnterTime = useRef(Date.now());

  const shouldShow = () => {
    try { return !sessionStorage.getItem(STORAGE_KEY); } catch { return true; }
  };

  const trigger = useCallback(() => {
    if (triggered.current || !shouldShow()) return;
    // Only fire if user has been on page long enough (other popups already shown)
    const timeOnPage = Date.now() - pageEnterTime.current;
    if (timeOnPage < MIN_TIME_ON_PAGE_MS) return;
    triggered.current = true;
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!shouldShow()) return;

    // Exit-intent: fires when cursor leaves the top of the viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [trigger]);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* noop */ }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 z-[400] backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buddy-day-exit-title"
        className="fixed inset-0 z-[401] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-black">

          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/images/hero-main.jpg')" }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Badge */}
            <div className="inline-block bg-red-600 text-white text-xs font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-5">
              🥋 Free Event — Don't Miss It!
            </div>

            {/* Headline */}
            <h2
              id="buddy-day-exit-title"
              className="text-white font-black leading-none mb-2"
              style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}
            >
              BUDDY DAY
            </h2>
            <h3
              className="font-black leading-none mb-4"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", color: "#CC0000" }}
            >
              BOARD BREAKING NIGHT
            </h3>

            <p className="text-white/80 text-sm uppercase tracking-widest mb-6">
              All Ranks &amp; Ages Welcome
            </p>

            {/* Event details */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6 text-left space-y-3">
              <div className="flex items-center gap-3 text-white">
                <Calendar className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="font-semibold">Wednesday, May 20th, 2026</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <Clock className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="font-semibold">6:00 PM – 7:30 PM</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <MapPin className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="font-semibold">MyDojo Tomball HQ</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <Users className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="font-semibold">Bring a friend — it's FREE!</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/buddy-day" onClick={dismiss} className="flex-1">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all text-sm">
                  RSVP Now — It's Free →
                </button>
              </Link>
              <button
                onClick={dismiss}
                className="flex-1 border border-white/30 text-white/70 hover:text-white hover:border-white/60 font-medium py-3.5 rounded-xl transition-all text-sm"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-white/40 text-xs mt-4">
              RSVP helps us prepare enough boards for everyone!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
