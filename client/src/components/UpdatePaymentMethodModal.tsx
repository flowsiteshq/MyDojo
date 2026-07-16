/**
 * UpdatePaymentMethodModal
 * Allows admin/staff to swap the credit card on file for a student enrollment.
 * - FluidPay enrollments: uses the FluidPay tokenizer (same as enrollment form)
 * - Stripe enrollments: uses Stripe Elements (CardElement) via a SetupIntent
 */
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Enrollment {
  id: number;
  customerName: string;
  fluidpayCustomerId?: string | null;
  stripeCustomerId?: string | null;
}

interface Props {
  enrollment: Enrollment | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Stripe publishable key ───────────────────────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

// ─── Stripe card update inner form ───────────────────────────────────────────

function StripeCardForm({
  enrollmentId,
  onSuccess,
  onClose,
}: {
  enrollmentId: number;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const updateCard = trpc.admin.updateEnrollmentPaymentMethod.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Card updated successfully! New card ending in ${data.cardLast4} (${data.cardType})`
      );
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update card");
      setSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setSubmitting(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      toast.error(error.message || "Card error");
      setSubmitting(false);
      return;
    }

    updateCard.mutate({
      enrollmentId,
      stripePaymentMethodId: paymentMethod.id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1a1a1a",
                fontFamily: "system-ui, sans-serif",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={submitting || !stripe}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save New Card"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── FluidPay tokenizer card update form ─────────────────────────────────────

function FluidPayCardForm({
  enrollmentId,
  onSuccess,
  onClose,
}: {
  enrollmentId: number;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const [tokenizerReady, setTokenizerReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const tokenizerRef = useRef<{ submit: (amount?: string) => void } | null>(null);
  const initializedRef = useRef(false);

  const updateCard = trpc.admin.updateEnrollmentPaymentMethod.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Card updated! New card ending in ${data.cardLast4} (${data.cardType})`
      );
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update card");
      setSubmitting(false);
    },
  });

  // Load FluidPay tokenizer script
  useEffect(() => {
    if (document.querySelector('script[src*="fluidpay.com/tokenizer"]')) {
      setTokenizerReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://app.fluidpay.com/tokenizer/tokenizer.js";
    script.async = true;
    script.onload = () => setTokenizerReady(true);
    document.head.appendChild(script);
  }, []);

  // Initialize tokenizer once script is ready
  useEffect(() => {
    if (!tokenizerReady || initializedRef.current) return;
    initializedRef.current = true;

    const win = window as any;
    if (!win.Tokenizer) return;

    const instance = new win.Tokenizer({
      apikey: import.meta.env.VITE_FLUIDPAY_PUBLIC_KEY || "",
      container: "#fp-update-card-container",
      submission: (resp: any) => {
        if (resp.status !== "success" || !resp.token) {
          toast.error(resp.msg || "Card tokenization failed");
          setSubmitting(false);
          return;
        }
        updateCard.mutate({ enrollmentId, fpToken: resp.token });
      },
      settings: {
        payment: {
          types: ["card"],
          card: { require_cvv: true },
        },
        styles: {
          body: { color: "#1a1a1a", "font-size": "16px" },
          ".payment-fields": { padding: "0" },
          ".payment-field": { "margin-bottom": "12px" },
          input: {
            border: "1px solid #d1d5db",
            "border-radius": "8px",
            padding: "10px 14px",
            "font-size": "16px",
            color: "#1a1a1a",
          },
          "input::placeholder": { color: "#9ca3af" },
          "input:focus": { "border-color": "#ef4444", outline: "none" },
        },
      },
    });

    tokenizerRef.current = instance;
  }, [tokenizerReady, enrollmentId]);

  const handleSubmit = () => {
    if (!tokenizerRef.current) return;
    setSubmitting(true);
    tokenizerRef.current.submit();
  };

  return (
    <div className="space-y-4">
      {!tokenizerReady && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-red-600 mr-2" />
          <span className="text-gray-600">Loading card form…</span>
        </div>
      )}
      <div id="fp-update-card-container" className={tokenizerReady ? "block min-h-[120px]" : "hidden"} />
      {tokenizerReady && (
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Save New Card"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function UpdatePaymentMethodModal({ enrollment, open, onClose, onSuccess }: Props) {
  if (!enrollment) return null;

  const isStripe = !!enrollment.stripeCustomerId && !enrollment.fluidpayCustomerId;
  const isFluidPay = !!enrollment.fluidpayCustomerId;

  // For Stripe: fetch a SetupIntent client secret when modal opens
  const createSetupIntent = trpc.admin.createSetupIntentForEnrollment.useMutation();
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStripeClientSecret(null);
      return;
    }
    if (isStripe) {
      createSetupIntent.mutate(
        { enrollmentId: enrollment.id },
        {
          onSuccess: (data) => setStripeClientSecret(data.clientSecret ?? null),
          onError: (err) => toast.error(err.message || "Could not initialize card form"),
        }
      );
    }
  }, [open, enrollment.id, isStripe]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-600" />
            Update Payment Method
          </DialogTitle>
          <DialogDescription>
            Replace the card on file for <strong>{enrollment.customerName}</strong>.
            The new card will be charged on the next billing date.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {/* ── Stripe path ── */}
          {isStripe && (
            <>
              {!stripeClientSecret ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-red-600 mr-2" />
                  <span className="text-gray-600">Initializing…</span>
                </div>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                  <StripeCardForm
                    enrollmentId={enrollment.id}
                    onSuccess={onSuccess}
                    onClose={onClose}
                  />
                </Elements>
              )}
            </>
          )}

          {/* ── FluidPay path ── */}
          {isFluidPay && (
            <FluidPayCardForm
              enrollmentId={enrollment.id}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}

          {/* ── Neither ── */}
          {!isStripe && !isFluidPay && (
            <div className="py-6 text-center text-gray-500">
              <p>This enrollment has no payment processor linked.</p>
              <p className="text-sm mt-1">Contact support to update the payment method manually.</p>
              <Button variant="outline" className="mt-4" onClick={onClose}>Close</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
