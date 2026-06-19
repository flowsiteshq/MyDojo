import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { X, CheckCircle, Loader2, Flame, Zap } from "lucide-react";

const STORAGE_KEY = "mydojo_kickboxing_popup_v1";
// Show on exit-intent (cursor leaves top) OR after scrolling 60% down
const SCROLL_THRESHOLD = 0.60;

export default function KickboxingPopup() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const triggered = useRef(false);

  const submitMutation = trpc.popup.submitLead.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setAlreadySubmitted(data.alreadySubmitted);
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
    },
  });

  const shouldShow = () => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch (_) { return true; }
  };

  const trigger = () => {
    if (triggered.current || !shouldShow()) return;
    triggered.current = true;
    setVisible(true);
  };

  useEffect(() => {
    if (!shouldShow()) return;

    // Exit-intent: desktop — cursor leaves top of viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    // Exit-intent: mobile — tab switch / app backgrounded
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") trigger();
    };

    // Scroll trigger at 60%
    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled >= SCROLL_THRESHOLD) trigger();
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    submitMutation.mutate({
      campaign: "kickboxing",
      name: name.trim() || undefined,
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 z-[300] backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal — slide in from right on desktop, bottom on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kickboxing-popup-title"
        className="fixed inset-0 z-[301] flex items-center justify-center p-4 sm:items-center sm:justify-end sm:pr-8"
      >
        <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-400">

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-20 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header — dark, high-energy */}
          <div className="relative bg-black px-6 pt-7 pb-5 text-center overflow-hidden">
            {/* Animated fire glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/60 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold tracking-[2px] uppercase px-3 py-1 rounded-full mb-3">
                <Flame className="w-3 h-3" /> Free Trial Class
              </div>
              <h2
                id="kickboxing-popup-title"
                className="text-white font-extrabold text-2xl leading-tight"
              >
                BURN UP TO<br />
                <span className="text-[#CC0000] text-4xl">800 CAL</span><br />
                IN 45 MINUTES
              </h2>
              <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">
                Adult Kickboxing · All Levels
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {submitted ? (
              <div className="text-center py-3">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {alreadySubmitted ? "You're already on the list!" : "You're in! 🔥"}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {alreadySubmitted
                    ? "We already have your info. Our team will reach out to schedule your free class!"
                    : "Our team will contact you shortly to schedule your FREE kickboxing class. Get ready!"}
                </p>
                <button
                  onClick={dismiss}
                  className="inline-block bg-[#CC0000] hover:bg-red-700 text-white font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors text-sm"
                >
                  See Class Schedule →
                </button>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="flex justify-around mb-4 py-3 bg-gray-50 rounded-xl">
                  {[
                    { value: "45", unit: "min", label: "Class" },
                    { value: "800", unit: "cal", label: "Burned" },
                    { value: "100%", unit: "", label: "Free trial" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-xl font-extrabold text-gray-900 leading-none">
                        {stat.value}<span className="text-xs font-semibold text-[#CC0000]">{stat.unit}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-600 mb-4 text-center">
                  Sign up below and our team will contact you to schedule your <strong>FREE first class</strong>.
                </p>

                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Your name *"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email address *"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number *"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />

                  {submitMutation.error && (
                    <p className="text-red-600 text-xs">Something went wrong. Please try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full bg-[#CC0000] hover:bg-red-700 disabled:opacity-60 text-white font-bold uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Zap className="w-4 h-4" /> Claim My Free Class →</>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-2.5">
                  No spam. No commitment. Just results.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
