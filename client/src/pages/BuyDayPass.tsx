/**
 * BuyDayPass.tsx
 * Mobile-optimized day pass checkout page.
 * Reached by scanning the QR code on the kiosk.
 * Steps: info → payment (Fluid Pay Tokenizer) → success
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCircle, ChevronLeft, Loader2 } from "lucide-react";

type Step = "info" | "payment" | "success";

interface PassInfo {
  name: string;
  email: string;
  phone: string;
  program: string;
}

const PROGRAMS = [
  "Little Ninjas",
  "Dragon Kids",
  "Teens",
  "Adult Karate",
  "Kickboxing",
  "After School",
  "Open Training",
];

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

// ─── Info step ────────────────────────────────────────────────────────────────
function InfoStep({
  info,
  onChange,
  onNext,
  price,
}: {
  info: PassInfo;
  onChange: (f: Partial<PassInfo>) => void;
  onNext: () => void;
  price: number;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (!info.name.trim()) return setError("Please enter your name.");
    if (!info.email.trim() || !info.email.includes("@"))
      return setError("Please enter a valid email address.");
    if (!info.program) return setError("Please select a program.");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2">Full Name *</label>
        <input
          type="text"
          value={info.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Your name"
          className="w-full rounded-2xl px-5 py-4 text-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-[#E10600] transition-colors"
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

      <div>
        <label className="block text-sm font-semibold text-white/70 mb-2">Program *</label>
        <select
          value={info.program}
          onChange={(e) => onChange({ program: e.target.value })}
          className="w-full rounded-2xl px-5 py-4 text-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#E10600] transition-colors appearance-none"
          style={{ colorScheme: "dark" }}
        >
          <option value="" className="bg-zinc-900">Select a program…</option>
          {PROGRAMS.map((p) => (
            <option key={p} value={p} className="bg-zinc-900">{p}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
          {error}
        </p>
      )}

      <button
        onClick={handleNext}
        className="w-full py-5 rounded-2xl text-white text-xl font-black uppercase tracking-wider transition-all active:scale-95 mt-2"
        style={{
          background: "linear-gradient(135deg, #E10600 0%, #C10500 100%)",
          boxShadow: "0 0 40px rgba(225,6,0,0.6)",
        }}
      >
        Continue to Payment — ${(price / 100).toFixed(2)}
      </button>
    </div>
  );
}

// ─── Payment step ─────────────────────────────────────────────────────────────
function PaymentStep({
  info,
  amountCents,
  onSuccess,
  onBack,
}: {
  info: PassInfo;
  amountCents: number;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const tokenizerRef = useRef<Tokenizer | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const confirmMutation = trpc.kiosk.confirmDayPassCheckIn.useMutation();

  useEffect(() => {
    const existing = document.getElementById("fluidpay-tokenizer-script");
    if (existing) { setScriptLoaded(true); return; }
    const script = document.createElement("script");
    script.id = "fluidpay-tokenizer-script";
    script.src = `${FLUIDPAY_URL}/tokenizer/tokenizer.js`;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setCardError("Failed to load payment form. Please check your connection.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptLoaded) return;
    const timer = setTimeout(() => {
      try {
        tokenizerRef.current = new Tokenizer({
          url: FLUIDPAY_URL,
          apikey: FLUIDPAY_PUBLIC_KEY,
          container: "#fp-card-container-mobile",
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
        setCardError(resp.status === "validation"
          ? "Please check your card details and try again."
          : resp.msg || "Card tokenization failed. Please try again.");
        setProcessing(false);
        return;
      }
      try {
        await confirmMutation.mutateAsync({
          token: resp.token,
          name: info.name,
          email: info.email,
          phone: info.phone || undefined,
          program: info.program,
          programType: info.program,
        });
        onSuccess();
      } catch (err: any) {
        setCardError(err.message || "Payment failed. Please try again.");
        setProcessing(false);
      }
    },
    [info, confirmMutation, onSuccess]
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
      {/* Order summary */}
      <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Order Summary</p>
        <div className="flex justify-between items-center mb-1">
          <span className="text-white font-semibold">Day Pass — {info.program}</span>
          <span className="text-white font-black text-2xl">${(amountCents / 100).toFixed(2)}</span>
        </div>
        <p className="text-white/40 text-sm">{info.name} · {info.email}</p>
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
          <div id="fp-card-container-mobile" />
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
            ? "rgba(225,6,0,0.4)"
            : "linear-gradient(135deg, #E10600 0%, #C10500 100%)",
          boxShadow: processing ? "none" : "0 0 40px rgba(225,6,0,0.6)",
        }}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </span>
        ) : (
          `💳 Pay $${(amountCents / 100).toFixed(2)}`
        )}
      </button>

      <button
        onClick={onBack}
        disabled={processing}
        className="w-full flex items-center justify-center gap-1 py-3 text-white/50 hover:text-white text-base font-semibold transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BuyDayPass() {
  const [step, setStep] = useState<Step>("info");
  const [info, setInfo] = useState<PassInfo>({ name: "", email: "", phone: "", program: "" });
  const [amountCents, setAmountCents] = useState(2000);

  const { data: config } = trpc.kiosk.getDayPassConfig.useQuery();
  useEffect(() => {
    if (config?.amountCents) setAmountCents(config.amountCents);
  }, [config]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "radial-gradient(ellipse at center bottom, rgba(180,10,10,0.6) 0%, rgba(20,0,0,0.98) 60%, #0a0000 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ESkmczpClhJKxFDQ.png"
            alt="MyDojo"
            className="w-9 h-9 rounded-lg object-contain"
          />
          <div>
            <p className="text-white font-black text-base leading-tight">MyDojo</p>
            <p className="text-white/40 text-xs">Day Pass Checkout</p>
          </div>
        </div>
        {step !== "success" && (
          <div className="text-right">
            <p className="text-white/40 text-xs uppercase tracking-widest">
              Step {step === "info" ? "1" : "2"} of 2
            </p>
            <p className="text-white/60 text-sm font-semibold">
              {step === "info" ? "Your Info" : "Payment"}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {step !== "success" && (
        <div className="px-5 mb-6">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E10600] rounded-full transition-all duration-500"
              style={{ width: step === "info" ? "50%" : "100%" }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-5 pb-8">
        {step === "success" ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: "radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)" }}
            >
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">You're In! 🥋</h2>
              <p className="text-white/60 text-lg">Your day pass is confirmed.</p>
              <p className="text-white/40 text-sm mt-2">
                A receipt has been sent to {info.email}
              </p>
            </div>
            <div
              className="w-full rounded-2xl p-5 border border-green-500/30"
              style={{ background: "rgba(34,197,94,0.08)" }}
            >
              <p className="text-green-400 font-bold text-lg">{info.program}</p>
              <p className="text-white/60 text-sm mt-1">
                Welcome, {info.name}! Please check in at the kiosk when you arrive.
              </p>
            </div>
          </div>
        ) : step === "info" ? (
          <InfoStep
            info={info}
            onChange={(f) => setInfo((prev) => ({ ...prev, ...f }))}
            onNext={() => setStep("payment")}
            price={amountCents}
          />
        ) : (
          <PaymentStep
            info={info}
            amountCents={amountCents}
            onSuccess={() => setStep("success")}
            onBack={() => setStep("info")}
          />
        )}
      </div>
    </div>
  );
}
