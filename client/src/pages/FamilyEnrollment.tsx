import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, CheckCircle, CreditCard, Tag, Star, ArrowRight, Shield, Loader2 } from "lucide-react";
import { Link } from "wouter";


type Step = "info" | "payment" | "success";

export default function FamilyEnrollment() {
  const [step, setStep] = useState<Step>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [tokenizerError, setTokenizerError] = useState(false);
  const tokenizerRef = useRef<any>(null);
  const tokenizerInitializedRef = useRef(false);

  // Form state — prefill from URL query params if provided (?name=Brenda+Galvez&phone=8326655442)
  const [contactName, setContactName] = useState(() => {
    const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return p.get("name") || "";
  });
  const [contactEmail, setContactEmail] = useState(() => {
    const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return p.get("email") || "";
  });
  const [contactPhone, setContactPhone] = useState(() => {
    const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return p.get("phone") || "";
  });

  // Result state
  const [familyGroupId, setFamilyGroupId] = useState<number | null>(null);

  const createFamilyGroup = trpc.family.createFamilyGroup.useMutation();

  // Pre-load the FluidPay Tokenizer script
  useEffect(() => {
    if (window.Tokenizer) { setTokenizerReady(true); return; }
    const existing = document.getElementById("fluidpay-tokenizer-v2");
    if (existing) {
      // Script already in DOM — wait for it
      const poll = setInterval(() => {
        if (window.Tokenizer) { setTokenizerReady(true); clearInterval(poll); }
      }, 100);
      setTimeout(() => { clearInterval(poll); if (!window.Tokenizer) setTokenizerError(true); }, 10000);
      return;
    }
    const script = document.createElement("script");
    script.id = "fluidpay-tokenizer-v2";
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerReady(true);
    script.onerror = () => setTokenizerError(true);
    document.head.appendChild(script);
  }, []);

  // Initialize tokenizer when payment step is shown
  useEffect(() => {
    if (step !== "payment") return;
    if (!tokenizerReady || tokenizerInitializedRef.current) return;
    if (!window.Tokenizer) return;
    tokenizerInitializedRef.current = true;
    const FLUIDPAY_PUBLIC_KEY = import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "";
    try {
      const instance = new window.Tokenizer({
        apikey: FLUIDPAY_PUBLIC_KEY,
        container: "#card-number",
        onLoad: () => {},
        settings: {
          payment: { types: ["card"] },
          styles: {
            body: { "font-family": "inherit", "background-color": "transparent" },
            inputs: {
              "border-radius": "8px",
              "border": "2px solid #444",
              "padding": "14px 16px",
              "font-size": "18px",
              "height": "56px",
              "color": "#ffffff",
              "background-color": "#1a1a1a",
            },
            labels: {
              "font-size": "15px",
              "font-weight": "600",
              "color": "#aaaaaa",
              "margin-bottom": "6px",
            },
          },
        },
        submission: (resp: any) => {
          if (!resp.token || resp.status === "error") {
            toast.error("Card error", { description: resp.error || "Invalid card details." });
            setIsLoading(false);
            return;
          }
          // Token received — submit to server
          createFamilyGroup.mutate(
            {
              primaryContactName: contactName,
              primaryContactEmail: contactEmail,
              primaryContactPhone: contactPhone || undefined,
              cardToken: resp.token,
            },
            {
              onSuccess: (result) => {
                setFamilyGroupId(result.familyGroupId);
                setStep("success");
                toast.success("Family account created! 🎉", {
                  description: "Your $99 family registration fee has been processed.",
                });
                setIsLoading(false);
              },
              onError: (err: any) => {
                toast.error("Payment failed", {
                  description: err.message || "Please check your card details.",
                });
                setIsLoading(false);
              },
            }
          );
        },
      });
      tokenizerRef.current = instance;
    } catch (err) {
      console.error("Failed to initialize FluidPay Tokenizer", err);
      setTokenizerError(true);
    }
  }, [step, tokenizerReady]);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep("payment");
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenizerRef.current) {
      toast.error("Payment form not ready. Please wait.");
      return;
    }
    setIsLoading(true);
    tokenizerRef.current.submit("99.00");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <Link href="/">
          <img src="/images/logo.webp" alt="MyDojo" className="h-10 object-contain" loading="lazy" />
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/40 rounded-full px-4 py-2 mb-6">
            <Users className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm font-bold uppercase tracking-wider">Family Savings Program</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            TRAIN TOGETHER,<br />
            <span className="text-red-500">SAVE TOGETHER</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Enroll your whole family and unlock exclusive savings — one registration fee covers everyone.
          </p>
        </div>

        {/* Discount Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="relative bg-gradient-to-br from-red-900/40 to-black border border-red-500/30 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              BEST VALUE
            </div>
            <Tag className="w-10 h-10 text-red-400 mb-4" />
            <h3 className="text-2xl font-black mb-2">50% OFF</h3>
            <p className="text-white/70 text-lg mb-3">2nd Family Member's Monthly Tuition</p>
            <p className="text-white/50 text-sm">
              When a second family member enrolls, they receive 50% off their monthly membership fee — every month, for the life of their membership.
            </p>
            <div className="mt-4 p-3 bg-white/5 rounded-xl">
              <p className="text-sm text-white/60">
                Example: If monthly tuition is <span className="text-white font-bold">$149/mo</span>, 2nd member pays only{" "}
                <span className="text-red-400 font-black">$74.50/mo</span>
              </p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-yellow-900/30 to-black border border-yellow-500/30 rounded-2xl p-8 overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              ONE-TIME
            </div>
            <Star className="w-10 h-10 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-black mb-2">$99 FAMILY REG FEE</h3>
            <p className="text-white/70 text-lg mb-3">One Registration Fee for the Whole Family</p>
            <p className="text-white/50 text-sm">
              Instead of paying a separate $99 registration fee per person, your entire family is covered under one $99 family registration — no matter how many members enroll.
            </p>
            <div className="mt-4 p-3 bg-white/5 rounded-xl">
              <p className="text-sm text-white/60">
                Family of 3 saves <span className="text-yellow-400 font-black">$198</span> on registration fees alone
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-black mb-6 text-center">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Create Family Account", desc: "Pay the one-time $99 family registration fee to open your family account.", icon: "👨‍👩‍👧‍👦" },
              { step: "2", title: "Enroll First Member", desc: "Your first family member enrolls at the standard monthly rate.", icon: "🥋" },
              { step: "3", title: "Add More Members", desc: "Every additional family member enrolls at 50% off their monthly tuition.", icon: "🎉" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-sm mx-auto mb-3">
                  {item.step}
                </div>
                <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Area */}
        {step === "info" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-black mb-2">Create Your Family Account</h2>
              <p className="text-white/60 mb-6">Enter the primary contact's information to get started.</p>
              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Primary Contact Name *</label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email Address *</label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg py-6 h-auto uppercase tracking-wider"
                >
                  Continue to Payment <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-red-400" />
                <div>
                  <h2 className="text-xl font-black">Family Registration Fee</h2>
                  <p className="text-white/60 text-sm">One-time charge — covers your entire family</p>
                </div>
                <div className="ml-auto text-3xl font-black text-red-400">$99</div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Primary Contact</span>
                  <span className="font-medium">{contactName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Email</span>
                  <span className="font-medium">{contactEmail}</span>
                </div>
              </div>

              {tokenizerError && (
                <div className="rounded-lg bg-yellow-900/40 border border-yellow-600/50 p-4 text-yellow-300 text-sm mb-4">
                  <p className="font-bold mb-1">⚠️ Payment system temporarily unavailable</p>
                  <p>
                    Please try again in a few minutes, or call us at <strong>(877) 4-MYDOJO</strong> to complete your enrollment over the phone.
                  </p>
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Card Number</label>
                  {!tokenizerReady && !tokenizerError && (
                    <div className="bg-white/10 border border-white/20 rounded-lg p-3 min-h-[56px] flex items-center gap-2 text-white/40 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading secure payment form...
                    </div>
                  )}
                  <div
                    id="card-number"
                    className={`rounded-lg min-h-[56px] ${!tokenizerReady ? "hidden" : ""}`}
                  />
                </div>

                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Shield className="w-4 h-4" />
                  <span>Secured by FluidPay — your card data is encrypted and never stored on our servers.</span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !tokenizerReady || tokenizerError}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-lg py-6 h-auto uppercase tracking-wider disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      PAY $99 & CREATE FAMILY ACCOUNT <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-white/50 hover:text-white"
                  onClick={() => setStep("info")}
                >
                  ← Back
                </Button>
              </form>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="max-w-xl mx-auto text-center">
            <div className="bg-gradient-to-br from-green-900/40 to-black border border-green-500/30 rounded-2xl p-10">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h2 className="text-3xl font-black mb-3">Family Account Created! 🎉</h2>
              <p className="text-white/70 mb-2">
                Welcome to the MyDojo family, <span className="text-white font-bold">{contactName}</span>!
              </p>
              <p className="text-white/60 text-sm mb-8">
                Your $99 family registration fee has been processed. Your family account ID is{" "}
                <span className="text-green-400 font-mono font-bold">#{familyGroupId}</span>.
              </p>

              <div className="bg-white/5 rounded-xl p-6 mb-8 text-left space-y-3">
                <h3 className="font-bold text-lg mb-3">Your Family Benefits Are Active:</h3>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-white/70">
                    ✅ One-time $99 registration fee paid — no additional registration fees for any family member
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-white/70">
                    ✅ 2nd family member enrolls at <span className="text-red-400 font-bold">50% off</span> monthly tuition
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-white/70">
                    ✅ A confirmation has been sent to <span className="text-white font-medium">{contactEmail}</span>
                  </p>
                </div>
              </div>

              <p className="text-white/60 text-sm mb-6">
                To enroll your family members, visit our front desk or call us at{" "}
                <span className="text-white font-bold">(877) 4-MYDOJO</span> and mention your family account ID.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/programs">
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
                    View Programs
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold uppercase tracking-wider">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
