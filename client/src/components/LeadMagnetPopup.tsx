import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Shield, CheckCircle, Loader2 } from "lucide-react";

const STORAGE_KEY = "mydojo_lead_magnet_dismissed";

export default function LeadMagnetPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const submitMutation = trpc.leadMagnet.submit.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setAlreadySubscribed(data.alreadySubscribed);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch (_) {}
    },
  });

  useEffect(() => {
    // Don't show if already dismissed or submitted
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch (_) {}

    // Exit-intent trigger: desktop — cursor leaves top of viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        try {
          if (localStorage.getItem(STORAGE_KEY)) return;
        } catch (_) {}
        setVisible(true);
        // Remove listener after first trigger
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    // Exit-intent trigger: mobile — user switches tab / backgrounds the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        try {
          if (localStorage.getItem(STORAGE_KEY)) return;
        } catch (_) {}
        setVisible(true);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    submitMutation.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-magnet-title"
        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header band */}
          <div className="bg-black px-6 py-5 text-center">
            <p className="text-[#CC0000] text-xs font-bold tracking-[3px] uppercase mb-1">
              Free Download
            </p>
            <h2
              id="lead-magnet-title"
              className="text-white font-bold text-xl md:text-2xl leading-tight"
            >
              5 Self-Defense Moves<br />
              <span className="text-[#CC0000]">Every Parent</span> Should Teach Their Child
            </h2>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {submitted ? (
              /* Success state */
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {alreadySubscribed ? "You're already on the list!" : "Check your inbox!"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {alreadySubscribed
                    ? "We already have your email. The guide was sent when you first signed up."
                    : "We just sent the free guide to your email. While you're here — book a free trial class for your child!"}
                </p>
                <a
                  href="/#start"
                  onClick={dismiss}
                  className="inline-block bg-[#CC0000] hover:bg-red-700 text-white font-bold uppercase tracking-wider px-8 py-3 rounded-lg transition-colors"
                >
                  Book Free Trial Class →
                </a>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="flex items-start gap-3 mb-5 bg-gray-50 rounded-xl p-4">
                  <Shield className="w-8 h-8 text-[#CC0000] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Our certified instructors teach these exact moves to kids every week. Get the
                    free guide and see why <strong>500+ Tomball families</strong> trust MyDojo.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="lm-name" className="sr-only">
                      First name (optional)
                    </label>
                    <input
                      id="lm-name"
                      type="text"
                      placeholder="First name (optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lm-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="lm-email"
                      type="email"
                      placeholder="Your email address *"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="lm-phone" className="sr-only">
                      Phone number (optional)
                    </label>
                    <input
                      id="lm-phone"
                      type="tel"
                      placeholder="Phone number (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                    />
                  </div>

                  {submitMutation.error && (
                    <p className="text-red-600 text-sm">
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full bg-[#CC0000] hover:bg-red-700 disabled:opacity-60 text-white font-bold uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send Me the Free Guide →"
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
