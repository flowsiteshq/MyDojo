import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SignatureCanvas from "react-signature-canvas";
import {
  Star, Shield, Zap, Trophy, ChevronRight, ChevronLeft,
  CheckCircle, Flame, Users, Clock, Award, Phone, Mail, User
} from "lucide-react";

type OfferType = "trial_2weeks_1dollar" | "foundation_149" | "blackbelt_199";
type Program = "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "Not Sure";
type Step = "offers" | "contact" | "program" | "waiver" | "success";

interface KioskOfferFlowProps {
  onClose: () => void;
  prefillPhone?: string;
  prefillName?: string;
}

const OFFERS = [
  {
    id: "trial_2weeks_1dollar" as OfferType,
    badge: "BEST FIRST STEP",
    price: "$1",
    period: "for 2 weeks",
    headline: "2-Week Trial",
    subheadline: "Try us risk-free",
    color: "#E10600",
    glow: "rgba(225,6,0,0.7)",
    icon: <Flame className="w-10 h-10" />,
    benefits: [
      "Unlimited classes for 2 full weeks",
      "Free uniform included",
      "Personal assessment with instructor",
      "No commitment — cancel anytime",
    ],
  },
  {
    id: "foundation_149" as OfferType,
    badge: "MOST POPULAR",
    price: "$149",
    period: "/ month",
    headline: "Foundation Program",
    subheadline: "Build your foundation",
    color: "#FF6B00",
    glow: "rgba(255,107,0,0.7)",
    icon: <Shield className="w-10 h-10" />,
    benefits: [
      "Unlimited classes — all skill levels",
      "Karate, Kickboxing & Self-Defense",
      "Belt promotion testing included",
      "Access to all locations",
      "Family discount available",
    ],
  },
  {
    id: "blackbelt_199" as OfferType,
    badge: "ELITE TRACK",
    price: "$199",
    period: "/ month",
    headline: "Black Belt Program",
    subheadline: "Train like a champion",
    color: "#FFD700",
    glow: "rgba(255,215,0,0.7)",
    icon: <Trophy className="w-10 h-10" />,
    benefits: [
      "Everything in Foundation, plus:",
      "Private lessons (2x/month)",
      "Competition team access",
      "Black Belt Club membership",
      "Priority belt testing",
      "Leadership & character development",
    ],
  },
];

const PROGRAMS: { id: Program; label: string; ageRange: string; emoji: string }[] = [
  { id: "Little Ninjas", label: "Little Ninjas", ageRange: "Ages 3–5", emoji: "🥋" },
  { id: "Dragon Kids", label: "Dragon Kids", ageRange: "Ages 6–12", emoji: "🐉" },
  { id: "Teens", label: "Teens", ageRange: "Ages 13–17", emoji: "⚡" },
  { id: "Adult Karate", label: "Adult Karate", ageRange: "Ages 18+", emoji: "🏆" },
  { id: "Kickboxing", label: "Kickboxing", ageRange: "All Ages", emoji: "🥊" },
  { id: "Not Sure", label: "Help Me Choose", ageRange: "We'll guide you", emoji: "🤔" },
];

const WAIVER_TEXT = `RELEASE OF LIABILITY AND ASSUMPTION OF RISK

I, the undersigned, acknowledge that participation in martial arts, kickboxing, karate, and related physical activities at MyDojo Martial Arts & Fitness ("MyDojo") involves inherent risks of physical injury, including but not limited to sprains, fractures, and other injuries.

I voluntarily assume all risks associated with participation in MyDojo programs and activities. I agree to release, waive, discharge, and hold harmless MyDojo, its owners, instructors, employees, and agents from any and all claims, damages, or liability arising from my participation.

I consent to receive medical treatment in the event of injury or illness during MyDojo activities.

PHOTO & VIDEO CONSENT: I grant MyDojo permission to photograph and/or video record me during classes and events, and to use such media for promotional and educational purposes.

By signing below, I confirm that I have read and understood this agreement and agree to be bound by its terms.`;

