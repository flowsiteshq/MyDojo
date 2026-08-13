/**
 * StripePaymentForm.tsx
 * Reusable Stripe Payment Elements form component.
 * Supports Apple Pay, Google Pay, and Link via ExpressCheckoutElement,
 * plus the standard card / bank form via PaymentElement.
 *
 * Usage:
 *   <StripePaymentForm
 *     clientSecret={clientSecret}   // from server: createPaymentIntent or createSetupIntent
 *     mode="payment"                // "payment" for one-time, "setup" for recurring card save
 *     onSuccess={(result) => ...}   // called with paymentIntent or setupIntent on success
 *     onError={(msg) => ...}        // called with error message string
 *     submitLabel="Pay $149"
 *     loading={false}
 *   />
 */

import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe as StripeInstance,
  type StripeExpressCheckoutElementConfirmEvent,
  type StripePaymentElementOptions,
} from "@stripe/stripe-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

// Load Stripe once at module level
let stripePromise: Promise<StripeInstance | null> | null = null;
function getStripePromise() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// ── Inner form (must be inside <Elements>) ──────────────────────────────────

interface InnerFormProps {
  mode: "payment" | "setup";
  submitLabel: string;
  loading?: boolean;
  onSuccess: (result: { paymentIntentId?: string; setupIntentId?: string; paymentMethodId?: string }) => void;
  onError: (message: string) => void;
}

function InnerForm({ mode, submitLabel, loading, onSuccess, onError }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expressAvailable, setExpressAvailable] = useState(false);

  // ── Express checkout (Apple Pay / Google Pay / Link) ──────────────────────
  const handleExpressConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErrorMsg(null);

    if (mode === "payment") {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });
      if (error) {
        const msg = error.message || "Payment failed. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      } else if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
        onSuccess({ paymentIntentId: paymentIntent.id });
      } else {
        const msg = "Payment did not complete. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      }
    } else {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });
      if (error) {
        const msg = error.message || "Could not save card. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      } else if (setupIntent?.status === "succeeded") {
        const pmId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method?.id;
        onSuccess({ setupIntentId: setupIntent.id, paymentMethodId: pmId });
      } else {
        const msg = "Card setup did not complete. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      }
    }
    setSubmitting(false);
  };

  // ── Standard card form submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      const msg = submitError.message || "Please check your card details.";
      setErrorMsg(msg);
      onError(msg);
      setSubmitting(false);
      return;
    }

    if (mode === "payment") {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) {
        const msg = error.message || "Payment failed. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      } else if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
        onSuccess({ paymentIntentId: paymentIntent.id });
      } else {
        const msg = "Payment did not complete. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      }
    } else {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });
      if (error) {
        const msg = error.message || "Could not save card. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      } else if (setupIntent?.status === "succeeded") {
        const pmId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method?.id;
        onSuccess({ setupIntentId: setupIntent.id, paymentMethodId: pmId });
      } else {
        const msg = "Card setup did not complete. Please try again.";
        setErrorMsg(msg);
        onError(msg);
      }
    }

    setSubmitting(false);
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    // Use accordion layout — more reliable on iOS Safari than tabs
    layout: {
      type: "accordion",
      defaultCollapsed: false,
      radios: false,
      spacedAccordionItems: false,
    },
    defaultValues: {
      billingDetails: {},
    },
  };

  const isDisabled = submitting || loading || !stripe || !elements;

  return (
    <div className="space-y-4">
      {/* ── Express Checkout (Apple Pay / Google Pay / Link) ── */}
      <ExpressCheckoutElement
        onConfirm={handleExpressConfirm}
        onReady={(event) => {
          // Show divider only if at least one express method is available
          setExpressAvailable((event.availablePaymentMethods?.applePay ?? false) ||
            (event.availablePaymentMethods?.googlePay ?? false) ||
            (event.availablePaymentMethods?.link ?? false));
        }}
        options={{
          buttonType: {
            applePay: mode === "setup" ? "plain" : "buy",
            googlePay: mode === "setup" ? "plain" : "buy",
          },
          buttonTheme: {
            applePay: "black",
            googlePay: "black",
          },
          layout: { maxColumns: 1, maxRows: 3, overflow: "never" },
        }}
      />

      {/* Divider shown only when express methods are available */}
      {expressAvailable && (
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or pay with card</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>
      )}

      {/* ── Standard card / bank form ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* min-height prevents blank render on iOS Safari while Stripe iframes load */}
        <div style={{ minHeight: 200 }}>
          <PaymentElement options={paymentElementOptions} />
        </div>

        {errorMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </p>
        )}

        <Button
          type="submit"
          disabled={isDisabled}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 text-base"
        >
          {(submitting || loading) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Secure payment · Apple Pay &amp; Google Pay supported
        </p>
      </form>
    </div>
  );
}

// ── Public component ────────────────────────────────────────────────────────

export interface StripePaymentFormProps {
  /** clientSecret from server: either a PaymentIntent or SetupIntent secret */
  clientSecret: string;
  /** "payment" for one-time charges, "setup" for saving a card for recurring billing */
  mode: "payment" | "setup";
  /** Label for the submit button, e.g. "Pay $149.00" */
  submitLabel?: string;
  /** External loading state (e.g. while server is creating the intent) */
  loading?: boolean;
  /** Called when payment/setup succeeds */
  onSuccess: (result: { paymentIntentId?: string; setupIntentId?: string; paymentMethodId?: string }) => void;
  /** Called with a user-facing error message */
  onError: (message: string) => void;
  /** Optional Stripe appearance theme */
  appearance?: Record<string, unknown>;
}

export function StripePaymentForm({
  clientSecret,
  mode,
  submitLabel = mode === "payment" ? "Pay Now" : "Save Card",
  loading,
  onSuccess,
  onError,
  appearance,
}: StripePaymentFormProps) {
  const defaultAppearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#e11d48",
      colorBackground: "#ffffff",
      colorText: "#1a1a1a",
      colorDanger: "#dc2626",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "8px",
    },
  };

  return (
    <Elements
      stripe={getStripePromise()}
      options={{
        clientSecret,
        appearance: (appearance as any) || defaultAppearance,
        // Explicitly declare mode so PaymentElement renders correctly on iOS Safari
        // without this, card fields can appear blank on mobile
        loader: "always",
      }}
    >
      <InnerForm
        mode={mode}
        submitLabel={submitLabel}
        loading={loading}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default StripePaymentForm;
