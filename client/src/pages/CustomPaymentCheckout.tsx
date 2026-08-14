import { useMemo, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Repeat,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

type PaymentType = "one_time" | "recurring" | "merchandise";

interface MerchandiseItem {
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutSession {
  clientSecret: string;
  mode: "payment" | "setup";
  stripeCustomerId: string;
  paymentIntentId?: string;
  setupIntentId?: string;
  amountDollars: number;
}

function TypeIcon({ type }: { type: PaymentType }) {
  const icons = { one_time: DollarSign, recurring: Repeat, merchandise: ShoppingBag };
  const Icon = icons[type];
  return <Icon className="h-5 w-5" />;
}

function TypeLabel({ type }: { type: PaymentType }) {
  const labels = {
    one_time: "One-time payment",
    recurring: "Membership enrollment",
    merchandise: "Merchandise order",
  };
  return <span>{labels[type]}</span>;
}

function OutcomeScreen({
  success,
  title,
  amount,
  isRecurring,
  interval,
  message,
}: {
  success: boolean;
  title: string;
  amount?: number;
  isRecurring?: boolean;
  interval?: string | null;
  message?: string;
}) {
  const Icon = success ? CheckCircle2 : XCircle;
  return (
    <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200 shadow-xl shadow-slate-200/50">
        <CardContent className="pt-10 pb-10 text-center">
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${success ? "bg-emerald-100" : "bg-rose-100"}`}>
            <Icon className={`h-10 w-10 ${success ? "text-emerald-600" : "text-rose-600"}`} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">MyDojo</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{success ? "Payment confirmed" : "Payment could not be completed"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {message || (success ? "Your payment was recorded successfully." : "No payment was recorded. Please try again or contact MyDojo for help.")}
          </p>
          {success && amount !== undefined && (
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-left">
              <p className="font-semibold text-emerald-950">{title}</p>
              <p className="mt-1 text-3xl font-bold text-emerald-700">${amount.toFixed(2)}</p>
              {isRecurring && interval && <p className="mt-1 text-xs text-emerald-700">Recurring {interval} billing is now active.</p>}
            </div>
          )}
          <p className="mt-7 text-xs text-slate-500">Questions? Call or text MyDojo at (877) 4-MYDOJO.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomPaymentCheckout() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"info" | "checkout" | "success" | "error">("info");
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const [failureMessage, setFailureMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: link, isLoading, error } = trpc.customPayments.getByToken.useQuery(
    { token: token || "" },
    { enabled: Boolean(token), retry: false },
  );

  const items = useMemo(
    () => (link?.type === "merchandise" ? (link.merchandiseItems as MerchandiseItem[] | null) : null),
    [link],
  );

  const selectedItems = useMemo(
    () => items?.map((item, index) => ({
      name: item.name,
      price: item.price,
      quantity: quantities[index] ?? item.quantity,
    })),
    [items, quantities],
  );

  const total = useMemo(() => {
    if (!link) return 0;
    if (items) return selectedItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    return Number.parseFloat(String(link.amount || "0"));
  }, [items, link, selectedItems]);

  const startCheckout = trpc.customPayments.createStripeIntent.useMutation({
    onSuccess: (result) => {
      setCheckoutSession(result as CheckoutSession);
      setStep("checkout");
    },
    onError: (err) => toast.error(err.message || "We could not start secure checkout. Please try again."),
  });

  const confirmCheckout = trpc.customPayments.confirmStripeCheckout.useMutation({
    onSuccess: (result) => {
      setSuccessAmount(result.amountCharged);
      setStep("success");
    },
    onError: (err) => {
      setFailureMessage(err.message || "Your payment was not recorded. Please try again.");
      setStep("error");
    },
  });

  const handleInfoSubmit = () => {
    if (!customerName.trim()) return toast.error("Please enter your name.");
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return toast.error("Please enter a valid email address.");
    if (link?.requiresShipping && !shippingAddress.trim()) return toast.error("A shipping address is required for this order.");
    startCheckout.mutate({
      token: token || "",
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
      selectedItems: selectedItems,
    });
  };

  const handleStripeSuccess = (result: { paymentIntentId?: string; setupIntentId?: string; paymentMethodId?: string }) => {
    if (!checkoutSession || !link) return;
    confirmCheckout.mutate({
      token: token || "",
      stripeCustomerId: checkoutSession.stripeCustomerId,
      paymentIntentId: result.paymentIntentId || checkoutSession.paymentIntentId,
      setupIntentId: result.setupIntentId || checkoutSession.setupIntentId,
      paymentMethodId: result.paymentMethodId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
      selectedItems,
      shippingAddress: shippingAddress.trim() || undefined,
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !link) {
    return <OutcomeScreen success={false} title="Payment link" message={error?.message || "This payment link is unavailable."} />;
  }

  if (step === "success") {
    return <OutcomeScreen success title={link.title} amount={successAmount ?? total} isRecurring={link.type === "recurring"} interval={link.billingInterval} />;
  }

  if (step === "error") {
    return <OutcomeScreen success={false} title={link.title} message={failureMessage} />;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="text-center">
          <img src="/images/logo-full-black.webp" alt="MyDojo" className="mx-auto mb-5 h-10" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            <TypeIcon type={link.type as PaymentType} />
            <TypeLabel type={link.type as PaymentType} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{link.title}</h1>
          {link.description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{link.description}</p>}
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {items ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input aria-label={`${item.name} quantity`} type="number" min={1} className="h-9 w-16 text-center" value={quantities[index] ?? item.quantity} onChange={(event) => setQuantities((current) => ({ ...current, [index]: Math.max(1, Number(event.target.value) || 1) }))} />
                      <p className="w-20 text-right text-sm font-semibold">${(item.price * (quantities[index] ?? item.quantity)).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{link.title}</p>
                  {link.type === "recurring" && <p className="mt-1 text-xs text-slate-500">Securely saved for {link.billingInterval || "monthly"} billing. You can update your payment method any time.</p>}
                </div>
                <p className="text-xl font-bold text-slate-950">${total.toFixed(2)}</p>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-base font-bold text-slate-950"><span>Total due today</span><span>${total.toFixed(2)}</span></div>
          </CardContent>
        </Card>

        {step === "info" ? (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Your information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="payment-name">Full name</Label><Input id="payment-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" placeholder="Jane Smith" /></div>
              <div className="space-y-1.5"><Label htmlFor="payment-email">Email for your receipt</Label><Input id="payment-email" type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} autoComplete="email" placeholder="jane@example.com" /></div>
              <div className="space-y-1.5"><Label htmlFor="payment-phone">Phone <span className="text-slate-400">(optional)</span></Label><Input id="payment-phone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} autoComplete="tel" placeholder="(555) 000-0000" /></div>
              {link.requiresShipping && <div className="space-y-1.5"><Label htmlFor="payment-shipping">Shipping address</Label><Textarea id="payment-shipping" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="123 Main St, City, State, ZIP" rows={2} /></div>}
              <Button className="h-12 w-full font-semibold" onClick={handleInfoSubmit} disabled={startCheckout.isPending}><Lock className="mr-2 h-4 w-4" />{startCheckout.isPending ? "Preparing secure checkout…" : "Continue securely"}</Button>
            </CardContent>
          </Card>
        ) : checkoutSession ? (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-emerald-600" />Secure payment</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-5">
              <p className="text-sm text-slate-600">Paying as <strong className="text-slate-900">{customerName}</strong>{customerEmail && ` · ${customerEmail}`}</p>
              <StripePaymentForm clientSecret={checkoutSession.clientSecret} mode={checkoutSession.mode} submitLabel={link.type === "recurring" ? `Start ${link.billingInterval || "monthly"} membership` : `Pay $${total.toFixed(2)}`} loading={confirmCheckout.isPending} onSuccess={handleStripeSuccess} onError={(message) => toast.error(message)} />
              <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500"><Lock className="h-3.5 w-3.5" />Card details are encrypted and never stored by MyDojo.</p>
              <Button variant="ghost" size="sm" className="w-full text-slate-500" disabled={confirmCheckout.isPending} onClick={() => { setCheckoutSession(null); setStep("info"); }}><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back to information</Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