export default function KioskOfferFlow({ onClose, prefillPhone = "", prefillName = "" }: KioskOfferFlowProps) {
  const [step, setStep] = useState<Step>("offers");
  const [selectedOffer, setSelectedOffer] = useState<OfferType | null>(null);
  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [email, setEmail] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [waiverChecked, setWaiverChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sigRef = useRef<SignatureCanvas>(null);
  const [hasSigned, setHasSigned] = useState(false);

  const captureLeadMutation = trpc.kiosk.captureWalkInLead.useMutation();

  const selectedOfferData = OFFERS.find((o) => o.id === selectedOffer);

  const handleSignEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setHasSigned(true);
    }
  }, []);

  const clearSignature = () => {
    sigRef.current?.clear();
    setHasSigned(false);
  };

  const handleSubmit = async () => {
    if (!selectedOffer || !selectedProgram || !waiverChecked || !hasSigned) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const signatureDataUrl = sigRef.current?.toDataURL("image/png");
      await captureLeadMutation.mutateAsync({
        name,
        phone,
        email,
        program: selectedProgram,
        offerType: selectedOffer,
        waiverAccepted: waiverChecked,
        signatureDataUrl,
      });
      setStep("success");
    } catch (e: any) {
      setSubmitError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  const bgStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: "radial-gradient(ellipse at 50% 0%, rgba(225,6,0,0.35) 0%, #0a0a0a 60%)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 16px",
  };

  // ── STEP: OFFERS ──────────────────────────────────────────────────────────
  if (step === "offers") {
    return (
      <div style={bgStyle} onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[#E10600] font-bold uppercase tracking-widest text-sm mb-2">
              Welcome to MyDojo
            </p>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_40px_rgba(225,6,0,0.8)]">
              START YOUR JOURNEY
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto">
              Choose the program that's right for you. Every path leads to the same destination — your best self.
            </p>
          </div>

          {/* Offer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {OFFERS.map((offer) => (
              <button
                key={offer.id}
                onClick={() => {
                  setSelectedOffer(offer.id);
                  setStep("contact");
                }}
                className="relative text-left rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105 group"
                style={{
                  borderColor: offer.color,
                  background: `linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)`,
                  boxShadow: `0 0 40px ${offer.glow}`,
                }}
              >
                {/* Badge */}
                <div
                  className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{ background: offer.color, color: "#fff" }}
                >
                  {offer.badge}
                </div>

                {/* Icon */}
                <div className="mb-4" style={{ color: offer.color }}>
                  {offer.icon}
                </div>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-5xl font-black text-white">{offer.price}</span>
                  <span className="text-white/60 text-lg ml-2">{offer.period}</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-1">{offer.headline}</h3>
                <p className="text-white/60 text-sm mb-6">{offer.subheadline}</p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  {offer.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: offer.color }} />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div
                  className="w-full py-3 rounded-xl font-black text-white text-center uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                  style={{ background: offer.color }}
                >
                  Get Started <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/70 text-sm transition-colors underline"
            >
              I'm already a member — go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: CONTACT ─────────────────────────────────────────────────────────
  if (step === "contact") {
    const canContinue = name.trim().length >= 2 && phone.trim().length >= 7 && email.includes("@");
    return (
      <div style={bgStyle} onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-lg">
          <StepHeader
            step={1}
            total={3}
            title="Tell Us About Yourself"
            subtitle={`You selected: ${selectedOfferData?.headline}`}
            accentColor={selectedOfferData?.color || "#E10600"}
          />

          <div className="space-y-4 mb-8">
            <FormField icon={<User className="w-5 h-5" />} label="Full Name">
              <Input
                type="text"
                placeholder="First and Last Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xl p-5"
                autoFocus
              />
            </FormField>

            <FormField icon={<Phone className="w-5 h-5" />} label="Phone Number">
              <Input
                type="tel"
                placeholder="(555) 555-5555"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xl p-5"
              />
            </FormField>

            <FormField icon={<Mail className="w-5 h-5" />} label="Email Address">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xl p-5"
              />
            </FormField>
          </div>

          <p className="text-white/40 text-sm text-center mb-6">
            We'll send your enrollment link to your phone and email.
          </p>

          <NavButtons
            onBack={() => setStep("offers")}
            onNext={() => setStep("program")}
            nextDisabled={!canContinue}
            nextLabel="Choose Program"
            accentColor={selectedOfferData?.color || "#E10600"}
          />
        </div>
      </div>
    );
  }

  // ── STEP: PROGRAM ─────────────────────────────────────────────────────────
  if (step === "program") {
    return (
      <div style={bgStyle} onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-2xl">
          <StepHeader
            step={2}
            total={3}
            title="Which Program Interests You?"
            subtitle="You can always change this later"
            accentColor={selectedOfferData?.color || "#E10600"}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {PROGRAMS.map((prog) => (
              <button
                key={prog.id}
                onClick={() => setSelectedProgram(prog.id)}
                className="p-6 rounded-2xl border-2 text-center transition-all hover:scale-105"
                style={{
                  borderColor: selectedProgram === prog.id ? (selectedOfferData?.color || "#E10600") : "rgba(255,255,255,0.15)",
                  background: selectedProgram === prog.id
                    ? `rgba(${selectedOfferData?.color === "#FFD700" ? "255,215,0" : selectedOfferData?.color === "#FF6B00" ? "255,107,0" : "225,6,0"},0.2)`
                    : "rgba(0,0,0,0.4)",
                  boxShadow: selectedProgram === prog.id ? `0 0 30px ${selectedOfferData?.glow || "rgba(225,6,0,0.5)"}` : "none",
                }}
              >
                <div className="text-4xl mb-2">{prog.emoji}</div>
                <p className="text-white font-black text-lg">{prog.label}</p>
                <p className="text-white/50 text-sm">{prog.ageRange}</p>
              </button>
            ))}
          </div>

          <NavButtons
            onBack={() => setStep("contact")}
            onNext={() => setStep("waiver")}
            nextDisabled={!selectedProgram}
            nextLabel="Review Waiver"
            accentColor={selectedOfferData?.color || "#E10600"}
          />
        </div>
      </div>
    );
  }

  // ── STEP: WAIVER ──────────────────────────────────────────────────────────
  if (step === "waiver") {
    const canSubmit = waiverChecked && hasSigned;
    return (
      <div style={bgStyle} onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-2xl">
          <StepHeader
            step={3}
            total={3}
            title="Liability Waiver"
            subtitle="Please read and sign below"
            accentColor={selectedOfferData?.color || "#E10600"}
          />

          {/* Waiver text */}
          <div className="bg-black/60 border border-white/20 rounded-xl p-6 mb-6 max-h-64 overflow-y-auto">
            <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {WAIVER_TEXT}
            </pre>
          </div>

          {/* Signature pad */}
          <div className="mb-4">
            <p className="text-white/60 text-sm mb-2">Sign below with your finger:</p>
            <div className="rounded-xl overflow-hidden border-2 border-white/30 bg-white">
              <SignatureCanvas
                ref={sigRef}
                penColor="#000"
                canvasProps={{ width: 600, height: 160, className: "w-full" }}
                onEnd={handleSignEnd}
              />
            </div>
            <button
              onClick={clearSignature}
              className="text-white/40 hover:text-white/70 text-xs mt-2 underline"
            >
              Clear signature
            </button>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <input
              type="checkbox"
              checked={waiverChecked}
              onChange={(e) => setWaiverChecked(e.target.checked)}
              className="w-6 h-6 mt-0.5 flex-shrink-0 accent-red-600"
            />
            <span className="text-white/80 text-sm leading-relaxed">
              I have read and agree to the Release of Liability and Assumption of Risk. I confirm that the information I provided is accurate and that I am 18 years of age or older (or a parent/guardian signing on behalf of a minor).
            </span>
          </label>

          {submitError && (
            <p className="text-red-400 text-center text-sm mb-4">{submitError}</p>
          )}

          <NavButtons
            onBack={() => setStep("program")}
            onNext={handleSubmit}
            nextDisabled={!canSubmit || isSubmitting}
            nextLabel={isSubmitting ? "Submitting..." : "Submit & Get My Link"}
            accentColor={selectedOfferData?.color || "#E10600"}
          />
        </div>
      </div>
    );
  }

  // ── STEP: SUCCESS ─────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div style={bgStyle} onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-lg text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: selectedOfferData?.color || "#E10600", boxShadow: `0 0 60px ${selectedOfferData?.glow || "rgba(225,6,0,0.8)"}` }}
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-5xl font-black text-white mb-4 drop-shadow-[0_0_40px_rgba(225,6,0,0.8)]">
            YOU'RE IN!
          </h1>
          <p className="text-white/70 text-xl mb-4">
            Welcome to the MyDojo family, <span className="text-white font-bold">{name.split(" ")[0]}</span>!
          </p>
          <p className="text-white/60 text-lg mb-8">
            We've sent your enrollment link to <span className="text-white">{phone}</span> and <span className="text-white">{email}</span>. Check your messages to complete your enrollment!
          </p>

          <div
            className="rounded-2xl p-6 mb-8 border-2"
            style={{ borderColor: selectedOfferData?.color || "#E10600", background: "rgba(0,0,0,0.6)" }}
          >
            <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Your Selected Offer</p>
            <p className="text-white font-black text-2xl">{selectedOfferData?.headline}</p>
            <p className="text-white/60">{selectedProgram} Program</p>
          </div>

          <Button
            onClick={onClose}
            className="w-full py-6 text-xl font-black uppercase tracking-wider"
            style={{ background: selectedOfferData?.color || "#E10600" }}
          >
            Done — Return to Kiosk
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Helper Components ──────────────────────────────────────────────────────

function StepHeader({ step, total, title, subtitle, accentColor }: {
  step: number; total: number; title: string; subtitle: string; accentColor: string;
}) {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all"
            style={{
              width: i + 1 === step ? 32 : 12,
              background: i + 1 <= step ? accentColor : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
      <h2 className="text-4xl font-black text-white mb-2">{title}</h2>
      <p className="text-white/60 text-lg">{subtitle}</p>
    </div>
  );
}

function FormField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel, accentColor }: {
  onBack: () => void; onNext: () => void; nextDisabled: boolean; nextLabel: string; accentColor: string;
}) {
  return (
    <div className="flex gap-4">
      <Button
        onClick={onBack}
        variant="outline"
        className="flex-1 py-6 text-lg border-white/30 text-white hover:bg-white/10"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Back
      </Button>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-[2] py-6 text-lg font-black uppercase tracking-wider disabled:opacity-40"
        style={{ background: nextDisabled ? undefined : accentColor }}
      >
        {nextLabel} <ChevronRight className="w-5 h-5 ml-1" />
      </Button>
    </div>
  );
}
