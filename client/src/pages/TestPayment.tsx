import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreditCard, CheckCircle, Shield, Loader2, ArrowRight, FlaskConical } from "lucide-react";
import { Link } from "wouter";

export default function TestPayment() {
  const [name, setName] = useState("MyDojo Test");
  const [email, setEmail] = useState("test@mydojoma.com");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [tokenizerError, setTokenizerError] = useState(false);
  const [result, setResult] = useState<{ transactionId: string; last4: string; cardType: string } | null>(null);
  const tokenizerRef = useRef<any>(null);
  const tokenizerInitRef = useRef(false);

  const testCharge = trpc.testCharge.useMutation();

  // Load FluidPay tokenizer script
  useEffect(() => {
    if (window.Tokenizer) { setTokenizerReady(true); return; }
    const existing = document.getElementById("fluidpay-tokenizer-v2");
    if (existing) {
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

  // Initialize tokenizer once script is ready
  useEffect(() => {
    if (!tokenizerReady || tokenizerInitRef.current || !window.Tokenizer) return;
    tokenizerInitRef.current = true;
    const FLUIDPAY_PUBLIC_KEY = import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "";
    try {
      tokenizerRef.current = new window.Tokenizer({
        apikey: FLUIDPAY_PUBLIC_KEY,
        container: "#test-card-number",
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
          testCharge.mutate(
            { name, email, token: resp.token },
            {
              onSuccess: (data) => {
                setResult({ transactionId: data.transactionId!, last4: data.last4!, cardType: data.cardType! });
                toast.success("✅ $1.00 test charge successful!", {
                  description: `Transaction ID: ${data.transactionId}`,
                });
                setIsLoading(false);
              },
              onError: (err: any) => {
                toast.error("Payment failed", { description: err.message || "Card declined." });
                setIsLoading(false);
              },
            }
          );
        },
      });
    } catch (err) {
      console.error("Tokenizer init failed", err);
      setTokenizerError(true);
    }
  }, [tokenizerReady]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenizerRef.current) { toast.error("Payment form not ready."); return; }
    setIsLoading(true);
    tokenizerRef.current.submit("1.00");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <img src="/images/logo.png" alt="MyDojo" className="h-10 object-contain" />
        </Link>
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-3 py-1">
          <FlaskConical className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Test Mode</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!result ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FlaskConical className="w-8 h-8 text-yellow-400" />
                </div>
                <h1 className="text-2xl font-black mb-2">$1 Test Transaction</h1>
                <p className="text-white/60 text-sm">
                  This will run a real <strong className="text-white">$1.00 charge</strong> through FluidPay to verify card processing is working correctly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Card Details</label>
                  {!tokenizerReady && !tokenizerError && (
                    <div className="bg-white/10 border border-white/20 rounded-lg p-3 min-h-[56px] flex items-center gap-2 text-white/40 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading secure payment form...
                    </div>
                  )}
                  {tokenizerError && (
                    <div className="rounded-lg bg-red-900/40 border border-red-600/50 p-4 text-red-300 text-sm">
                      ⚠️ Payment form unavailable. Please try again.
                    </div>
                  )}
                  <div id="test-card-number" className={`rounded-lg min-h-[56px] ${!tokenizerReady ? "hidden" : ""}`} />
                </div>

                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secured by FluidPay — real charge, real card required</span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !tokenizerReady || tokenizerError}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg py-6 h-auto uppercase tracking-wider disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <>RUN $1 TEST CHARGE <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-900/40 to-black border border-green-500/30 rounded-2xl p-10 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h2 className="text-3xl font-black mb-2 text-green-400">✅ SUCCESS</h2>
              <p className="text-white/70 mb-6">$1.00 charged successfully — FluidPay is working!</p>
              <div className="bg-white/5 rounded-xl p-6 text-left space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Amount</span>
                  <span className="font-bold text-green-400">$1.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Card</span>
                  <span className="font-medium">{result.cardType} ending in {result.last4}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Transaction ID</span>
                  <span className="font-mono text-xs text-white/80">{result.transactionId}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => { setResult(null); tokenizerInitRef.current = false; setTokenizerReady(false); setTimeout(() => setTokenizerReady(true), 100); }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase"
                >
                  Run Another Test
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="text-white/60 hover:text-white w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
