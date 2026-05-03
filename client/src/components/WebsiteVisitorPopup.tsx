import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, X } from "lucide-react";

const STORAGE_KEY = "mydojo-visitor-lead-captured";

export function WebsiteVisitorPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only show if:
    // 1. User accepted marketing cookies
    // 2. We haven't already captured this visitor
    const checkAndShow = () => {
      const prefs = localStorage.getItem("cookie-preferences");
      const alreadyCaptured = localStorage.getItem(STORAGE_KEY);
      if (alreadyCaptured) return;

      let marketingEnabled = false;
      try {
        const parsed = prefs ? JSON.parse(prefs) : null;
        marketingEnabled = parsed?.marketing === true;
      } catch {
        marketingEnabled = false;
      }

      if (marketingEnabled) {
        // Show popup after 15 seconds of browsing
        const timer = setTimeout(() => setIsOpen(true), 15000);
        return () => clearTimeout(timer);
      }
    };

    // Listen for cookie consent acceptance
    const handleCookieAccepted = () => {
      const alreadyCaptured = localStorage.getItem(STORAGE_KEY);
      if (!alreadyCaptured) {
        setTimeout(() => setIsOpen(true), 2000);
      }
    };

    window.addEventListener("mydojo:cookieAccepted", handleCookieAccepted);
    const cleanup = checkAndShow();

    return () => {
      window.removeEventListener("mydojo:cookieAccepted", handleCookieAccepted);
      cleanup?.();
    };
  }, []);

  const submitMutation = trpc.trialSignups.create.useMutation({
    onSuccess: () => {
      localStorage.setItem(STORAGE_KEY, "true");
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const programMap: Record<string, "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "After School" | "Not Sure"> = {
      "little-ninjas": "Little Ninjas",
      "core-kids": "Dragon Kids",
      "teens": "Teens",
      "adults": "Adult Karate",
      "kickboxing": "Kickboxing",
      "after-school": "After School",
    };

    submitMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim(),
      program: programMap[program] ?? "Not Sure",
      location: "Tomball HQ",
      preferredContactMethod: "text",
      source: "website",
    });
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setIsOpen(false);
  };

  const isSuccess = submitMutation.isSuccess;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white text-black border-0 shadow-2xl" showCloseButton={false}>
        {/* Header image / hero */}
        <div className="relative bg-black h-36 flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: "url('/images/hero-main.jpg')" }}
          />
          <div className="relative z-10 text-center px-6">
            <p className="text-primary font-bold uppercase tracking-widest text-xs mb-1">MyDojo Martial Arts</p>
            <h2 className="text-white text-2xl font-heading font-bold leading-tight">
              {isSuccess ? "YOU'RE IN! 🥋" : "CLAIM YOUR FREE CLASS"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white z-20 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center">
              <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-gray-700 text-sm">
                Thanks! We'll text you shortly to schedule your free trial class. See you on the mat!
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-wider"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm text-center mb-5">
                Try a complimentary 45-min karate or kickboxing class — no experience needed!
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="vp-name" className="text-xs font-bold uppercase text-gray-500">Your Name *</Label>
                  <Input
                    id="vp-name"
                    required
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vp-phone" className="text-xs font-bold uppercase text-gray-500">Phone Number *</Label>
                  <Input
                    id="vp-phone"
                    type="tel"
                    required
                    placeholder="(832) 555-1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vp-email" className="text-xs font-bold uppercase text-gray-500">Email (optional)</Label>
                  <Input
                    id="vp-email"
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vp-program" className="text-xs font-bold uppercase text-gray-500">Interested In</Label>
                  <Select value={program} onValueChange={setProgram}>
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="little-ninjas">Little Ninjas (Ages 3–5)</SelectItem>
                      <SelectItem value="core-kids">Dragon Kids (Ages 5–12)</SelectItem>
                      <SelectItem value="teens">Teens (Ages 12–17)</SelectItem>
                      <SelectItem value="adults">Adult Karate (18+)</SelectItem>
                      <SelectItem value="kickboxing">Kickboxing</SelectItem>
                      <SelectItem value="after-school">After School Program</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <p className="text-sm text-red-600 text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-11 font-heading uppercase tracking-wider text-base mt-1"
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    "Get My Free Class"
                  )}
                </Button>

                <p className="text-[10px] text-center text-gray-400">
                  By submitting, you agree to receive texts/emails from MyDojo. Msg &amp; data rates may apply.
                  You consented to this via our cookie policy. <a href="/privacy-policy" className="underline">Privacy Policy</a>
                </p>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
