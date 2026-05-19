/**
 * ShopCheckoutModal.tsx
 * FluidPay-powered checkout modal for the MyDojo shop.
 * Uses the same Tokenizer pattern as BuyDayPass and the enrollment form.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, Lock, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

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

export interface ShopProduct {
  id: string;
  name: string;
  price: number; // in dollars
  image: string;
  sizes?: string[];
  category: string;
}

interface Props {
  product: ShopProduct | null;
  open: boolean;
  onClose: () => void;
}

type Step = "info" | "payment" | "success";

export function ShopCheckoutModal({ product, open, onClose }: Props) {
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("");
  const [infoError, setInfoError] = useState<string | null>(null);

  // Payment state
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const tokenizerRef = useRef<Tokenizer | null>(null);
  const tokenizerInitRef = useRef(false);

  const purchaseMutation = trpc.shop.purchaseProduct.useMutation();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("info");
        setName("");
        setEmail("");
        setPhone("");
        setSize("");
        setInfoError(null);
        setCardError(null);
        setProcessing(false);
        tokenizerRef.current = null;
        tokenizerInitRef.current = false;
      }, 300);
    }
  }, [open]);

  // Load FluidPay tokenizer script
  useEffect(() => {
    if (!open) return;
    const existing = document.getElementById("fluidpay-tokenizer-script");
    if (existing) { setScriptLoaded(true); return; }
    const script = document.createElement("script");
    script.id = "fluidpay-tokenizer-script";
    script.src = `${FLUIDPAY_URL}/tokenizer/tokenizer.js`;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setCardError("Failed to load payment form.");
    document.head.appendChild(script);
  }, [open]);

  // Initialize tokenizer when entering payment step
  useEffect(() => {
    if (step !== "payment" || !scriptLoaded || tokenizerInitRef.current) return;
    const timer = setTimeout(() => {
      try {
        tokenizerRef.current = new Tokenizer({
          url: FLUIDPAY_URL,
          apikey: FLUIDPAY_PUBLIC_KEY,
          container: "#shop-fp-card-container",
          submission: handleTokenResponse,
          settings: {
            payment: {
              types: ["card"],
              card: { requireCVV: true, mask_number: true },
            },
            styles: {
              body: { color: "#111827", "background-color": "transparent" },
              ".input-field": {
                color: "#111827",
                "background-color": "#f9fafb",
                border: "1px solid #d1d5db",
                "border-radius": "8px",
                padding: "12px 14px",
                "font-size": "16px",
              },
              "::placeholder": { color: "#9ca3af" },
            },
          },
        });
        tokenizerInitRef.current = true;
      } catch {
        setCardError("Failed to initialize payment form. Please refresh and try again.");
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [step, scriptLoaded]); // eslint-disable-line

  const handleTokenResponse = useCallback(
    async (resp: { status: string; token?: string; msg?: string }) => {
      if (resp.status !== "success" || !resp.token) {
        setCardError(
          resp.status === "validation"
            ? "Please check your card details and try again."
            : resp.msg || "Card tokenization failed."
        );
        setProcessing(false);
        return;
      }
      if (!product) return;
      try {
        await purchaseMutation.mutateAsync({
          token: resp.token,
          productId: product.id,
          productName: product.name,
          amountCents: Math.round(product.price * 100),
          size: size || undefined,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || undefined,
        });
        setStep("success");
        toast.success(`Order placed! Check your email for confirmation.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
        setCardError(msg);
        setProcessing(false);
      }
    },
    [product, name, email, phone, size, purchaseMutation]
  );

  const handleInfoNext = () => {
    setInfoError(null);
    if (!name.trim()) return setInfoError("Please enter your name.");
    if (!email.trim() || !email.includes("@")) return setInfoError("Please enter a valid email.");
    if (product?.sizes && product.sizes.length > 0 && !size) return setInfoError("Please select a size.");
    setStep("payment");
  };

  const handlePay = () => {
    if (!tokenizerRef.current) {
      setCardError("Payment form not ready. Please wait a moment.");
      return;
    }
    setProcessing(true);
    setCardError(null);
    tokenizerRef.current.submit();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !processing) onClose(); }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            {step === "success" ? "Order Confirmed!" : `Buy ${product.name}`}
          </DialogTitle>
        </DialogHeader>

        {/* Product summary */}
        {step !== "success" && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
            <img src={product.image} alt={product.name} className="w-16 h-16 object-contain rounded" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{product.name}</p>
              <p className="text-xs text-gray-500">{product.category}</p>
              {size && <p className="text-xs text-primary font-medium">Size: {size}</p>}
            </div>
            <p className="font-black text-lg text-primary">${product.price.toFixed(2)}</p>
          </div>
        )}

        {/* Step: Info */}
        {step === "info" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shop-name">Full Name *</Label>
              <Input
                id="shop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shop-email">Email Address *</Label>
              <Input
                id="shop-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shop-phone">Phone (optional)</Label>
              <Input
                id="shop-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="mt-1"
              />
            </div>
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <Label>Size *</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {infoError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{infoError}</p>
            )}
            <Button onClick={handleInfoNext} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
              Continue to Payment — ${product.price.toFixed(2)}
            </Button>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 uppercase tracking-wider">Card Details</Label>
              <div className="mt-2 border border-gray-200 rounded-lg p-4 min-h-[120px] bg-gray-50">
                {!scriptLoaded && (
                  <div className="flex items-center justify-center gap-2 py-4 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading payment form…</span>
                  </div>
                )}
                <div id="shop-fp-card-container" />
              </div>
              {cardError && (
                <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{cardError}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              <span>Secured by FluidPay — your card details are encrypted and never stored</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setStep("info"); tokenizerInitRef.current = false; tokenizerRef.current = null; }}
                disabled={processing}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handlePay}
                disabled={processing || !scriptLoaded}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing…</>
                ) : (
                  `Pay $${product.price.toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Thank you, {name.split(" ")[0]}!</h3>
              <p className="text-gray-600 mt-1">
                Your order for <strong>{product.name}</strong>{size ? ` (Size: ${size})` : ""} has been placed.
              </p>
              <p className="text-sm text-gray-500 mt-2">A confirmation will be sent to <strong>{email}</strong>.</p>
            </div>
            <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
              Continue Shopping
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
