import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, Repeat, ShoppingBag, CheckCircle2, XCircle, Loader2,
  ShieldCheck, AlertTriangle, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { StripePaymentForm } from "@/components/StripePaymentForm";

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
  const [step, setStep] = useState<"info" | "payment" | "confirming" | "success" | "error">("info");
  const [successData, setSuccessData] = useState<{ amount: number; isRecurring: boolean; interval?: string | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // Merchandise quantities
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // Stripe intent data (returned from createStripeIntent)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeMode, setStripeMode] = useState<"payment" | "setup">("payment");
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [stripeIntentId, setStripeIntentId] = useState<string | null>(null);
  const [intentAmountDollars, setIntentAmountDollars] = useState(0);

  const { data: link, isLoading, error } = trpc.customPayments.getByToken.useQuery(
    { token: token || "" },
    { enabled: !!token, retry: false }
  );

  // Step 1: Create Stripe intent when user moves to payment step
  const createIntentMutation = trpc.customPayments.createStripeIntent.useMutation({
    onSuccess: (data) => {
      setStripeClientSecret(data.clientSecret);
      setStripeMode(data.mode);
      setStripeCustomerId(data.stripeCustomerId);
      setStripeIntentId(data.mode === "setup" ? (data.setupIntentId ?? null) : (data.paymentIntentId ?? null));
      setIntentAmountDollars(data.amountDollars);
      setStep("payment");
    },
    onError: (err) => {
      toast.error(err.message || "Could not initialize payment. Please try again.");
    },
  });

  // Step 2: Confirm payment after Stripe processes it
  const confirmMutation = trpc.customPayments.confirmStripeCheckout.useMutation({
    onSuccess: (data) => {
      setSuccessData({
        amount: data.amountCharged,
        isRecurring: data.isRecurring,
        interval: link?.billingInterval,
      });
      setStep("success");
    },
    onError: (err) => {
      toast.error(err.message || "Payment confirmation failed. Please contact us.");
      setStep("payment");
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

    // Create Stripe intent
    const selectedItems = link?.type === "merchandise" && link.merchandiseItems
      ? (link.merchandiseItems as MerchandiseItem[]).map((item, i) => ({
          name: item.name,
          price: item.price,
          quantity: quantities[i] ?? item.quantity,
        }))
      : undefined;

    createIntentMutation.mutate({
      token: token || "",
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone: customerPhone || undefined,
      selectedItems,
    });
  };

  // Called by StripePaymentForm on success
  const handleStripeSuccess = (result: { paymentIntentId?: string; setupIntentId?: string; paymentMethodId?: string }) => {
    setStep("confirming");
    const selectedItems = link?.type === "merchandise" && link.merchandiseItems
      ? (link.merchandiseItems as MerchandiseItem[]).map((item, i) => ({
          name: item.name,
          price: item.price,
          quantity: quantities[i] ?? item.quantity,
        }))
      : undefined;

    confirmMutation.mutate({
      token: token || "",
      stripeCustomerId: stripeCustomerId || "",
      paymentIntentId: result.paymentIntentId,
      setupIntentId: result.setupIntentId,
      paymentMethodId: result.paymentMethodId,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone: customerPhone || undefined,
      selectedItems,
      shippingAddress: shippingAddress || undefined,
    });
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
            <h2 className="text-xl font-semibold">Confirming Payment...</h2>
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
              // 1st/15th billing cycle rule: compute next bill date for display
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
                disabled={createIntentMutation.isPending}
              >
                {createIntentMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up payment…</>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Payment (Stripe Payment Elements) */}
        {step === "payment" && stripeClientSecret && (
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

              <StripePaymentForm
                clientSecret={stripeClientSecret}
                mode={stripeMode}
                submitLabel={
                  stripeMode === "setup"
                    ? `Save Card & Start $${intentAmountDollars.toFixed(2)}/${link.billingInterval} Membership`
                    : `Pay $${intentAmountDollars.toFixed(2)}`
                }
                onSuccess={handleStripeSuccess}
                onError={(msg) => toast.error(msg)}
              />

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
