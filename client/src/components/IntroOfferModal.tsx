/**
 * IntroOfferModal.tsx
 * $29 intro offer popup with program selection → Stripe checkout
 * Programs: Little Ninjas, Kids Martial Arts, Teens & Adults, Adult Karate, Kickboxing (First Class Free)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  CheckCircle2,
  Loader2,
  Star,
  Zap,
} from "lucide-react";

export type ProgramId =
  | "little-ninjas"
  | "kids-martial-arts"
  | "teens-adults"
  | "adult-karate"
  | "kickboxing";

interface Program {
  id: ProgramId;
  name: string;
  ageGroup: string;
  tagline: string;
  color: string;
  bgGradient: string;
  offer: string;
  benefits: string[];
  firstClassFree?: boolean;
  icon: string;
}

const PROGRAMS: Program[] = [
  {
    id: "little-ninjas",
    name: "Little Ninjas",
    ageGroup: "Ages 3–5",
    tagline: "Big Confidence Starts Here",
    color: "#7C3AED",
    bgGradient: "from-purple-700 to-purple-900",
    offer: "2 Classes for $29 — Uniform Included!",
    benefits: ["Builds Confidence", "Improves Focus", "Listening Skills", "Fun & Engaging"],
    icon: "🥋",
  },
  {
    id: "kids-martial-arts",
    name: "Kids Martial Arts",
    ageGroup: "Ages 6–12",
    tagline: "Strong Today. Leader Tomorrow.",
    color: "#1D4ED8",
    bgGradient: "from-blue-700 to-blue-900",
    offer: "2 Classes for $29 — Uniform Included!",
    benefits: ["Builds Discipline", "Anti-Bullying Skills", "Improves Fitness", "Leadership & Respect"],
    icon: "🏆",
  },
  {
    id: "teens-adults",
    name: "Teens & Adults",
    ageGroup: "Ages 13+",
    tagline: "Confidence. Focus. Strength.",
    color: "#B91C1C",
    bgGradient: "from-red-700 to-red-900",
    offer: "2 Classes for $29 — Uniform Included!",
    benefits: ["Self-Defense Skills", "Stress Relief", "Improved Fitness", "Build Confidence"],
    icon: "⚡",
  },
  {
    id: "adult-karate",
    name: "Adult Karate",
    ageGroup: "Adults",
    tagline: "Discipline. Power. Mastery.",
    color: "#1F2937",
    bgGradient: "from-gray-700 to-gray-900",
    offer: "2 Classes for $29 — Uniform Included!",
    benefits: ["Traditional Karate", "Self-Defense", "Mental Discipline", "Physical Fitness"],
    icon: "🎯",
  },
  {
    id: "kickboxing",
    name: "Kickboxing Fitness",
    ageGroup: "Teens & Adults",
    tagline: "Sweat Today. Feel Amazing.",
    color: "#15803D",
    bgGradient: "from-green-700 to-green-900",
    offer: "First Class FREE!",
    benefits: ["Burn 800 Calories", "Relieve Stress", "Boost Endurance", "High-Energy Workouts"],
    firstClassFree: true,
    icon: "🔥",
  },
];

type Step = "select" | "info" | "redirecting";

interface IntroOfferModalProps {
  open: boolean;
  onClose: () => void;
  defaultProgramId?: ProgramId;
}

export function IntroOfferModal({ open, onClose, defaultProgramId }: IntroOfferModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(
    defaultProgramId ? PROGRAMS.find((p) => p.id === defaultProgramId) || null : null
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkoutMutation = trpc.popup.createIntroOfferCheckout.useMutation({
    onSuccess: (data) => {
      if (data.isFree) {
        // Kickboxing: free class, no payment needed
        setStep("redirecting");
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2500);
      } else if (data.checkoutUrl) {
        setStep("redirecting");
        window.open(data.checkoutUrl, "_blank");
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2500);
      }
    },
    onError: (err) => {
      setErrors({ submit: err.message || "Something went wrong. Please try again." });
    },
  });

  const resetForm = () => {
    setStep("select");
    setSelectedProgram(null);
    setName("");
    setEmail("");
    setPhone("");
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  const validateInfo = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = "Please enter your full name";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) newErrors.phone = "Please enter a valid phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!selectedProgram) return;
    if (!validateInfo()) return;
    checkoutMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      program: selectedProgram.name,
      origin: window.location.origin,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl w-full border-0 shadow-2xl">
        <DialogTitle className="sr-only">Claim Your Intro Offer</DialogTitle>

        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                Limited Time Offer
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-wide">
              {step === "select" ? "Choose Your Program" : step === "info" ? "Your Info" : "Redirecting..."}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white">
          {/* Step 1: Program Selection */}
          {step === "select" && (
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-5 text-center">
                Select the program you're interested in to claim your offer
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROGRAMS.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => {
                      setSelectedProgram(program);
                      setStep("info");
                    }}
                    className="group relative overflow-hidden rounded-xl text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-2 border-transparent hover:border-current"
                    style={{ "--hover-color": program.color } as React.CSSProperties}
                  >
                    <div
                      className={`bg-gradient-to-br ${program.bgGradient} p-4 text-white`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            {program.ageGroup}
                          </p>
                          <h3 className="text-lg font-black uppercase leading-tight mt-0.5">
                            {program.name}
                          </h3>
                        </div>
                        <span className="text-2xl">{program.icon}</span>
                      </div>
                      <p className="text-xs opacity-80 mb-3">{program.tagline}</p>
                      <div
                        className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        {program.firstClassFree ? "🎉 First Class FREE!" : `🎯 ${program.offer}`}
                      </div>
                    </div>
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <ChevronRight className="w-5 h-5 text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span>No commitment</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Zap className="w-3.5 h-3.5 text-green-600" />
                  <span>Instant confirmation</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === "info" && selectedProgram && (
            <div className="p-6">
              {/* Selected program summary */}
              <div
                className={`bg-gradient-to-r ${selectedProgram.bgGradient} rounded-xl p-4 text-white mb-5`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80 mb-1">
                      {selectedProgram.ageGroup}
                    </p>
                    <h3 className="text-xl font-black uppercase">{selectedProgram.name}</h3>
                    <p className="text-sm mt-1 font-semibold">
                      {selectedProgram.firstClassFree
                        ? "🎉 Your First Class is FREE!"
                        : `🎯 2 Classes for $29 — Uniform Included!`}
                    </p>
                  </div>
                  <span className="text-4xl">{selectedProgram.icon}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProgram.benefits.map((b) => (
                    <span
                      key={b}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="offer-name" className="text-sm font-semibold text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="offer-name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="offer-email" className="text-sm font-semibold text-gray-700">
                    Email Address *
                  </Label>
                  <Input
                    id="offer-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="offer-phone" className="text-sm font-semibold text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="offer-phone"
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`mt-1 ${errors.phone ? "border-red-500" : ""}`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {errors.submit && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{errors.submit}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <Button
                  variant="outline"
                  onClick={() => setStep("select")}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={checkoutMutation.isPending}
                  className="flex-1 font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: selectedProgram.color }}
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : selectedProgram.firstClassFree ? (
                    "Claim Free Class →"
                  ) : (
                    "Claim $29 Offer →"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                You'll be redirected to our secure checkout. No long-term commitment required.
              </p>
            </div>
          )}

          {/* Step 3: Redirecting */}
          {step === "redirecting" && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {checkoutMutation.data?.isFree ? "You're All Set!" : "Opening Secure Checkout..."}
              </h3>
              <p className="text-gray-500 text-sm">
                {checkoutMutation.data?.isFree
                  ? "Your free kickboxing class is confirmed! We'll be in touch to schedule your first session."
                  : "A new tab has opened with your checkout. Complete your $29 payment there to confirm your spot!"}
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mt-4" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
