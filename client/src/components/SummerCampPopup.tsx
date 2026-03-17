import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { X, Sun, CheckCircle, Loader2, Star } from "lucide-react";

const STORAGE_KEY = "mydojo_summer_camp_popup_v1";
// Show after 8 seconds OR when user scrolls 40% down the page
const DELAY_MS = 8000;
const SCROLL_THRESHOLD = 0.40;

export default function SummerCampPopup() {
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

    // Timer trigger
    const timer = setTimeout(trigger, DELAY_MS);

    // Scroll trigger
    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled >= SCROLL_THRESHOLD) trigger();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
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
      campaign: "summer_camp",
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
        className="fixed inset-0 bg-black/70 z-[300] backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="summer-camp-popup-title"
        className="fixed inset-0 z-[301] flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header — warm summer gradient */}
          <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 px-6 pt-8 pb-6 text-center overflow-hidden">
            {/* Decorative sun rays */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-0.5 h-32 bg-white origin-bottom"
                  style={{ transform: `translateX(-50%) rotate(${i * 45}deg) translateY(-100%)` }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
                <Sun className="w-8 h-8 text-white" />
              </div>
              <div className="inline-block bg-white/20 text-white text-xs font-bold tracking-[3px] uppercase px-3 py-1 rounded-full mb-2">
                Summer 2025
              </div>
              <h2
                id="summer-camp-popup-title"
                className="text-white font-extrabold text-2xl md:text-3xl leading-tight"
              >
                MyDojo<br />
                <span className="text-yellow-200">Summer Camp</span>
              </h2>
              <p className="text-white/90 text-sm mt-2">
                Martial arts · Fitness games · Team challenges
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {alreadySubmitted ? "You're already on the list!" : "You're on the list! 🎉"}
                </h3>
                <p className="text-gray-600 text-sm mb-5">
                  {alreadySubmitted
                    ? "We already have your info. We'll be in touch when registration opens!"
                    : "We'll send you early-bird pricing and registration details as soon as they're available. Check your inbox!"}
                </p>
                <button
                  onClick={dismiss}
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-colors text-sm"
                >
                  Explore Summer Camp →
                </button>
              </div>
            ) : (
              <>
                {/* Highlights */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: "🥋", text: "Ages 5–14" },
                    { icon: "☀️", text: "All skill levels" },
                    { icon: "🏆", text: "Early-bird pricing" },
                    { icon: "🛡️", text: "Certified instructors" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-600 mb-4 text-center">
                  <strong>Join the interest list</strong> for early-bird pricing and first access to registration.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name *"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email address *"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number *"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />

                  {submitMutation.error && (
                    <p className="text-red-600 text-xs">Something went wrong. Please try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-60 text-white font-bold uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : (
                      <><Star className="w-4 h-4" /> Reserve My Spot →</>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-3">
                  No spam. Unsubscribe anytime.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
