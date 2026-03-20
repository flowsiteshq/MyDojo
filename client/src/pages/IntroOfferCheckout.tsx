/**
 * IntroOfferCheckout.tsx
 * First-time participant intro offer checkout using FluidPay tokenizer.
 * Packages: $29/3 classes (starter) | $49/5 classes (explorer)
 * URL: /intro-offer?package=starter|explorer
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCircle, ChevronLeft, Loader2, Shield, Zap, Star } from "lucide-react";
import { useSearch } from "wouter";

type Step = "info" | "payment" | "success";
type PackageId = "starter" | "explorer";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

const PACKAGES = {
  starter: {
    id: "starter" as PackageId,
    label: "Starter Pack",
    price: 29,
    amountCents: 2900,
    classes: 3,
    tagline: "Perfect for first-timers",
    features: ["3 Classes", "Any program", "Valid 30 days", "No commitment"],
    color: "#E10600",
    glow: "rgba(225,6,0,0.4)",
    emoji: "🥋",
  },
  explorer: {
    id: "explorer" as PackageId,
    label: "Explorer Pack",
    price: 49,
    amountCents: 4900,
    classes: 5,
    tagline: "Best value for new members",
    features: ["5 Classes", "Any program", "Valid 30 days", "No commitment"],
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.4)",
    emoji: "⭐",
  },
};

const FLUIDPAY_URL = "https://app.fluidpay.com";
const FLUIDPAY_PUBLIC_KEY = import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "";

declare class Tokenizer {
  constructor(config: {
    url: string;
    apikey: string;
    container: string;
    submission: (resp: {
      status: "success" | "validation" | "error";
      token?: string;
      invalid?: string[];
      msg?: string;
    }) => void;
    settings?: object;
  });
  submit(): void;
}

// ── Package Selector ──────────────────────────────────────────────────────────
function PackageSelector({
  selected,
  onSelect,
}: {
  selected: PackageId;
  onSelect: (id: PackageId) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {(["starter", "explorer"] as PackageId[]).map((id) => {
        const pkg = PACKAGES[id];
        const isSelected = selected === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="relative rounded-2xl p-5 text-left transition-all duration-200 active:scale-98"
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${pkg.color}25 0%, rgba(0,0,0,0.6) 100%)`
                : "rgba(255,255,255,0.05)",
              border: `2px solid ${isSelected ? pkg.color : "rgba(255,255,255,0.15)"}`,
              boxShadow: isSelected ? `0 0 20px ${pkg.glow}` : "none",
            }}
          >
            {id === "explorer" && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-white"
                style={{ background: pkg.color }}
              >
                Best Value
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pkg.emoji}</span>
              <div>
                <p className="text-white font-black text-lg">{pkg.label}</p>
                <p className="text-white/50 text-xs">{pkg.tagline}</p>
              </div>
            </div>
            <div className="flex items-end gap-1 mb-3">
              <span
                className="text-4xl font-black"
                style={{ color: isSelected ? pkg.color : "white" }}
              >
                ${pkg.price}
              </span>
              <span className="text-white/40 text-sm mb-1">/ {pkg.classes} classes</span>
            </div>
            <ul className="space-y-1">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-white/70 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: pkg.color }} />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

// ── Info Step ─────────────────────────────────────────────────────────────────
function InfoStep({
  info,
  packageId,
  onChange,
  onPackageChange,
  onNext,
}: {
  info: CustomerInfo;
  packageId: PackageId;
  onChange: (f: Partial<CustomerInfo>) => void;
  onPackageChange: (id: PackageId) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (!info.name.trim()) return setError("Please enter your name.");
    if (!info.email.trim() || !info.email.includes("@"))
      return setError("Please enter a valid email address.");
    onNext();
  };

  return (
    <div className="space-y-5">
      <PackageSelector selected={packageId} onSelect={onPackageChange} />

      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2">Full Name *</label>
        <input
          type="text"
          value={info.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Your name"
          className="w-full rounded-2xl px-5 py-4 text-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] transition-colors"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2">Email Address *</label>
        <input
          type="email"
          value={info.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="you@example.com"
          className="w-full rounded-2xl px-5 py-4 text-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2">Phone (optional)</label>
        <input
          type="tel"
          value={info.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="(555) 555-5555"
          className="w-full rounded-2xl px-5 py-4 text-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
          {error}
        </p>
      )}

      <button
        onClick={handleNext}
        className="w-full py-5 rounded-2xl text-white text-xl font-black uppercase tracking-wider transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg, #E10600, #ff4400)",
          boxShadow: "0 0 30px rgba(225,6,0,0.5)",
        }}
      >
        Continue to Payment →
      </button>

      <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
        <Shield className="w-3.5 h-3.5" />
        <span>Secure checkout · No subscription · Cancel anytime</span>
      </div>
    </div>
  );
}

// ── Payment Step ──────────────────────────────────────────────────────────────
function PaymentStep({
  info,
  packageId,
  onSuccess,
  onBack,
}: {
  info: CustomerInfo;
  packageId: PackageId;
  onSuccess: (result: { classesIncluded: number; transactionId: string }) => void;
  onBack: () => void;
}) {
  const pkg = PACKAGES[packageId];
  const tokenizerRef = useRef<Tokenizer | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const purchaseMutation = trpc.kiosk.purchaseIntroOffer.useMutation();

  useEffect(() => {
    const existing = document.getElementById("fluidpay-tokenizer-script");
    if (existing) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "fluidpay-tokenizer-script";
    script.src = `${FLUIDPAY_URL}/tokenizer/tokenizer.js`;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () =>
      setCardError("Failed to load payment form. Please check your connection.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded) return;
    const timer = setTimeout(() => {
      try {
        tokenizerRef.current = new Tokenizer({
          url: FLUIDPAY_URL,
          apikey: FLUIDPAY_PUBLIC_KEY,
          container: "#fp-intro-card-container",
          submission: handleTokenResponse,
          settings: {
            payment: {
              types: ["card"],
              card: { requireCVV: true, mask_number: true },
            },
            styles: {
              body: { color: "#ffffff", "background-color": "transparent" },
              ".input-field": {
                color: "#ffffff",
                "background-color": "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.25)",
                "border-radius": "12px",
                padding: "14px 16px",
                "font-size": "18px",
              },
              "::placeholder": { color: "rgba(255,255,255,0.35)" },
            },
          },
        });
      } catch {
        setCardError("Failed to initialize payment form. Please try again.");
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [scriptLoaded]); // eslint-disable-line

  const handleTokenResponse = useCallback(
    async (resp: { status: string; token?: string; msg?: string }) => {
      if (resp.status !== "success" || !resp.token) {
        setCardError(
          resp.status === "validation"
            ? "Please check your card details and try again."
            : resp.msg || "Card tokenization failed. Please try again."
        );
        setProcessing(false);
        return;
      }
      try {
        const result = await purchaseMutation.mutateAsync({
          token: resp.token,
          name: info.name,
          email: info.email,
          phone: info.phone || undefined,
          packageId,
        });
        onSuccess({
          classesIncluded: result.classesIncluded,
          transactionId: result.transactionId,
        });
      } catch (err: any) {
        setCardError(err.message || "Payment failed. Please try again.");
        setProcessing(false);
      }
    },
    [info, packageId, purchaseMutation, onSuccess]
  );

  const handlePay = () => {
    if (!tokenizerRef.current) {
      setCardError("Payment form not ready. Please wait a moment.");
      return;
    }
    setProcessing(true);
    setCardError(null);
    tokenizerRef.current.submit();
  };

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Change package
      </button>

      {/* Order summary */}
      <div
        className="rounded-2xl p-5 border"
        style={{
          background: `linear-gradient(135deg, ${pkg.color}15 0%, rgba(0,0,0,0.5) 100%)`,
          borderColor: `${pkg.color}40`,
          boxShadow: `0 0 20px ${pkg.glow}`,
        }}
      >
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Order Summary</p>
        <div className="flex justify-between items-center mb-1">
          <div>
            <p className="text-white font-black text-lg">
              {pkg.emoji} {pkg.label}
            </p>
            <p className="text-white/50 text-sm">
              {pkg.classes} classes · {info.name}
            </p>
          </div>
          <span className="font-black text-3xl" style={{ color: pkg.color }}>
            ${pkg.price}
          </span>
        </div>
        <p className="text-white/30 text-xs mt-2">Valid for 30 days from purchase</p>
      </div>

      {/* Card form */}
      <div>
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3">Card Details</p>
        <div className="bg-white/10 border border-white/30 rounded-2xl p-5 min-h-[120px]">
          {!scriptLoaded && (
            <div className="flex items-center justify-center gap-2 py-4 text-white/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading payment form…</span>
            </div>
          )}
          <div id="fp-intro-card-container" />
        </div>
        {cardError && (
          <p className="mt-3 text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
            {cardError}
          </p>
        )}
      </div>

      <button
        onClick={handlePay}
        disabled={processing || !scriptLoaded}
        className="w-full py-5 rounded-2xl text-white text-xl font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
        style={{
          background: processing
            ? "rgba(255,255,255,0.1)"
            : `linear-gradient(135deg, ${pkg.color}, #ff4400)`,
          boxShadow: processing ? "none" : `0 0 30px ${pkg.glow}`,
        }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Processing…
          </span>
        ) : (
          `Pay $${pkg.price} Now`
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
        <Shield className="w-3.5 h-3.5" />
        <span>256-bit SSL · Powered by FluidPay · No recurring charges</span>
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({
  name,
  packageId,
  classesIncluded,
}: {
  name: string;
  packageId: PackageId;
  classesIncluded: number;
}) {
  const pkg = PACKAGES[packageId];
  return (
    <div className="text-center space-y-6">
      <div className="text-8xl animate-bounce">🎉</div>
      <div>
        <h2 className="text-4xl font-black text-white mb-2">You're In!</h2>
        <p className="text-white/60 text-lg">
          Welcome to MyDojo, {name.split(" ")[0]}!
        </p>
      </div>
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: `linear-gradient(135deg, ${pkg.color}20 0%, rgba(0,0,0,0.6) 100%)`,
          borderColor: `${pkg.color}40`,
          boxShadow: `0 0 30px ${pkg.glow}`,
        }}
      >
        <p className="text-white/50 text-sm uppercase tracking-widest mb-2">Your Package</p>
        <p className="text-white font-black text-2xl mb-1">
          {pkg.emoji} {pkg.label}
        </p>
        <p className="font-black text-5xl mb-2" style={{ color: pkg.color }}>
          {classesIncluded} Classes
        </p>
        <p className="text-white/50 text-sm">Valid for 30 days · Any program</p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 text-left">
          <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-white/80 text-sm">
            Check in at the front desk or kiosk to redeem each class.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 text-left">
          <Star className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-white/80 text-sm">
            A confirmation email has been sent to your inbox.
          </p>
        </div>
      </div>
      <a
        href="/"
        className="block w-full py-4 rounded-2xl text-white font-black uppercase tracking-wider transition-all active:scale-95"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        Back to Home
      </a>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IntroOfferCheckout() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialPkg = (params.get("package") as PackageId) || "starter";

  const [step, setStep] = useState<Step>("info");
  const [packageId, setPackageId] = useState<PackageId>(
    initialPkg === "explorer" ? "explorer" : "starter"
  );
  const [info, setInfo] = useState<CustomerInfo>({ name: "", email: "", phone: "" });
  const [successData, setSuccessData] = useState<{
    classesIncluded: number;
    transactionId: string;
  } | null>(null);

  const pkg = PACKAGES[packageId];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse at top, #1a0000 0%, #000 60%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/logo-full-white.png"
            alt="MyDojo"
            className="h-10 mx-auto mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {step !== "success" && (
            <>
              <h1 className="text-white font-black text-3xl uppercase tracking-wider mb-1">
                Special Intro Offer
              </h1>
              <p className="text-white/50 text-sm">First-time participants only</p>
            </>
          )}
        </div>

        {/* Steps */}
        {step === "info" && (
          <InfoStep
            info={info}
            packageId={packageId}
            onChange={(f) => setInfo((prev) => ({ ...prev, ...f }))}
            onPackageChange={setPackageId}
            onNext={() => setStep("payment")}
          />
        )}

        {step === "payment" && (
          <PaymentStep
            info={info}
            packageId={packageId}
            onSuccess={(result) => {
              setSuccessData(result);
              setStep("success");
            }}
            onBack={() => setStep("info")}
          />
        )}

        {step === "success" && successData && (
          <SuccessScreen
            name={info.name}
            packageId={packageId}
            classesIncluded={successData.classesIncluded}
          />
        )}
      </div>
    </div>
  );
}
