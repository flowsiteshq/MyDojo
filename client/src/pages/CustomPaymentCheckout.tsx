import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, Repeat, ShoppingBag, CheckCircle2, XCircle, Loader2,
  ShieldCheck, AlertTriangle, ArrowLeft, Lock,
} from "lucide-react";
import { toast } from "sonner";

type PaymentType = "one_time" | "recurring" | "merchandise";

interface MerchandiseItem {
  name: string;
  price: number;
  quantity: number;
}

// FluidPay Tokenizer global type
declare global {
  interface Window {
    Tokenizer?: new (config: {
      url?: string;
      apikey: string;
      container: string;
      submission: (resp: { token?: string; status?: string; error?: string }) => void;
      onLoad?: () => void;
      settings?: {
        payment?: { types?: string[] };
        styles?: {
          body?: Record<string, string>;
          inputs?: Record<string, string>;
          labels?: Record<string, string>;
        };
      };
    }) => { submit: (amount?: string) => void };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: PaymentType }) {
  const icons = { one_time: DollarSign, recurring: Repeat, merchandise: ShoppingBag };
  const Icon = icons[type];
  return <Icon className="h-5 w-5" />;
}

function TypeLabel({ type }: { type: PaymentType }) {
  const labels = { one_time: "One-Time Payment", recurring: "Recurring Membership", merchandise: "Merchandise" };
  return <span>{labels[type]}</span>;
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ title, amount, isRecurring, interval }: {
  title: string;
  amount: number;
  isRecurring: boolean;
  interval?: string | null;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-10">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-4">Thank you for your payment.</p>
          <div className="p-4 bg-green-50 rounded-lg mb-6">
            <p className="font-semibold text-green-800">{title}</p>
            <p className="text-2xl font-bold text-green-700 mt-1">${amount.toFixed(2)}</p>
            {isRecurring && interval && (
              <p className="text-sm text-green-600 mt-1">Recurring {interval} — first payment charged today</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            You'll receive a confirmation via email if provided. For questions, contact MyDojo at (877) 4-MYDOJO.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-10">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Link Unavailable</h1>
          <p className="text-muted-foreground">{message}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Please contact MyDojo at (877) 4-MYDOJO for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────

export default function CustomPaymentCheckout() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"info" | "payment" | "confirming" | "success" | "error">("info");
  const [successData, setSuccessData] = useState<{ amount: number; isRecurring: boolean; interval?: string | null } | null>(null);

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // Merchandise quantities
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // FluidPay tokenizer
  const tokenizerRef = useRef<{ submit: (amount?: string) => void } | null>(null);
  const tokenizerInitializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: link, isLoading, error } = trpc.customPayments.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token, retry: false }
  );

  // Process payment via FluidPay
  const processCheckoutMutation = trpc.customPayments.processCheckout.useMutation({
    onSuccess: (data) => {
      setSuccessData({
        amount: data.amountCharged,
        isRecurring: data.isRecurring,
        interval: link?.billingInterval,
      });
      setStep("success");
      setSubmitting(false);
    },
    onError: (err) => {
      const msg = err.message || 'Payment failed. Please try again.';
      toast.error(msg);
      // If token expired, reset the tokenizer so user can re-enter card details
      const isTokenExpired = msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('session');
      if (isTokenExpired) {
        tokenizerInitializedRef.current = false;
        tokenizerRef.current = null;
      }
      setStep('payment');
      setSubmitting(false);
    },
  });

  // Initialize merchandise quantities when link loads
  useEffect(() => {
    if (link?.type === "merchandise" && link.merchandiseItems) {
      const items = link.merchandiseItems as MerchandiseItem[];
      const initial: Record<number, number> = {};
      items.forEach((item, i) => { initial[i] = item.quantity; });
      setQuantities(initial);
    }
  }, [link]);

  // Pre-load FluidPay script on mount (same as working enrollment form)
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    if (window.Tokenizer) { setTokenizerReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerReady(true);
    script.onerror = () => toast.error("Failed to load payment form. Please check your connection and refresh.");
    document.head.appendChild(script);
  }, []);

  // Initialize tokenizer instance when payment step is shown and script is ready
  useEffect(() => {
    if (step !== "payment") return;
    if (!tokenizerReady || tokenizerInitializedRef.current) return;
    if (!window.Tokenizer) return;
    tokenizerInitializedRef.current = true;

    const FLUIDPAY_PUBLIC_KEY = import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "";

    try {
      const instance = new window.Tokenizer({
        url: "https://app.fluidpay.com",
        apikey: FLUIDPAY_PUBLIC_KEY,
        container: "#fluidpay-tokenizer-container",
        submission: (resp) => {
          if (resp.token) {
            const selectedItems = link?.type === "merchandise" && link.merchandiseItems
              ? (link.merchandiseItems as MerchandiseItem[]).map((item, i) => ({
                  name: item.name,
                  price: item.price,
                  quantity: quantities[i] ?? item.quantity,
                }))
              : undefined;

            processCheckoutMutation.mutate({
              token: token || "",
              fpToken: resp.token,
              customerName,
              customerEmail: customerEmail || undefined,
              customerPhone: customerPhone || undefined,
              selectedItems,
              shippingAddress: shippingAddress || undefined,
            });
          } else {
            const msg = resp.error || "Card tokenization failed. Please check your card details.";
            toast.error(msg);
            setSubmitting(false);
          }
        },
        onLoad: () => {},
        settings: {
          payment: { types: ["card"] },
          styles: {
            body: { "font-family": "inherit", "background-color": "transparent" },
            inputs: {
              "border-radius": "8px",
              "border": "2px solid #e2e8f0",
              "padding": "14px 16px",
              "font-size": "18px",
              "height": "56px",
              "color": "#111827",
              "background-color": "#ffffff",
            },
            labels: {
              "font-size": "15px",
              "font-weight": "600",
              "color": "#374151",
              "margin-bottom": "6px",
            },
          },
        },
      });
      tokenizerRef.current = instance;
    } catch (err: any) {
      toast.error(`Payment form error: ${err?.message || "Unknown error"}. Please refresh and try again.`);
    }
  }, [step, tokenizerReady]);

  const calculateTotal = () => {
    if (!link) return 0;
    if (link.type === "merchandise" && link.merchandiseItems) {
      const items = link.merchandiseItems as MerchandiseItem[];
      return items.reduce((sum, item, i) => sum + item.price * (quantities[i] ?? item.quantity), 0);
    }
    return parseFloat(link.amount as string || "0");
  };

  const handleInfoSubmit = () => {
    if (!customerName.trim()) { toast.error("Please enter your name"); return; }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast.error("Please enter a valid email address"); return;
    }
    if (link?.requiresShipping && !shippingAddress.trim()) {
      toast.error("Shipping address is required"); return;
    }
    setStep("payment");
  };

  const handlePaySubmit = () => {
    if (!tokenizerRef.current) {
      toast.error("Payment form not ready. Please wait a moment and try again.");
      return;
    }
    setSubmitting(true);
    setStep("confirming");
    tokenizerRef.current.submit(total.toFixed(2));
  };

  // ─── Render states ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !link) {
    return <ErrorScreen message={error?.message || "This payment link could not be found."} />;
  }

  if (step === "success" && successData) {
    return (
      <SuccessScreen
        title={link.title}
        amount={successData.amount}
        isRecurring={successData.isRecurring}
        interval={successData.interval}
      />
    );
  }

  if (step === "confirming") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Processing Payment...</h2>
            <p className="text-muted-foreground mt-2">Please don't close this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = calculateTotal();
  const items = link.type === "merchandise" ? link.merchandiseItems as MerchandiseItem[] | null : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/images/logo-full-black.webp"
            alt="MyDojo"
            className="h-10 mx-auto mb-4"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-white border rounded-full px-3 py-1 mb-3">
            <TypeIcon type={link.type as PaymentType} />
            <TypeLabel type={link.type as PaymentType} />
          </div>
          <h1 className="text-2xl font-bold">{link.title}</h1>
          {link.description && (
            <p className="text-muted-foreground mt-2 text-sm">{link.description}</p>
          )}
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {link.type === "merchandise" && items ? (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {quantities[i] ?? item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">${(item.price * (quantities[i] ?? item.quantity)).toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{link.title}</p>
                  {link.type === "recurring" && link.billingInterval && (
                    <p className="text-xs text-muted-foreground">
                      Billed {link.billingInterval}{link.billingCycles ? ` × ${link.billingCycles} cycles` : " (ongoing)"}
                    </p>
                  )}
                </div>
                <p className="text-xl font-bold">${total.toFixed(2)}</p>
              </div>
            )}

            {link.type === "recurring" && (() => {
              const downPayment = link.downPayment ? parseFloat(link.downPayment as string) : 0;
              const firstRecurringDate = link.firstRecurringDate
                ? new Date(link.firstRecurringDate as unknown as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : null;
              if (downPayment > 0) {
                return (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Due today:</strong> ${downPayment.toFixed(2)} (registration / down payment)
                      </span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Recurring charge:</strong> ${total.toFixed(2)}/{link.billingInterval} starting{" "}
                        {firstRecurringDate ? `on ${firstRecurringDate}` : `next ${link.billingInterval}`}
                        {link.billingCycles ? ` for ${link.billingCycles} billing cycles` : ""}
                      </span>
                    </div>
                  </div>
                );
              }
              const _today = new Date();
              const _anchor = _today.getDate() <= 14 ? 1 : 15;
              const _nextBill = new Date(_today);
              _nextBill.setMonth(_nextBill.getMonth() + 1);
              _nextBill.setDate(_anchor);
              const _nextBillStr = _nextBill.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              const _suffix = _anchor === 1 ? 'st' : 'th';
              return (
                <div className="flex items-start gap-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Your card will be charged <strong>${total.toFixed(2)}</strong> today, then <strong>${total.toFixed(2)}</strong> on the <strong>{_anchor}{_suffix} of each month</strong> starting {_nextBillStr}{link.billingCycles ? ` for ${link.billingCycles} billing cycles` : " until cancelled"}.
                  </span>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Step: Customer Info */}
        {step === "info" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-muted-foreground text-xs">(for receipt)</span></Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                />
              </div>
              {link.requiresShipping && (
                <div className="space-y-1.5">
                  <Label>Shipping Address *</Label>
                  <Textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              )}
              <Button
                className="w-full"
                onClick={handleInfoSubmit}
              >
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Payment (FluidPay Tokenizer) */}
        {step === "payment" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Secure Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Paying as: <strong>{customerName}</strong>
                {customerEmail && <> · {customerEmail}</>}
              </div>

              {/* FluidPay tokenizer iframe container */}
              <div
                id="fluidpay-tokenizer-container"
                style={{ minHeight: 220 }}
                className="w-full"
              />

              {!tokenizerReady && (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading secure payment form…
                </div>
              )}

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 text-base"
                onClick={handlePaySubmit}
                disabled={!tokenizerReady || submitting}
              >
                <Lock className="mr-2 h-4 w-4" />
                {link.type === "recurring"
                  ? `Save Card & Start $${total.toFixed(2)}/${link.billingInterval} Membership`
                  : `Pay $${total.toFixed(2)}`}
              </Button>

              <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Secured by FluidPay · All major cards accepted
              </p>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setStep("info")}
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Back to info
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
