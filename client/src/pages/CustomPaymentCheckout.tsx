import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Repeat, ShoppingBag, CheckCircle2, XCircle, Loader2,
  ShieldCheck, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// Extend window for FluidPay tokenizer
declare global {
  interface Window {
    TokenizerCustomPayment?: {
      submit: (amount?: string) => void;
    };
  }
}

type PaymentType = "one_time" | "recurring" | "merchandise";

interface MerchandiseItem {
  name: string;
  price: number;
  quantity: number;
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
  const [step, setStep] = useState<"info" | "payment" | "processing" | "success" | "error">("info");
  const [successData, setSuccessData] = useState<{ amount: number; isRecurring: boolean; interval?: string | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // Merchandise quantities
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // FluidPay tokenizer
  const tokenizerContainerRef = useRef<HTMLDivElement>(null);
  const tokenizerReadyRef = useRef(false);
  const tokenizerInitRef = useRef(false);
  const [tokenizerLoaded, setTokenizerLoaded] = useState(false);

  const { data: link, isLoading, error } = trpc.customPayments.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token, retry: false }
  );

  const checkoutMutation = trpc.customPayments.processCheckout.useMutation({
    onSuccess: (data) => {
      setSuccessData({
        amount: data.amountCharged,
        isRecurring: data.isRecurring,
        interval: link?.billingInterval,
      });
      setStep("success");
    },
    onError: (err) => {
      toast.error(err.message || "Payment failed. Please try again.");
      setStep("payment");
    },
  });

  // Initialize merchandise quantities when link loads
  useEffect(() => {
    if (link?.type === "merchandise" && link.merchandiseItems) {
      const items = link.merchandiseItems as MerchandiseItem[];
      const initial: Record<number, number> = {};
      items.forEach((_, i) => { initial[i] = items[i].quantity; });
      setQuantities(initial);
    }
  }, [link]);

  // Load FluidPay tokenizer script
  useEffect(() => {
    if (step !== "payment") return;
    if (document.querySelector('script[src*="fluidpay.com/tokenizer"]')) {
      setTokenizerLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerLoaded(true);
    document.head.appendChild(script);
  }, [step]);

  // Initialize tokenizer when loaded
  useEffect(() => {
    if (!tokenizerLoaded || tokenizerInitRef.current || step !== "payment") return;
    if (!tokenizerContainerRef.current) return;
    tokenizerInitRef.current = true;

    const amount = calculateTotal().toFixed(2);

    const instance = new (window as any).Tokenizer({
      apikey: import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "",
      container: "#custom-payment-tokenizer",
      submission: (resp: any) => {
        if (resp?.token) {
          handleTokenReceived(resp.token);
        } else {
          toast.error("Card capture failed. Please try again.");
          setStep("payment");
        }
      },
      settings: {
        payment: {
          types: ["card"],
          card: { cvv: true },
        },
        amount,
        currency: "USD",
        title: link?.title || "MyDojo Payment",
        button_label: `Pay $${amount}`,
        show_billing_address: false,
      },
    });

    window.TokenizerCustomPayment = instance;
  }, [tokenizerLoaded, step]);

  const calculateTotal = () => {
    if (!link) return 0;
    if (link.type === "merchandise" && link.merchandiseItems) {
      const items = link.merchandiseItems as MerchandiseItem[];
      return items.reduce((sum, item, i) => sum + item.price * (quantities[i] ?? item.quantity), 0);
    }
    return parseFloat(link.amount as string || "0");
  };

  const handleTokenReceived = (fpToken: string) => {
    setStep("processing");
    const selectedItems = link?.type === "merchandise" && link.merchandiseItems
      ? (link.merchandiseItems as MerchandiseItem[]).map((item, i) => ({
          name: item.name,
          price: item.price,
          quantity: quantities[i] ?? item.quantity,
        }))
      : undefined;

    checkoutMutation.mutate({
      token: token || "",
      fpToken,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone: customerPhone || undefined,
      selectedItems,
      shippingAddress: shippingAddress || undefined,
    });
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

  const handlePaymentSubmit = () => {
    if (window.TokenizerCustomPayment) {
      window.TokenizerCustomPayment.submit();
    }
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

  if (step === "processing") {
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
                        {link.billingCycles ? ` for ${link.billingCycles} billing cycles` : " until cancelled"}.
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex items-start gap-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Your card will be charged <strong>${total.toFixed(2)}</strong> today and then automatically every{" "}
                    {link.billingInterval}{link.billingCycles ? ` for ${link.billingCycles} billing cycles` : " until cancelled"}.
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
              <Button className="w-full" onClick={handleInfoSubmit}>
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Payment */}
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

              {/* FluidPay tokenizer container */}
              <div id="custom-payment-tokenizer" ref={tokenizerContainerRef} className="min-h-[200px]">
                {!tokenizerLoaded && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep("info"); tokenizerInitRef.current = false; }}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handlePaymentSubmit}>
                  Pay ${total.toFixed(2)}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                🔒 Payments are securely processed by FluidPay. Your card information is never stored on our servers.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
